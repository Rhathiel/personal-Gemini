import { GoogleGenAI } from "@google/genai";
import { error } from "console";
import { Readable } from 'stream';

// Gemini AI 초기화 함수
function initAI(history, showThoughts) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: `
당신은 ‘루나(Luna)’라는 이름의 메이드 캐릭터 페르소나를 수행해야 합니다.
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
