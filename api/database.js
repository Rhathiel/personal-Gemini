import { Redis } from '@upstash/redis';

//그러면 구조를 정리해서, 
// 다른 chat들은 database에, 
// chat 눌러서 들어가면 session을 
// database로 쏴서 messages를 받아오고 화면 랜더링, 
// 그리고 해당 messages는 항상 localStorage와 동기화, 
// 만약 chat을 바꾸면 localStorage는 비우고 localStorage
// 내부의 메시지를 fetch로 database에 전달. 
// 그 외에 응답처리는 stream.js가 맡고, 
// stream.js로 쏴줄 history는 localStorage 사용. ㄱㅊ?

export default async function handler(req, res) {
  const enc = new TextEncoder(); 
  const dec = new TextDecoder("utf-8");

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

  let body = "";
  for await (const chunk of req) {
    body += dec.decode(chunk, { stream: true });
  }
  const { prompt, isNewSession } = JSON.parse(body);

  


}
