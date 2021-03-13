// Require http, main use.
const http = require('http');
// Server logic with express.
const express = require('express');
// Realtime communication part (server side part).
// Containing both sides, the client-side and server-side.
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const createBoard = require('./create-board');
const createCooldown = require('./create-cooldown');

// Create our app.
const app = express();

// The app to do something, serving static files from folders.
// Serving static files from Client's folder.
app.use(express.static(`${__dirname}/../Client`));

// Create an http server, pass an event listener (app).
const server = http.createServer(app);
// Create an object with socket io function to wrap around our server.
const io = socketio(server);
const { clear, getBoard, makeTurn } = createBoard(10);

/* In order to implement some logic with socket.io, we need to add an
event listener, this is the main event in socket.io that's when the
new client is connected. There is a separate objects that is called sock
that represents the connection to this specific client.*/
io.on('connection', (sock) => {
  const color = randomColor();
  const cooldown = createCooldown(10);
  sock.emit('board', getBoard());

  sock.on('message', (text) => io.emit('message', text));
  sock.on('turn', ({ x, y }) => {
    if (cooldown()) {
      const playerWon = makeTurn(x, y, color);
      io.emit('turn', { x, y, color });

      if (playerWon) {
        sock.emit('message', 'You Won!');
        io.emit('message', 'New Round');
        clear();
        io.emit('board');
      }
    }
  });
});

// Event listener for the error event, if something is wrong.
server.on('error', (err) => {
  console.error(err);
});

// Server needs to listen to the port.
server.listen(8080, () => {
  console.log('server is ready');
});

/* Socket.io works like a wrapper around the server, it will
filter out the request that are related to socket io to realtime
communication and the rest of the request it will just pass to
the implementation of a server, so it will pass it to our express
application.
*/

/* Las reglas del juego, son simples, teniendo en cuenta que 
	el jugador puede matar a otras celulas sobreponiendo las del otro
	si un jugador se queda sin camino o sin opciones, pierde
	el jugador solo puede matar a otra celula si esta esta conectado con camino aliado
*/