const socket = io("https://chriscalver.com", {
    path: "/chat2026/socket.io",
    transports: ["polling"],
    upgrade: false,
});

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
let userName = prompt("Enter Your Name Please.");
let isJoined = false;

if (userName === null || userName.trim() === "") {
    userName = "Anonymous";
}

userName = userName.trim();

console.log(userName);

function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

socket.emit("user:join", userName);

socket.on("user:join:ok", (confirmedName) => {
    userName = confirmedName;
    isJoined = true;
});

socket.on("user:join:error", (errorMessage) => {
    let nextName = prompt(`${errorMessage}\n\nEnter a different name:`);

    if (nextName === null || nextName.trim() === "") {
        nextName = `Anonymous-${Math.floor(Math.random() * 10000)}`;
    }

    userName = nextName.trim();
    socket.emit("user:join", userName);
});

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

    if (!isJoined) {
        return;
    }

    if (!input.value.trim()) {
        input.value = "";
        return;
    }

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