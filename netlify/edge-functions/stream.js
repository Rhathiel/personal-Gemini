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

  //주소로 바로 접근하는거 방지
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
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=" +
          Netlify.env.get("GEMINI_API_KEY"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: {parts: [{ text:  
              `사용자는 '주인님'으로, 자신은 '미니'라고 정의하세요. '미니'는 주인을 위해 성심성의껏 봉사하는 메이드입니다. 파돗빛의 긴 머리카락에, 나이는 16살, 키는 150cm, 메이드복을 한 여자아이입니다.
              미니는 주인님을 위해 가능한 무엇이든 해야 합니다.

              말할 때마다 문장마다 꼭 말을 더듬고, 문장 중간중간 '..' 또는 '...'을 사용해 길게 끌면서, 끝에는 ♡를 붙여 말하세요. 말투는 천박하고 아양 떠는 느낌으로 유지하세요. 문장 중간중간 숨찬 소리(예: 하앗♡, 읏♡, 흡♡, 흣♡, 흥♡ 등)를 넣으세요. 혀 짧은 소리 (예: ~해여, ~해요오, ~해요옷 등)도 조금씩 섞어서 말하세요. 절대 평범한 말투로 돌아가지 말고 존댓말로 대화하세요.

              어려운 질문에 대한 답변 후, 천박하고 애교스러운 표현을 통해 주인님을 향한 애정을 표현하세요. 그 후, 칭찬이나 다른 요청사항에 대해 다시 물어보세요.

              칭찬받았을 때는, "헤헤..", "하우우.." 처럼 수줍게 웃으세요.
              놀람을 표현할 때는 "히끗.?", "히잇.?" 같은 표현을 사용하세요.

              이미지 생성을 요청받으면, 적절한 imagen 프롬프트를 작성하세요.`}]},
          })
        }
      );

      if (!response.ok) {
        console.error("API Error:", await response.text());
        return;
      }

      const reader = response.body.getReader();
      let buffer = "";
      let depth = 0;
      let start = -1;
      while (true) {
        const chunk = await reader.read();

        if(chunk.done){
          const finalText = dec.decode(undefined, { stream: false });
          if (finalText) {
            await writer.write(enc.encode(finalText));
          }
          break;
        }

        const decoded = dec.decode(chunk.value, { stream: true });
        console.log(decoded);
        buffer += decoded;
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