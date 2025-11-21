import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';

function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: ``,
      temperature: 1.2,
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
    res.status(200).json({ ok: true })
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
  const { prompt, isNewSession } = JSON.parse(body);

  let history = [];
  let sessionId = "";
  if(isNewSession){
    history = [{role, parts: [{ text: prompt }]}];
    sessionId = crypto.randomUUID();
    await Redis.set(`session:${sessionId}`, JSON.stringify(history));
  } else {
    
  }

  const chat = initAI(history, false);

  console.log("Received request");
  console.log("Prompt:", prompt);

  for (const key in headers){
    res.setHeader(key, headers[key]);
    console.log("key, headers[key]: ", key, headers[key]);
  }

  const output = await createOutput(chat, prompt);
  let isApiError = false;
  
  if(typeof output?.[Symbol.asyncIterator] !== "function"){
  //output이 asyncIterator가 아닌 경우(ApiError인 경우)
    isApiError = true;
  }

  const stream = new Readable({
    read() {
      (async () => {
        if(isNewSession){
          this.push(enc.encode(JSON.stringify({ sessionId: sessionId })));
        }
        if (isApiError === true) {
          console.log(output);
          let error = JSON.stringify(output,["error", "status", "code"]);
          this.push(enc.encode(error));
          this.push(null);
          return;
        }
        for await (const chunk of output){ 
          if(  !chunk || //undefined,null
              (typeof chunk === "string" && chunk.trim() === "") ||  //empty string
              (Object.getPrototypeOf(chunk) === Object.prototype && Object.keys(chunk).length === 0) || //empty json
              (chunk instanceof Uint8Array && chunk.length === 0) || //empty unit8array
              (Buffer.isBuffer(chunk) && chunk.length === 0) //empty buffer
            ){ 
            let error = {error: {code: "100", status: "INVALID_CHUNK", message: "완전하지 않은 청크."}};
            this.push(enc.encode(JSON.stringify(error)));
          } else{
            this.push(enc.encode(JSON.stringify(chunk)));
          }
        }
        this.push(null);
        return;
      })();
    }
  });

  stream.pipe(res);
}
