import { Redis } from '@upstash/redis';
import * as utils from './utils.js';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
  };  
  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
      console.log("key, corseHeaders[key]: ", key, corsHeaders[key]);
    }
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
    }
    res.status(405).end( "Method Not Allowed" );
    return;
  } 

  //input 받음
  const input = await utils.streamToJson(req);

  for (const key in headers){
    res.setHeader(key, headers[key]);
    console.log("key, headers[key]: ", key, headers[key]);
  }

  //save message
  if(input.request === 1){
    await redis.set(input.sessionId, utils.stringifyJson(input.messages));
    res.status(200).json({ ok: true })
    return;
  } 

  //load message
  else if(input.request === 2){
    const output = utils.parseText(await redis.get(input.sessionId));
    res.status(200).json(output);
    return;
  }

  //save sessionList
  else if(input.request === 3){
    await redis.set("sessionList", utils.stringifyJson(input.sessionList));
    res.status(200).json({ ok: true })
    return;
  }

  //load sessionList
  else if(input.request === 4){
    const output = utils.parseText(await redis.get("sessionList"));
    res.status(200).json(output);
    return;
  }
}
