import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export const handler = async (event) => {
    try {
        const body = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {}; //POST로 들어왔다면, event.body(문자열)을 객체로 변환. || "{}"는 body가 undefined일 경우를 대비
        const qs = event.queryStringParameters || {};
        const prompt = body.prompt ?? qs.prompt ?? ""; //셋중에 하나

        if (!prompt){ //빈 문자열("") 이면 TRUE
            return { statusCode: 400, body: "Missing 'prompt'" }; //에러 처리
        }

        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        for await (const chunk of response) {
            return{
                statusCode: 200,
                headers: { "Content-Type": "text/html" },
                body: chunk.text
            };
        }
    } catch(err){
        return {
            statusCode: 500,
            headers: { "Content-Type": "text/plain" },
            body: String(err)
        };  
    }
};