import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';
import * as utils from './utils.ts';
import { Redis } from '@upstash/redis';
import type { SafetySetting, Chat } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function initAI(history: Array<message>, showThoughts: boolean) {
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
      ] as SafetySetting[],
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

async function createOutput(chat: Chat, parts: message["parts"]) {
  try{  
    const stream = await chat.sendMessageStream({
      message: parts,
    });
    return stream;
  }
  catch (e){
    console.error(e);
    return e;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };  

  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
      console.log("key, corseHeaders[key]: ", key, corsHeaders[key]);
    }
    res.status(204).end();
    return;
  } //CORS preflight 요청 처리

  if (req.method !== "POST") {
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(405).end( "Method Not Allowed" );
    return;
  } //주소로 바로 접근하는 경우 차단
    
  for (const key in headers){
    res.setHeader(key, headers[key]);
    console.log("key, headers[key]: ", key, headers[key]);
  }

  interface RequestBody {
    sessionId: string;
    userMsg: message;
  }

  const { sessionId, userMsg }: RequestBody = req.body;
  const raw = await redis.lrange(`messages:${sessionId}`, 0, -1);
  console.log("raw messages: ", raw);
  const history: Array<message> = raw.map(str => utils.parseText(str));

  const chat = initAI(history, false);

  const output = await createOutput(chat, userMsg.parts);


  //여기 부터 해라
  let isApiError = false;
  if(typeof (output as any)?.[Symbol.asyncIterator] !== "function"){
    isApiError = true;
  }

  const stream = new Readable({
    read() {
      (async () => {
        if (isApiError === true) {
          let error = JSON.stringify(output,["error", "status", "code"]);
          this.push(utils.encodeText(error));
          this.push(null);
          return;
        }
        for await (const chunk of output as AsyncIterable<any>) { 
          if(  !chunk || //undefined,null
              (typeof chunk === "string" && chunk.trim() === "") ||  //empty string
              (Object.getPrototypeOf(chunk) === Object.prototype && Object.keys(chunk).length === 0) || //empty json
              (chunk instanceof Uint8Array && chunk.length === 0) || //empty unit8array
              (Buffer.isBuffer(chunk) && chunk.length === 0) //empty buffer
            ){ 
            let error = {error: {code: "100", status: "INVALID_CHUNK", message: "완전하지 않은 청크."}};
            this.push(utils.encodeText(utils.stringifyJson(error)));
          } else{
            this.push(utils.encodeText(utils.stringifyJson(chunk)));
          }
        }
        this.push(null);
        return;
      })();
    }
  });

  stream.pipe(res);
}
