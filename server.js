const express = require('express');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

let displayId;
let cursorId;

app.use(express.static(path.join(__dirname, 'build')));

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let clientKey = makeid(8);

app.get('/ping', (req, res) => res.send('pong'));

app.get('/display/:key', (req, res) => {
  if (req.params.key === 'fire') {
    res.send('ok');
  } else { res.send('ko'); }
});

app.get('/mobile/:key', (req, res) => {
  if (req.params.key === clientKey) {
    clientKey = makeid(8);
    res.send('ok');
  } else { res.send('ko'); }
});

app.get('/key', (req, res) => {
  res.send(clientKey);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Socket connected');

  socket.on('display', () => {
    displayId = socket.id;
  });

  socket.on('cursor', () => {
    cursorId = socket.id;
  });

  socket.on('move', (data) => {
    io.to(displayId).emit('data', data);
  });

  socket.on('click', () => {
    io.to(displayId).emit('remote_click');
  });

  socket.on('start_posting', () => {
    io.to(cursorId).emit('start_posting');
  });

  socket.on('posting', (content) => {
    io.to(displayId).emit('posting', content);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

http.listen(process.env.PORT || 8080);
