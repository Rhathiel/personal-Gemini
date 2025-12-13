import ReactMarkdown from "react-markdown";
import { useMessageStore } from "../../stores/messageStore.ts";
import { useFlagStore } from "../../stores/flagStore.ts";

function ChatMessages() {
  const { messages } = useMessageStore();
  const { isResponseDone } = useFlagStore(); 

  return (
    <div>
      {messages.map((msg, i) => (msg &&
        <div key={i}>
          <ReactMarkdown>
            {(msg.role === "user" ? "**나:**" : "**루나:**") + " " + (msg.parts?.[0]?.text)}
          </ReactMarkdown>
        </div>
      ))}
      {(isResponseDone) ? null : <div>...</div>}
    </div>
  );
}   

export default ChatMessages;