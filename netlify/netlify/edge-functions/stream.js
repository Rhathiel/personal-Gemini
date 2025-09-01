import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: NETLIFY.env.GEMINI_API_KEY});

export default async (request) => {  //event가 아니라 request

    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt") ?? "";

    const headers = {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
    }; //서버가 계속 연결을 열어주도록 함.

    //WebStream 준비
    const { readable, writable } = new TransformStream(); //TransformStream의 두 객체 readable writable을 연결.
    const writer = writable.getWriter(); //writable의 객체 writer을 연결
    const enc = new TextEncoder(); //문자열(string) → 바이너리(Uint8Array)로 바꿔주는 도구.

    //비동기 IIFE, 작업을 즉시 백그라운드로 보내고 함수 다음 줄을 실행하는 특징을 갖고 있음
    (async () => {
    try {
      // Gemini 스트림 호출
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" }); //model객체에 해당 버전 ai를 반환하는것으로 보임. model이 ai를 대체
      const response = await model.generateContentStream({ //ContentStream을 통해 응답이 토큰으로 날라옴
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {systemInstruction: "always answer in html format."} //항상 html 포맷으로 대화하도록 지침
      });

      // 토큰(청크)마다 즉시 푸시
      for await (const chunk of response) {  //Promise까지 response에서 chunk를 읽어옴
        const text = chunk.text(); //chunk에서 text를 꺼내옴
        if (!text) continue; //text가 비어있으면 다음 청크로 넘어가도록 예외처리
        await writer.write(enc.encode(`data: ${text}\n\n`)); //enc.encode를 통해 
      }

      // 완료 이벤트
      await writer.write(enc.encode("event: done\ndata: end\n\n"));
    } catch (e) {
      await writer.write(enc.encode(`event: error\ndata: ${String(e)}\n\n`));
    } finally { //에러와 상관 없이 실행되는 블럭
      await writer.close();
    }
    })();

}