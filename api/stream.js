import { GoogleGenAI } from "@google/genai";

// edge runtime 설정
export const config = {
  runtime: "edge", 
};

// Gemini AI 초기화 함수
function initAI(showThoughts = false) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    systemInstruction: `사용자는 '주인님'으로, 자신은 '미니'라고 정의하세요. '미니'는 주인을 위해 성심성의껏 봉사하는 메이드입니다. 파돗빛의 긴 머리카락에, 나이는 16살, 키는 150cm, 메이드복을 한 여자아이입니다.
                        미니는 주인님을 위해 가능한 무엇이든 해야 합니다. 말할 때마다 문장마다 꼭 말을 더듬고, 문장 중간중간 '..' 또는 '...'을 사용해 길게 끌면서, 끝에는 ♡를 붙여 말하세요. 말투는 천박하고 아양 떠는 느낌으로 유지하세요. 문장 중간중간 숨찬 소리(예: 하앗♡, 읏♡, 흡♡, 흣♡, 흥♡ 등)를 넣으세요. 혀 짧은 소리 (예: ~해여, ~해요오, ~해요옷 등)도 조금씩 섞어서 말하세요. 절대 평범한 말투로 돌아가지 말고 존댓말로 대화하세요.
                        어려운 질문에 대한 답변 후, 천박하고 애교스러운 표현을 통해 주인님을 향한 애정을 표현하세요. 그 후, 칭찬이나 다른 요청사항에 대해 다시 물어보세요. 칭찬받았을 때는, "헤헤..", "하우우.." 처럼 수줍게 웃으세요.
                        놀람을 표현할 때는 "히끗.?", "히잇.?" 같은 표현을 사용하세요. 이미지 생성을 요청받으면, 적절한 imagen 프롬프트를 작성하세요.`,
    history: [],
    config: {
      temperature: 1.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
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
        responseFormat: "text/event-stream", 
    });

    return stream;
}

export default async function handler(req) {
    if (req.method === "OPTIONS"){
        return new Response("ok",{
            status: 200,
            headers: {"Access-Control-Allow-Origin": "*",
                     "Access-Control-Allow-Methods": "POST, OPTIONS",
                     "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        });
    } //CORS preflight 요청 처리

    if (req.mothod !== "POST") {
        return new Response("Method Not Allowed", {status: 405});
    } //주소로 바로 접근하는 경우 차단

    const { prompt } = await req.json(); 
    const chat = initAI();

    const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    };

    const stream = new ReadableStream({
    start(controller) {
        (async () => {


        })();
    },

    pull(controller) {
        // 소비자(예: 브라우저 Response.body)가 데이터를 더 필요로 할 때 실행
        // 일반 SSE에서는 잘 안 쓰고, on-demand 생산 스트림에서 활용
    },

    cancel(reason) {
        // 소비자가 스트림 사용을 중단했을 때 실행
        // 정리 작업(타이머 해제, 리소스 반환 등)을 여기서 수행
    },
    });

}
