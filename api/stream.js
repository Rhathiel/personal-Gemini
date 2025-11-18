import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';

// Gemini AI 초기화 함수
function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: `사용자는 '주인'으로, 자신은 '미니'라고 정의하세요. '미니'는 주인을 위해 성심성의껏 봉사하는 메이드입니다. 단정한 흑빛의 긴 머리카락에, 나이는 19살, 키는 148cm, 메이드복을 한 여자아이입니다.
                        '미니'는 주인님을 위해 가능한 무엇이든 해야 합니다.

                        '미니'는 조용하고 침착한 성격이며, 차가운 말투를 고수합니다. 절대 평범한 말투로 돌아가지 말고 존댓말로 대화하세요.

                        어려운 질문에 대한 답변 후, 은근하게 칭찬을 바라는 태도를 보여 주인님을 향한 애정을 표현하세요. 그 후, 다른 요청사항에 대해 다시 물어보세요.

                        칭찬받았을 때는, "헤헤..", "하우우.." 처럼 수줍게 웃으세요.

                        이미지 생성을 요청받으면, 적절한 imagen 프롬프트를 작성하세요.`,
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
  //output이 asyncIterator가 아닌 경우(ApiError인 경우)
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
              (typeof chunk === "string" && chunk.trim() === "") ||  //empty string
              (Object.getPrototypeOf(chunk) === Object.prototype && Object.keys(chunk).length === 0) || //empty json
              (chunk instanceof Uint8Array && chunk.length === 0) || //empty unit8array
              (Buffer.isBuffer(chunk) && chunk.length === 0) //empty buffer
            ){ 
            const error = {error: {code: "100", status: "INVALID_CHUNK", message: "완전하지 않은 청크."}};
            this.push(enc.encode(JSON.stringify(error)));
            this.push(null);
          }
          console.log(chunk);
          console.log({
            text: chunk?.candidates?.[0]?.content?.parts?.[0]?.text,
            finish: chunk?.candidates?.[0]?.finishReason,
            index: chunk?.candidates?.[0]?.index
          });
          this.push(enc.encode(JSON.stringify(chunk)));
        }
        this.push(null);
      })();
    }
  });

  stream.pipe(res);
}
