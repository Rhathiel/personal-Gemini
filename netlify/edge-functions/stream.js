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
  const dec = new TextDecoder("utf-8");

  (async () => {
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=" +
          Netlify.env.get("GEMINI_API_KEY"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: {parts: [{ "text": "마크 다운형식 대답하고. 마음대로 강조하고 사용해." }]},
          })
        }
      );

      const reader = response.body.getReader();

      let buffer = "";
      let depth = 0;
      let start = -1;
      while (true) {
        const chunk = await reader.read(); //chunk를 받아옴. 어떻게 들어올지는 모름.
        const decoded = dec.decode(chunk.value, { stream: true }); //들어온 청크를 일단 처리. ? stream 단위로
        buffer += decoded; //버퍼에 더해줌
        buffer = buffer.replace(/\n/g, "");
        for (let i = 0; i < buffer.length; i++) {
          const ch = buffer[i];

          if(ch === "{" && depth === 0){
            depth++; 
            start = i; //시작 지점 체크
          } else if(ch === "}" && depth === 1){
            depth--;
            const jsonStr = buffer.slice(start, i+1);
            buffer = buffer.slice(i+1).trimStart;
            const text = JSON.parse(jsonStr)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            const encoded = enc.encode(text);
            await writer.write(encoded);
            start = -1;
          } else if(ch === "{"){
            depth++;
          } else if(ch === "}"){
            depth--;
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

  return new Response(readable, {
    status: 200,
    headers: headers
  });
}