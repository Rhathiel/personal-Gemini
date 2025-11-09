import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';

// Gemini AI 초기화 함수
function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    history: history,
    config: {
      systemInstruction: `markdown을 사용하여 응답하고, 코드 블록을 포함할 때는 항상 언어를 지정하세요.`,
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

  const stream = await chat.sendMessageStream({
      message: prompt, 
  });

  return stream;
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
    for (const key of corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(200).json({ error: "ok" });
    return;
  } //CORS preflight 요청 처리

  if (req.method !== "POST") {
    for (const key of corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  } //주소로 바로 접근하는 경우 차단

  let body = "";
  for await (const chunk of req) {
    body += dec.decode(chunk, { stream: true });
  }
  const { prompt, history } = JSON.parse(body);
  const chat = initAI(history, false);
  //전달받은 이진 데이터를 json으로 변환
  //전달받은 history로 ai 생성(이전 대화 기억)

  const stream = new Readable({
    read() {
      (async () => {
        const output_stream = createOutput(chat, prompt);
        for await (const chunk of output_stream){ 
          this.push(enc.encode(JSON.stringify(chunk)));
        }
        this.push(null);
      })();
    }
  });

  stream.pipe(res);
}
