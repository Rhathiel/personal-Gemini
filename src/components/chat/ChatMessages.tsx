import ReactMarkdown from "react-markdown";

interface ChatMessagesProps {
    messages: Array<message>;
    isDone: boolean;
}

function ChatMessages({messages, isDone}: ChatMessagesProps) {

  return (
    <div>
      {messages.map((msg, i) => (msg &&
        <div key={i}>
          <ReactMarkdown>
            {(msg.role === "user" ? "**나:**" : "**루나:**") + " " + (msg.parts?.[0]?.text)}
          </ReactMarkdown>
        </div>
      ))}
      {(isDone) ? null : <div>...</div>}
    </div>
  );
}   

export default ChatMessages;