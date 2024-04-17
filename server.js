const express = require('express');
const app = express();
const { createServer } = require('http');
const { Server } = require('socket.io');
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['chat-room-id', 'user-id'],
        credentials: true
    },
    maxHttpBufferSize: 5 * 1e6,
    pingTimeout: 60000
});

const port = 3000; // Adjust the port if needed

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Serve the client-side HTML
});

// Static file serving (optional)
app.use(express.static(__dirname + '/public')); // Serve static assets
// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
// });

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg); // Broadcast message to all clients
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// io.listen(port);

httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
