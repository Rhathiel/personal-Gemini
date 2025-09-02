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

      while (true) {
        try{
          const chunk = await reader.read(); //chunk를 받아옴. 어떻게 들어올지는 모름.
          if(chunk.done){
            const finalText = dec.decode();
            if (finalText) {
              await writer.write(enc.encode(finalText));
            }
            break;
          }

          const decoded = dec.decode(chunk.value, { stream: true });

          const text = JSON.parse(line)?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""; //?? <- null 또는 undefined라면 ""를 대입
          const encoded = enc.encode(text)
          await writer.write(encoded);
        } catch (e) {
          console.error("JSON.parse error:", e);
          continue; 
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