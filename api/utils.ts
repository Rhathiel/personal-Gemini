export function parseText(text: string | null) {
  if(text === null) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[parseText] JSON.parse failed:", err, "Input:", text);
    return null; 
  }
}

export function encodeText(text: string | null) {
  if(text === null) return null;

  try {
    const enc = new TextEncoder();
    return enc.encode(text);
  } catch (err) {
    console.error("[encodeText] TextEncoder failed:", err, "Input:", text);
    return new Uint8Array();
  }
}

export function decodeText(buffer: Uint8Array | null) {
  if(buffer === null) return null;
  
  try {
    const dec = new TextDecoder("utf-8");
    return dec.decode(buffer, { stream: true });
  } catch (err) {
    console.error("[decodeText] TextDecoder failed:", err, "Input:", buffer);
    return "";
  }
}

export function stringifyJson(json: any) {
  try {
    return JSON.stringify(json);
  } catch (err) {
    console.error("[stringifyJson] JSON.stringify failed:", err, "Input:", json);
    return "{}"; 
  }
}
