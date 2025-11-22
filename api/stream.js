import { GoogleGenAI } from "@google/genai";
import { Readable } from 'stream';
import * as utils from './utils.js'

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

  const { messages } = await utils.streamToJson(req);
  const prompt = messages[messages.length - 1];
  const history = [
    ...messages.slice(0, messages.length - 1)
  ]
  const chat = initAI(history, false);

  const output = await createOutput(chat, prompt);

  let isApiError = false;
  if(typeof output?.[Symbol.asyncIterator] !== "function"){
    isApiError = true;
  }

  const stream = new Readable({
    read() {
      (async () => {
        if (isApiError === true) {
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
