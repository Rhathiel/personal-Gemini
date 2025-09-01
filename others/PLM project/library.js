//변수
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("sendBtn");
const output = document.getElementById("chat-output");
let res
let data

//답변 출력
sendBtn.addEventListener("click", async () => {
    res = await fetch("/.netlify/functions/api");
    data = await res.text();
    input.value = "";
    output.innerHTML = data;
});


