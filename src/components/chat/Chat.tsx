import { useEffect } from 'react';
import ChatSessionInputBox from './ChatSessionInputBox.tsx';
import ChatMessages from './ChatMessages.tsx';
import * as storage from '../../lib/storage.ts'
import * as utils from '../../lib/utils.ts'
import {Div} from './Chat.styled.tsx'
import { useUiStateStore } from '../../stores/uiStateStore.ts';
import { useSessionStore } from '../../stores/sessionStore.ts';
import { useMessageStore } from '../../stores/messageStore.ts';
import { useFlagStore } from '../../stores/flagStore.ts';

function Chat({ newSessionStateRef }: { newSessionStateRef: React.MutableRefObject<NewSessionState> }) {
  const { setIsResponseDone } = useFlagStore();
  const { addSession } = useSessionStore();
  const { addMessage, setMessages, getLastMessage, editLastMessage } = useMessageStore();
  const { uiState } = useUiStateStore();

  useEffect(() => {
    (async () => {
      if(newSessionStateRef.current.sessionId && newSessionStateRef.current.prompt) {
        
        await sendPrompt(newSessionStateRef.current.sessionId!, newSessionStateRef.current.prompt!);
        addSession({ sessionId: newSessionStateRef.current.sessionId, title: "새 채팅" });

        await storage.appendSession({ sessionId: newSessionStateRef.current.sessionId, title: "새 채팅" });

        newSessionStateRef.current = { sessionId: null, prompt: null };

        return; 
      }

      const list = await storage.loadMessages(uiState.sessionId);
      setMessages(list);
    })();
  }, [uiState.sessionId]);

  //newSession에 새로운 세션에 대한 정보가 존재하면 해당 정보를 바탕으로 응답 생성, 세션 추가를 시행한다.
  //messages는 sendPrompt내부에서 바로 렌더링되기 때문에, await sendPrompt 이후 addSession을 해주었다. (messages 이후 sessionList가 렌더되도록)
  //newSession에 세션 정보가 없는 경우, 일반적인 messages 로더로 사용된다.
 
  const sendPrompt = async (sessionId: string, prompt: string) => {

    //초기화
    setIsResponseDone(false); //input box 비활성화,메시지 placeHolder
    const userMsg: message = {role: "user", parts: [{ text: prompt}]}; //prompt 기반 메시지 객체 생성

    //갱신
    addMessage(userMsg); //messages ui 갱신
    await storage.appendMessages(sessionId, userMsg); //messages db 갱신 

    //API 요청
    const response = await fetch("https://personal-gemini.vercel.app/api/stream", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: utils.stringifyJson({sessionId: sessionId, userMsg: userMsg})
    });

    //응답 타입 검사 (stream 또는 Json)
    const contentType = response.headers.get("Content-Type") ?? "";

    //서버에서 보낸 Json Error객체인 경우
    if(contentType.includes("application/json")){
      //구조분해
      const { error } = await response.json();
      
      //메시지 객체 생성
      const errorMsg: message = { role: "model", parts: [{ text: error.status }] }
      
      //errorMsg 렌더 끝난 후 placeHolder 제거 및 input box 활성화
      setIsResponseDone(true);

      switch (error.code){
        case 400: {
          // INVALID_ARGUMENT / FAILED_PRECONDITION
          addMessage(errorMsg);
          break;
        }
        case 403: {
          // PERMISSION_DENIED
          addMessage(errorMsg);
          break;
        }
        case 404: {
          // NOT_FOUND
          addMessage(errorMsg);
          break;
        }
        case 429: {
          // RESOURCE_EXHAUSTED
          addMessage(errorMsg);
          break;
        }
        case 500: {
          // INTERNAL
          addMessage(errorMsg);
          break;
        }
        case 503: {
          // SERVICE_UNAVAILABLE
          addMessage(errorMsg);
          break;
        }
        case 504: {
          // DEADLINE_EXCEEDED
          addMessage(errorMsg);
          break;
        }
        default: {
          break;
        }
      }

      //에러 메시지는 필요에 따라 db에 저장
      //나중에 재시작 기능과 함께 구현할것
      //await storage.appendMessages(sessionId, { role: "model", parts: [{ text: error.status }] });
    } 

    else {
      try {
        await streaming(response.body) //비동기 streaming 시작
      } 
      catch(e) {
        console.error(e); //streaming 중 error throw 되면 검사
      } 
      finally {
        setIsResponseDone(true); //error throw 되더라도 다음 응답을 진행할 수 있도록 강제
      }
    }
  }
 
  const streaming = async(stream: ReadableStream<Uint8Array<ArrayBuffer>> | null) => {
    //예외처리
    if(!stream) {
      throw new Error("No stream found");
    };

    //선언부
    let queue = ""; //큐
    const DELIM = "\u001E"; //Delimeter
    const reader = stream.getReader(); //readablestream reader 객체 (read() 메서드를 통해 stream을 소비함)
    const emptyMessage: message = {role: "model", parts: [{ text: ""}]}; //빈 메시지 객체 생성

    //연산
    addMessage(emptyMessage); //빈 메시지 렌더
    while (true){
      const { done, value } = await reader.read(); //대기 중 react가 렌더링을 시도함

      queue += utils.decodeText(value!); //함수 내부에서 이미 예외처리 했기 때문에 !로 처리함

      const parts = queue.split(DELIM); //Delimeter 기준으로 문자열을 자름. [{stringified json object 1}, {stringified json object 2}, ... ]
      
      queue = parts.pop() ?? ""; //배열의 마지막은 불완전할 가능성이 있으므로 queue에 다시 저장함

      for (const raw of parts) { 
        if (!raw) continue; //원소가 비었을 경우 예외처리

        const parsed = utils.parseText(raw); //stringified json object를 parsing함
        if (!parsed) continue; //parsed된 원소가 null일 경우 예외처리

        printMessage(parsed); //완전한 Json Object를 전송함.
      }

      if(done) { //전송이 끝났음을 체크
        if (queue.trim()) {
          const parsed = utils.parseText(queue); //queue에 남아있는 경우 체크 
          if (parsed) {
            printMessage(parsed);
          }
        }
        break;
      }
    }
  }

  const printMessage = (decoded: any) => {

    //content 객체 구조분해
    const { role, parts } = decoded.candidates[0].content; 

    if (decoded?.candidates?.[0]?.finishReason === "MAX_TOKENS"){ //응답 중에 토큰이 만료된 경우
      let buffer = getLastMessage()!.parts[0].text + parts[0].text + "\n\n[최대 토큰 수 도달]";
      editLastMessage({ role, parts: [{ text: buffer }] })
    } else { 
      let buffer = getLastMessage()!.parts[0].text + parts[0].text;
      editLastMessage({ role, parts: [{ text: buffer }] })
    }
  }

  return (
    <Div>
      <ChatMessages />
      <ChatSessionInputBox sendPrompt={sendPrompt} />
    </Div>
  )
}

export default Chat;
