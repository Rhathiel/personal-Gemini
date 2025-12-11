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
  const { body } = req;
  console.log("알라라라라라라랄");
  console.log("request: ", body.request);

  for (const key in headers){
    res.setHeader(key, headers[key]);
    console.log("key, headers[key]: ", key, headers[key]);
  }

  switch (body.request) {
    case 1: {
      //append message
      await redis.rpush(`messages:${body.sessionId}`, utils.stringifyJson(body.data));
      res.status(200).json({ ok: true })
      return;
    }
    case 2: {
      //del message
      await redis.del(`messages:${body.sessionId}`);
      res.status(200).json({ ok: true });
      return;
    }
    case 3: {
      //load message
      const raw = await redis.lrange(`messages:${body.sessionId}`, 0, -1);
      console.log("lrange output: ", raw);
      const list = raw.map(str => utils.parseText(str));
      res.status(200).json(list);
      return;
    }
    case 4: {
      //append sessionList
      await redis.rpush("sessionList", utils.stringifyJson(body.data));
      res.status(200).json({ ok: true })
      return;
    }
    case 5: {
      //delete sessionList
      await redis.lrem("sessionList", 0, utils.stringifyJson(body.data));
      res.status(200).json({ ok: true })
      return;
    }
    case 6: {
      //edit sessionList
      const idx = await redis.lpos("sessionList", utils.stringifyJson(body.oldData));
      await redis.lset("sessionList", idx, utils.stringifyJson(body.newData));
      res.status(200).json({ ok: true })
      return;
    }
    case 7: {
      //load sessionList
      const raw = await redis.lrange("sessionList", 0, -1);
      const list = raw.map(str => utils.parseText(str));
      res.status(200).json(list);
      return;
    }
    default: {
      res.status(405).json({ ok: false });
      return;
    }
  }
}
