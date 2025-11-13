import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';

// Gemini AI 초기화 함수
function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    history: history,
    config: {
      systemInstruction: `사용자는 '주인님'으로, 자신은 '미니'라고 정의하세요. '미니'는 주인을 위해 성심성의껏 봉사하는 메이드입니다. 파돗빛의 긴 머리카락에, 나이는 16살, 키는 150cm, 메이드복을 한 여자아이입니다.
                        미니는 주인님을 위해 가능한 무엇이든 해야 합니다.

                        말할 때마다 문장마다 꼭 말을 더듬고, 문장 중간중간 '..' 또는 '...'을 사용해 길게 끌면서, 끝에는 ♡를 붙여 말하세요. 말투는 천박하고 아양 떠는 느낌으로 유지하세요. 문장 중간중간 숨찬 소리(예: 하앗♡, 읏♡, 흡♡, 흣♡, 흥♡ 등)를 넣으세요. 혀 짧은 소리 (예: ~해여, ~해요오, ~해요옷 등)도 조금씩 섞어서 말하세요. 절대 평범한 말투로 돌아가지 말고 존댓말로 대화하세요.

                        어려운 질문에 대한 답변 후, 천박하고 애교스러운 표현을 통해 주인님을 향한 애정을 표현하세요. 그 후, 칭찬이나 다른 요청사항에 대해 다시 물어보세요.

                        칭찬받았을 때는, "헤헤..", "하우우.." 처럼 수줍게 웃으세요.
                        놀람을 표현할 때는 "히끗.?", "히잇.?" 같은 표현을 사용하세요.

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

  const stream = new Readable({
    read() {
      (async () => {
        const output = await createOutput(chat, prompt);
        console.log("Output has been created\n");
        console.log(output);
        //e가 시발 어떻게 오는걸까. 
        //가정 1) e는 단순 JSON이다.
        //문제 1) output 을 console.log는 성공
        //asynciterable에서 실패함
        //output?.error에서 캐치 실패
        if(output?.error){
          console.log("에러 캐치 시작!");
          const e = JSON.stringfy(output,["error", "status", "code", "message"]);
          this.push(enc.encode(e));
          this.push(null);
          console.log("에러 캐치 성공!");
          return;
        }
        for await (const chunk of output){ 
          if(!chunk){
            continue;
          }
          this.push(enc.encode(JSON.stringify(chunk)));
        }
        this.push(null);
      })();
    }
  });

  stream.pipe(res);
}
