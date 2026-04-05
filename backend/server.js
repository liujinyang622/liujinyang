require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const postRoutes = require('./routes/posts');
const Message = require('./models/Message');
const Group = require('./models/Group');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

connectDB(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/posts', postRoutes);

// Simple in-memory map userId -> socketId
const online = new Map();

io.on('connection', (socket) => {
  socket.on('auth', (userId) => {
    online.set(userId, socket.id);
    socket.userId = userId;
  });

  socket.on('private_message', async (data) => {
    // data: { from, toUser, type, content, fileName }
    const msg = new Message({ from: data.from, toUser: data.toUser, type: data.type, content: data.content, fileName: data.fileName });
    await msg.save();
    const toSocket = online.get(String(data.toUser));
    if (toSocket) io.to(toSocket).emit('private_message', msg);
    io.to(socket.id).emit('private_message', msg);
  });

  socket.on('group_message', async (data) => {
    // data: { from, toGroup, type, content, fileName }
    const msg = new Message({ from: data.from, toGroup: data.toGroup, type: data.type, content: data.content, fileName: data.fileName });
    await msg.save();
    const group = await Group.findById(data.toGroup);
    if (group) {
      group.members.forEach(memberId => {
        const sid = online.get(String(memberId));
        if (sid) io.to(sid).emit('group_message', msg);
      });
    }
    io.to(socket.id).emit('group_message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.userId) online.delete(socket.userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

