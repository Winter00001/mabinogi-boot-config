const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map(); // roomCode -> Set(socket.id)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeRoomCode() {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error('Could not allocate room code');
}

function cleanName(value) {
  const name = String(value || '익명').trim().slice(0, 20);
  return name || '익명';
}

function leaveCurrentRoom(socket, announce = true) {
  const room = socket.data.room;
  if (!room) return;

  const name = socket.data.name || '익명';
  socket.leave(room);
  const members = rooms.get(room);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) rooms.delete(room);
  }

  if (announce) socket.to(room).emit('system', `${name}님이 나갔습니다.`);
  socket.data.room = null;
}

app.get('/', (_req, res) => {
  res.type('text/plain').send('TTS Room server is running.');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, clients: io.engine.clientsCount });
});

io.on('connection', (socket) => {
  socket.on('create', ({ name } = {}) => {
    leaveCurrentRoom(socket, false);
    const room = makeRoomCode();
    const safeName = cleanName(name);

    rooms.set(room, new Set([socket.id]));
    socket.join(room);
    socket.data.room = room;
    socket.data.name = safeName;

    socket.emit('joined', { room, name: safeName });
  });

  socket.on('join', ({ room, name } = {}) => {
    const code = String(room || '').trim().toUpperCase();
    const safeName = cleanName(name);

    if (!code || !rooms.has(code)) {
      socket.emit('joinError', '방을 찾을 수 없습니다. 방 코드를 확인하세요.');
      return;
    }

    leaveCurrentRoom(socket, false);
    rooms.get(code).add(socket.id);
    socket.join(code);
    socket.data.room = code;
    socket.data.name = safeName;

    socket.emit('joined', { room: code, name: safeName });
    socket.to(code).emit('system', `${safeName}님이 들어왔습니다.`);
  });

  socket.on('chat', (message) => {
    const room = socket.data.room;
    if (!room || !rooms.has(room)) return;

    const text = String(message || '').trim().slice(0, 500);
    if (!text) return;

    // 보낸 사람 자신을 제외한 같은 방 사용자에게만 전달
    socket.to(room).emit('chat', {
      name: socket.data.name || '익명',
      text
    });
  });

  socket.on('disconnect', () => leaveCurrentRoom(socket, true));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TTS Room server listening on ${PORT}`);
});
