const socket = io('https://chriscalver.com:8080');
// const socket = io('http://laptop:5000');


// const socket = io();
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
let userName = prompt("Enter Your Name Please.");

if (userName === null || userName.trim() === "") {
    userName = "Anonymous";
}

console.log(userName);

function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

socket.emit("user:join", userName);

socket.on("global:message", (message) => {
	messages.innerHTML += `
    <p class="join_message" >${message}</p>
    `;
    scrollToBottom();

        
});
socket.on("message:receive", (payload) => {
	messages.innerHTML += `          
    <div class="receive_message_container" >
        <p class="receiver_name" >${payload.name}</p>
        <p class="sent_message" >${payload.message}</p>
    </div>
    `;
    scrollToBottom();

});

form.addEventListener("submit", (e) => {
	e.preventDefault();
	messages.innerHTML += `          
    <div class="sent_message_container" >
        <p class="your_name" >You</p>
        <p class="sent_message" >${input.value}</p>
    </div>
    `;
    scrollToBottom();

	socket.emit("message:send", { name: userName, message: input.value });
	input.value = "";
});
console.log(socket);