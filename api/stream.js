import { GoogleGenAI } from "@google/genai";

// edge runtime 설정
export const config = {
  runtime: "edge", 
};

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

export default async function handler(req) {
    const enc = new TextEncoder();

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
        return new Response("ok",{
            status: 200,
            headers: corsHeaders
        });
    } //CORS preflight 요청 처리

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: corsHeaders
        });
    } //주소로 바로 접근하는 경우 차단

    const { prompt, history } = await req.json();
    const chat = initAI(history, false);

    const stream = new ReadableStream({
      async start(controller) {
        (async () => {
          try{
            const aiStream = await createOutput(chat, prompt);
            for await (const chunk of aiStream) {
              controller.enqueue(enc.encode(JSON.stringify(chunk)));
            } 
          } catch(e){
            console.log(e);
            controller.enqueue(enc.encode(JSON.stringify(e)));
          } finally{
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, { headers: headers });
}
