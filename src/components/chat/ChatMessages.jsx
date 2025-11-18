import ReactMarkdown from "react-markdown";

function ChatMessages({messages, done}) {

  return (
    <div>
      {messages.map((msg, i) => (msg &&
        <div key={i}>
          <ReactMarkdown>
            {(msg.role === "user" ? "**나:**" : "**루나:**") + " " + (msg.parts?.[0]?.text)}
          </ReactMarkdown>
        </div>
      ))}
      {(done) ? null : <div>...</div>}
    </div>
  );
}   

export default ChatMessages;