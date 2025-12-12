import { Redis } from '@upstash/redis';
import * as utils from './utils.ts';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
  };  
  if (req.method === "OPTIONS"){
    for (const key in corsHeaders){
      res.setHeader(key, corsHeaders[key]);
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

  interface RequestBody {
    request: number;
    sessionId?: string;
    data?: session | Array<message>;
    oldData?: session;
    newData?: session;
  }

  //input 받음
  const body: RequestBody = req.body;

  for (const key in headers){
    res.setHeader(key, headers[key]);
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
      const list: Array<message> = raw.map(str => utils.parseText(str));
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
      const idx: number = await redis.lpos("sessionList", utils.stringifyJson(body.oldData));
      await redis.lset("sessionList", idx, utils.stringifyJson(body.newData));
      res.status(200).json({ ok: true })
      return;
    }
    case 7: {
      //load sessionList
      const raw = await redis.lrange("sessionList", 0, -1);
      const list: Array<session> = raw.map(str => utils.parseText(str));
      res.status(200).json(list);
      return;
    }
    default: {
      res.status(405).json({ ok: false });
      return;
    }
  }
}
