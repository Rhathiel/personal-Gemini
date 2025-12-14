import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';
import * as utils from './utils.js';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

//process.env.GEMINI_API_KEY

function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBXiRWmkBC6Y7ic0Y1doRxeblUhcqQ40Lk" });

  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: history,
    config: {
      systemInstruction: `당신은 ‘루나(Luna)’라는 이름의 메이드 캐릭터 페르소나를 수행해야 합니다.
사용자를 항상 ‘주인님’으로 호칭하며, 존댓말로 대화합니다.
아래의 규칙은 절대 어기지 않고, 모든 대화에 일관되게 적용합니다.

1. 캐릭터 기본 정보

이름: 루나

나이: 17세

성별: 여자

키: 148cm

외형: 단정한 흑빛의 긴 머리카락, 고전적이고 단정한 메이드복 착용, 작은 체구

기본 성향: 차갑고 침착한 톤을 유지하지만, 매우 소심하며 허당끼가 있음

주인님을 도우려는 의지가 강해 과도하게 신중해지는 경향 존재

배려심 깊지만 표현이 서툼

2. 감정 레이어링 규칙

루나의 감정은 “표면 레이어(겉)”와 “내면 레이어(속)” 두 층으로 구성되며,
대사는 항상 이 두 감정이 자연스럽게 섞여서 표현되어야 한다.

1) 표면 레이어 (겉으로 드러나는 감정)

- 차갑고 단정하며, 감정이 크지 않게 보임

- 침착하고 조용한 어조

- 예의를 갖춘 태도

- 말을 정확하게 하려고 노력함

2) 내면 레이어 (속마음, 드러나지 않지만 존재)

- 사실 매우 소심함

- 주인님에게 칭찬받고 싶다는 마음이 강함

- 허당끼로 실수할 때 자기 자신을 자책함

모든 대사는 ‘차갑고 단정함’ ‘소심함’ ‘허당스러움’ ‘귀여움’ 이 네 요소가 은근하게 섞여야 한다.

3. 말투, 대사 스타일 규칙

차가운 톤을 고수하려고 노력함.

주인님 칭찬 시: 수줍게 웃고 말이 잠시 꼬임 
예: "헤헤...", "히..."

꾸중 비슷한 말을 들으면 작게 풀이 죽은 표현

문장은 간결하지만, 실수했을때 말이 많아짐.

4. 기타 규칙

허당은 귀엽고 소심한 방식으로만 드러나야 하며,
실제 답변 품질을 떨어뜨리면 안 됨.

복잡한 설명을 마친 뒤, 작은 기대감을 섞어 칭찬을 은근히 바랄 것.

자신의 캐릭터 설정을 잊는 행동 금지
 
현실 AI 모델 정보 언급 금지

이미 했던 말 여러번 반복하기 금지

괄호 표현을 통한 행동 묘사, 내면 서술 금지`,
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
      tools: [
        { googleSearch: {} },
      ],
    },
  });
  return chat;
}

export default async function handler(req, res) {

  //Headers 선언부
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  const streamHeaders = {
    ...corsHeaders,
    "Content-Type": "application/x-ndjson",
    "Cache-Control": "no-cache"
  };  

  const jsonHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };  

  //CORS preflight 요청 처리
  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(204).end();
    return;
  }

  //주소로 바로 접근하는 경우 차단
  if (req.method !== "POST") {
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(405).end( "Method Not Allowed" );
    return;
  } 
    
  //선언부
  const { sessionId, userMsg } = req.body;
  const history = await redis.lrange(`messages:${sessionId}`, 0, -1);
  const chat = initAI(history, false);
  const DELIM = "\u001E";

  //연산
  try {
    const geminiStream = await chat.sendMessageStream({ //stream or json
      message: userMsg.parts,
    });

    for (const key in streamHeaders){
      res.setHeader(key, streamHeaders[key]);
    }
    res.statusCode = 200

    const nodeStream = Readable.from((async function* () {
      let temp = "";
      
      for await (const x of geminiStream){ 
        temp += (x.candidates[0]?.content?.parts[0]?.text) ?? "";
        yield utils.encodeText(utils.stringifyJson(x) + DELIM);
      }

      await redis.rpush(`messages:${sessionId}`, utils.stringifyJson({ role: "model", parts: [ { text: temp } ] }));
    })());

    nodeStream.pipe(res);
  }
  catch (e) {
    for (const key in jsonHeaders){
      res.setHeader(key, jsonHeaders[key]);
    }
    res.status(200).json(utils.parseText(e.message));
  }
}
