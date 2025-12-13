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

async function createOutput(chat, parts) {
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

export default async function handler(req, res) {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  };  

  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
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
  }

  const { sessionId, userMsg } = req.body;
  const history = await redis.lrange(`messages:${sessionId}`, 0, -1);
  console.log("history in stream.ts: ", history);

  const chat = initAI(history, false);

  const output = await createOutput(chat, userMsg.parts);
  if(typeof output?.[Symbol.asyncIterator] !== "function"){ 
    res.status(503).json(output);
    return;
  }

  const stream = Readable.from(async function* () {
    let temp = "";
    
    for await (const x of output){ 
      temp += (x.candidates[0]?.content?.parts[0]?.text) ?? "";
      yield utils.encodeText(utils.stringifyJson(x));
    }

    await redis.rpush(`messages:${sessionId}`, utils.stringifyJson({ role: "model", parts: [ { text: temp } ] }));
  });
  res.statusCode = 200
  stream.pipe(res);
}
