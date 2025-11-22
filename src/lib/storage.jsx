import * as utils from './utils.jsx';

export async function saveMessages(sessionId, messages) {
  const obj = {
      sessionId: sessionId,
      messages: messages,
      request: 1
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
    method: "POST", 
    headers: {
      "Content-Type": "application/json"
    },
    body: utils.stringifyJson(obj)
  });

  return response.status;
}

export async function loadMessages(sessionId) {
  const obj = {
      sessionId: sessionId,
      request: 2
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
  method: "POST", 
  headers: {
      "Content-Type": "application/json"
  },
  body: utils.stringifyJson(obj)
  });

  const output = await utils.responseToJson(response)

  return output ? output : [];
}

export async function saveSessionList(sessionList) {
  const obj = {
      sessionList: sessionList,
      request: 3
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
  method: "POST", 
  headers: {
      "Content-Type": "application/json"
  },
  body: utils.stringifyJson(obj)
  });

  return response.status;
}

export async function loadSessionList() {
  const obj = {
      request: 4
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
  method: "POST", 
  headers: {
      "Content-Type": "application/json"
  },
  body: utils.stringifyJson(obj)
  });

  const output = await utils.responseToJson(response)

  return output ? output : [];
}
