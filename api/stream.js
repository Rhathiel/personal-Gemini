import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';
import * as utils from './utils.js';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

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
        yield utils.encodeText(utils.stringifyJson(x));
      }

      await redis.rpush(`messages:${sessionId}`, utils.stringifyJson({ role: "model", parts: [ { text: temp } ] }));
    })());

    nodeStream.pipe(res);
  }
  catch (e) {
    for (const key in jsonHeaders){
      res.setHeader(key, jsonHeaders[key]);
    }
    res.status(200).json({error: {code: e.code, message: e.message, status: e.status}});
  }
}
