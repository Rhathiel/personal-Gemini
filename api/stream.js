import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';

// Gemini AI 초기화 함수
function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    history: history,
    config: {
      systemInstruction: `지시 사항 없음.`,
      temperature: 1.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      ],
      thinkingConfig: {
        thinkingBudget: -1,
        includeThoughts: showThoughts, 
      },
    },
    tools: [
      { googleSearch: {} },
    ],
  });
  return chat;
}

async function createOutput(chat, prompt) {
  try{  
    const stream = await chat.sendMessageStream({
      message: prompt, 
    });
    return stream;}
  catch (e){
    console.error(e);
    return e;
  }
}

export default async function handler(req, res) { //fetch 이후 동작
  const enc = new TextEncoder(); 
  const dec = new TextDecoder("utf-8");
  //문자열 암호화, 복호화

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
  };  

  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
      console.log("key, corseHeaders[key]: ", key, corsHeaders[key]);
    }
    res.status(200).end();
    return;
  } //CORS preflight 요청 처리

  if (req.method !== "POST") {
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(405).end( "Method Not Allowed" );
    return;
  } //주소로 바로 접근하는 경우 차단

  console.log("Processing POST request");

  let body = "";
  for await (const chunk of req) {
    body += dec.decode(chunk, { stream: true });
  }
  const { prompt, history } = JSON.parse(body);
  const chat = initAI(history, false);
  //전달받은 이진 데이터를 json으로 변환
  //전달받은 history로 ai 생성(이전 대화 기억)

  console.log("Received request");
  console.log("Prompt:", prompt);

  for (const key in headers){
    res.setHeader(key, headers[key]);
    console.log("key, headers[key]: ", key, headers[key]);
  }

  const output = await createOutput(chat, prompt);
  console.log(output);
  if(typeof output?.[Symbol.asyncIterator] !== "function"){
  //output이 asyncIterator가 아닌 경우
    console.log("에러 캐치 시작!");
    const e = JSON.stringfy(output,["error", "status", "code", "message"]);
    this.push(enc.encode(e));
    this.push(null);
    console.log("에러 캐치 성공!");
    return;
  }

  const stream = new Readable({
    read() {
      (async () => {
        for await (const chunk of output){ 
          if(  !chunk || //undefined,null
              (typeof chunk === "string" && chunk.trim() === "") || 
              (Object.getPrototypeOf(chunk) === Object.prototype && Object.keys(chunk).length === 0) ||
              (chunk instanceof Uint8Array && chunk.length === 0) ||
              (Buffer.isBuffer(chunk) && chunk.length === 0)
            ){ 
            console.log("빈 청크입니다");
            continue;
          }
          console.log(chunk);
          this.push(enc.encode(JSON.stringify(chunk)));
        }
        this.push(null);
      })();
    }
  });

  stream.pipe(res);
}
