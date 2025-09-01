import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export async function handler(event, context) {
    let prompt = ""; //사용자 질문

    if(event.httpMethod === "POST"){
      const body = JSON.parse(event.body || {});
      prompt = body.prompt;
    }

    //SSE 헤더 설정
    const headers = {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
    };

    //WebStream 준비
    const { readable, writable } = new TransformStream(); //TransformStream의 두 객체 readable writable을 연결
    const writer = writable.getWriter(); //writable의 객체 writer을 연결
    //writer -> writable에 데이터를 쓸 수 있는 도구
    const enc = new TextEncoder(); //문자열(string) → 바이너리(Uint8Array)로 바꿔주는 도구
    //binary로 바꾸는 이유 -> writable이 binary만 받기 때문

    //await을 감싸는 비동기 IIFE는 작업을 
    //즉시 백그라운드로 보내고 함수 다음 줄을 실행하는 특징을 갖고 있음
    (async () => {
    try {

      const response = await ai.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }], //prompt 전달
        model: "gemini-2.5-flash",
        config: {systemInstruction: "always answer in jsx in-line format."} //항상 jsx 포맷으로 대화하도록 지침
      });

      // 토큰(청크)마다 즉시 푸시
      for await (const chunk of response) {  //Promise까지 response에서 chunk를 읽어옴
        const text = chunk.text(); //chunk에서 text를 꺼내옴 
        if (!text) continue; //text가 비어있으면 다음 청크로 넘어가도록 예외처리
        await writer.write(enc.encode(`data: ${text}\n\n`)); //enc.encode를 통해 binary(data: ~) 객체 형태로 푸시, \n\n은 이벤트 구분자
      }
      //즉, binary 형태로 전달하고, 도착한 정보는 JSON.parse로 파싱해서 객체로 사용

      // 완료 이벤트
      await writer.write(enc.encode("event: done\n\n")); //비동기 함수라 await을 붙임. 
    } catch (e) { //error가 발생했을 때
      await writer.write(enc.encode(`event: error\ndata: ${String(e)}\n\n`)); //에러 내용과 함께 에러를 전달함. 
    } finally { //에러와 상관 없이 실행되는 블럭
      await writer.close(); //실행 끝났으니까 writer 닫기
    }
    })();

    return {
      statusCode: 200,
      headers: headers,
      body: readable 
    };
}