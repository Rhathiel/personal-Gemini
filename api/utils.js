export function parseText(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[parseText] JSON.parse failed:", err, "Input:", text);
    return null; 
  }
}

export function encodeText(text) {
  try {
    const enc = new TextEncoder();
    return enc.encode(text);
  } catch (err) {
    console.error("[encodeText] TextEncoder failed:", err, "Input:", text);
    return new Uint8Array();
  }
}

export function decodeText(buffer) {
  try {
    const dec = new TextDecoder("utf-8");
    return dec.decode(buffer, { stream: true });
  } catch (err) {
    console.error("[decodeText] TextDecoder failed:", err, "Input:", buffer);
    return "";
  }
}

export function stringifyJson(json) {
  try {
    return JSON.stringify(json);
  } catch (err) {
    console.error("[stringifyJson] JSON.stringify failed:", err, "Input:", json);
    return "{}"; 
  }
}

export async function streamToText(stream) {
  try {
    let body = "";
    for await (const chunk of stream){
      body += decodeText(chunk);
    }
    return body;
  } catch (err) {
    return "" // fallback
  }
}

export async function streamToJson(stream) {
  try {
    let body = "";
    for await (const chunk of stream){
      body += decodeText(chunk);
    }
    console.log(body);
    return await parseText(body);
  } catch (err) {
    return null // fallback
  }
}