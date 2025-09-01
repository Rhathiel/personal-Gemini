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
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=" +
          Netlify.env.get("GEMINI_API_KEY"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { systemInstruction: "always answer in Markdown format." }
          })
        }
      );

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value); // chunk 그대로 클라로 push
      }

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