<template>
  <div id="app">
    <div class="chat-container">
      <div class="chat-header">
        <h1>Real-time Chat</h1>
        <input
          type="text"
          v-model="username"
          placeholder="Enter your username"
          @keyup.enter="joinChat"
        />
        <button @click="joinChat" :disabled="!username">Join Chat</button>
      </div>

      <div v-if="username" class="chat-box">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.username === username ? 'sent' : 'received']"
        >
          <div class="message-content">
            <strong>{{ msg.username }}:</strong> {{ msg.message }}
          </div>
      </div>
        <div class="typing-indicator" v-if="typingUsers.length > 0">
          <em>{{ typingUsers.join(', ') }} {{ typingUsers.length > 1 ? 'are' : 'is' }} typing...</em>
        </div>

        <div class="input-area">
          <input
            type="text"
            v-model="currentMessage"
            placeholder="Type a message..."
            @input="handleTyping"
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage" :disabled="!currentMessage">Send</button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="users.length > 0" class="user-list">
        <h3>Connected Users:</h3>
        <ul>
          <li v-for="user in users" :key="user.id">{{ user.username }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      username: '',
      currentMessage: '',
      messages: [],
      errorMessage: '',
      users: [],
      typingUsers: [],
      typingTimeout: null,
      isConnected: false,
    };
  },
  methods: {
    initSocket() {
      this.socket = io('http://10.100.0.237:3000'); // Use your local IP

      this.socket.on('chatMessage', (msg) => {
        this.messages.push(msg);
      });

      this.socket.on('userList', (users) => {
        this.users = users;
      });

      this.socket.on('usernameTaken', (msg) => {
        this.errorMessage = msg;
        this.isConnected = false;
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('typing', (username) => {
        if (!this.typingUsers.includes(username) && username !== this.username) {
          this.typingUsers.push(username);
        }
      });

      this.socket.on('stopTyping', (username) => {
        this.typingUsers = this.typingUsers.filter(name => name !== username);
      });
    },

    joinChat() {
      if (this.username.trim() && !this.isConnected) {
        if (!this.socket) {
          this.initSocket();
        }
        this.socket.emit('join', this.username);
      }
    },

    sendMessage() {
      if (this.currentMessage.trim()) {
        this.socket.emit('chatMessage', {
          username: this.username,
          message: this.currentMessage,
        });
        this.currentMessage = '';
        this.socket.emit('stopTyping', this.username);
      }
    },

    handleTyping() {
      if (this.username) {
        this.socket.emit('typing', this.username);
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.socket.emit('stopTyping', this.username);
        }, 1000);
      }
    },
  },
};
</script>

<style scoped>
/* General Layout */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f0f2f5, #d9e4f5);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Chat Container */
.chat-container {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  width: 95%;
  max-width: 500px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.chat-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.chat-header h1 {
  margin: 0;
  font-size: 24px;
  text-align: center;
  color: #333;
}

.chat-header input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}

.chat-header button {
  padding: 10px;
  background-color: #4f46e5;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.chat-header button:hover:not(:disabled) {
  background-color: #4338ca;
}

.chat-header button:disabled {
  background-color: #bbb;
  cursor: not-allowed;
}

/* Messages */
.chat-box {
  max-height: 350px;
  overflow-y: auto;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  margin-bottom: 10px;
  word-wrap: break-word;
}

.message-content {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.4;
}

.message.sent {
  align-self: flex-end;
  justify-content: flex-end;
}

.message.sent .message-content {
  background-color: #b5b8c1;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.received {
  align-self: flex-start;
  justify-content: flex-start;
}

.message.received .message-content {
  background-color: #f1f5f9;
  color: #111827;
  border-bottom-left-radius: 4px;
}

.message strong {
  color: #1e40af;
  margin-right: 6px;
}

/* Input Area */
.input-area {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-area input {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.input-area button {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.input-area button:hover:not(:disabled) {
  background-color: #059669;
}

.input-area button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

/* Typing Indicator */
.typing-indicator {
  font-style: italic;
  font-size: 14px;
  color: #555;
  margin-top: -10px;
  margin-bottom: 10px;
  animation: fadeIn 0.4s ease;
}

/* User List */
.user-list {
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.user-list h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  font-size: 14px;
  color: #444;
  margin-bottom: 4px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

