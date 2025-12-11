import * as utils from './utils.ts';

export async function appendMessages(sessionId: string, data: Array<message>) {
  const obj = {
      sessionId: sessionId,
      data: data,
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

export async function deleteMessages(sessionId: string) {
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

  return response.status;
}

export async function loadMessages(sessionId: string) {
  const obj = {
      sessionId: sessionId,
      request: 3
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
  method: "POST", 
  headers: {
      "Content-Type": "application/json"
  },
  body: utils.stringifyJson(obj)
  });

  const output = await response.json();

  return output ? output : [];
}

export async function appendSession(data: session) {
  const obj = {
      data: data,
      request: 4
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

export async function deleteSession(data: session) {
  const obj = {
      data: data,
      request: 5
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

export async function editSession(oldData: session, newData: session) {
  const obj = {
      oldData: oldData,
      newData: newData,
      request: 6
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
    request: 7
  }
  const response = await fetch("https://personal-gemini.vercel.app/api/database", {
  method: "POST", 
  headers: {
      "Content-Type": "application/json"
  },
  body: utils.stringifyJson(obj)
  });

  const output = await response.json();

  console.log("아웃풋", output);

  return output ? output : [];
}
