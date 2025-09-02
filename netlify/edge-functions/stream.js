export default async function handler(request) {

  //클라이언트 요청
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  //예외처리
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  //프롬프트 수신(문제x)
  const { prompt } = await request.json(); 
  
  //헤더
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain; charset=utf-8", 
    "Cache-Control": "no-cache, no-transform",  
    "Connection": "keep-alive"          
  };

  //선언
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter(); 
  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8");

  //청크 수신 및 해석
  (async () => {      
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=" +
          Netlify.env.get("GEMINI_API_KEY"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: {parts: [{ text: "마크 다운형식 대답하고. 마음대로 강조하고 사용해." }]},
          })
        }
      );

      if (!response.ok) {
        console.error("API Error:", await response.text()); // 🔴 여기서 실제 오류 메시지 확인 
        return;
      }

      const reader = response.body.getReader();
      let buffer = "";
      let depth = 0;
      let start = -1;
      while (true) {
        const chunk = await reader.read();

        if(chunk.done){
          const finalText = dec.decode();
          if (finalText) {
            await writer.write(enc.encode(finalText));
          }
          break;
        }

        const decoded = dec.decode(chunk.value, { stream: true });
        buffer += decoded;
        buffer = buffer.replace(/\n/g, "");
        for (let i = 0; i < buffer.length; i++) {
          const ch = buffer[i];

          if(ch === "{"){
            if (depth === 0){
              start = i;
            }
            depth++;
          } else if(ch === "}"){
            depth--;
            if (depth === 0 && start !== -1) {
              const jsonStr = buffer.slice(start, i+1);
              buffer = buffer.slice(i+1).trimStart();
              while (buffer.startsWith(",") || buffer.startsWith("]")) {
                buffer = buffer.slice(1).trimStart();
              }
              const text = JSON.parse(jsonStr)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              const encoded = enc.encode(text);
              console.log(text);
              await writer.write(encoded);
              start = -1;
              i = -1;
            }
          }
        }
      }

    } catch (e) {
      console.error("Streaming error:", e);
      await writer.write(enc.encode("ERROR")); 
    } finally {
      await writer.close();
    }
  })();

  //파이프라인 전달
  return new Response(readable, {
    status: 200,
    headers: headers
  });
}