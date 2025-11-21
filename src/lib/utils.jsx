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

export async function responseToText(response) {
  try {
    return await response.text();
  } catch (err) {
    console.error("[responseToText] response.text() failed:", err);
    return "" // fallback
  }
}

export async function responseToJson(response) {
  try {
    console.log(await response.json());
    return await null
  } catch (err) {
    console.error("[responseToJson] response.Json() failed:", err);
    return null // fallback
  }
}