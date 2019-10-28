const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const qr = require('qrcode');
const { url } = require('./config');

const clients = [];

app.use(express.static(path.join(__dirname, 'build')));

function genQr(str) {
  qr.toFile('qr.png', str);
}

function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const clientInfo = { clientKey: result, clientId: null };
  clients.push(clientInfo);
  genQr(`${url}/m/${result}`);
  return result;
}

function updateSocket(clientKey, id) {
  for (let i = 0, len = clients.length; i < len; i += 1) {
    const c = clients[i];

    if (c.clientKey === clientKey) {
      clients[i].clientId = id;
      break;
    }
  }
}

function findKey(id){
  for (let i = 0, len = clients.length; i < len; i += 1) {
    const c = clients[i];

    if (c.clientId === id) {
      return c.clientKey;
    }
  }
    return null;
}

function deleteId(clientKey) { // sera utile pour déconnecter les users
  for (let i = 0, len = clients.length; i < len; i += 1) {
    const c = clients[i];

    if (c.clientKey === clientKey) {
      clients.splice(i, 1);
      break;
    }
  }
}

let clientKey = makeId(8); // last client key

app.get('/ping', (req, res) => res.send('pong'));

app.get('/display/:key', (req, res) => {
  if (req.params.key === 'fire') {
    res.send('ok');
  } else { res.send('ko'); }
});

app.get('/mobile/:key', (req, res) => {
  var userAuthorized = false;
  for (var i = 0, len=clients.length; i<len; ++i) {
    if (req.params.key === clients[i].clientKey && clients[i].clientId === null) {
      userAuthorized = true;
      if (clients.length < 4 && clients[i].clientId === null){
        clientKey = makeId(8);
        io.to('display_room').emit('reload_qr');
      }
      break;
    }
  }
  if (userAuthorized) {
    res.send('ok');
  }
  else { res.send('ko'); }
});

app.get('/key', (req, res) => {
  res.send(clientKey);
});

app.get('/qr', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/qr.png`));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);
  for (let i = 0, len = clients.length; i < len; i += 1) {
    const c = clients[i];
    //console.log(`Client ID: ${clients[i].clientId} Client key:${clients[i].clientKey}`);
    console.log(c.clientKey);
  }
  //console.log(clients);


  socket.on('storeClientInfo', (data) => {
    for (let i = 0, len = clients.length; i < len; i += 1) {
      const c = clients[i];
      // console.log(data.clientKey);
      if (c.clientKey === data.clientKey) {
        clients[i].clientId = socket.id;
        //console.log(`${clients[i].clientId} ${clients[i].clientKey}`);
        console.log(clients);
        break;
      }
    }
  });

  socket.on('display', () => {
    socket.join('display_room');
    console.log('Borne id: ' + socket.id);
  });

  socket.on('cursor', (data) => {
    //console.log('Mobile id:' + cursorId);
    socket.to('display_room').emit('displayCursor', data.clientKey);
  });

  socket.on('move', (data) => {
    io.to('display_room').emit('data', data);
  });

  socket.on('click', (data) => {
    io.to('display_room').emit('remote_click', data);
  });

  socket.on('start_posting', (data) => {
    socket.to(data).emit('start_posting');
  });

  socket.on('posting', (content) => {
    socket.to('display_room').emit('posting', content);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    key = findKey(socket.id);
    if (key !== null) {
      socket.to('display_room').emit('disconnect_user', key);
        deleteId(key);
    }
  });
});
console.log(process.env[process.env.PORT]);
http.listen(process.env.PORT ? process.env[process.env.PORT] : 8080);
