const socket = io('http://192.168.1.130:3000'); // Replace with server's IP if different

const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-btn');
const messagesUl = document.getElementById('messages');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    socket.emit('chat message', message);
    messageInput.value = '';
});

socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    messagesUl.appendChild(li);
});
