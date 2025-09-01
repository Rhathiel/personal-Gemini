import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { prompt } = await request.json();
  
  const headers = {
    "Content-Type": "text/plain; charset=utf-8", 
    "Cache-Control": "no-cache, no-transform",  
    "Connection": "keep-alive"          
  };

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter(); 
  const enc = new TextEncoder();

  (async () => {
    try {
      const response = await ai.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }], //prompt 전달
        model: "gemini-2.5-flash",
        config: {systemInstruction: "always answer in Markdown format."} //항상 jsx 포맷으로 대화하도록 지침
      });

      // 토큰(청크)마다 즉시 푸시
      for await (const chunk of response) {  //Promise까지 response에서 chunk를 읽어옴
        const text = chunk.text(); //chunk에서 text를 꺼내옴 
        if (!text) continue;
        await writer.write(enc.encode(text));
      }
      //즉, binary 형태로 전달하고, 도착한 정보는 JSON.parse로 파싱해서 객체로 사용

    } catch (e) {
      await writer.write(enc.encode("ERROR: " + String(e))); 
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: headers
  });
}