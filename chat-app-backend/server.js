const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Or restrict to specific domains
    methods: ['GET', 'POST'],
  },
});


let users = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (username) => {
    const isTaken = users.some((user) => user.username === username);
    if (isTaken) {
      socket.emit('usernameTaken', 'Username already taken');
      return;
    }

    users.push({ id: socket.id, username });
    io.emit('userList', users);
  });

  // Chat message
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg);
  });

  // Typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stopTyping', (username) => {
    socket.broadcast.emit('stopTyping', username);
  });

  // Disconnect
  socket.on('disconnect', () => {
    users = users.filter((user) => user.id !== socket.id);
    io.emit('userList', users);
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://10.100.0.237:3000');
});




