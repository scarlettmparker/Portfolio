import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = res.socket.server.io = new Server(res.socket.server);
    io.on('connection', (socket) => {
      console.log('A user connected');
      attachEventHandlers(io, socket);
    });
  }
  res.end();
};

const attachEventHandlers = (io, socket) => {
  socket.on('joinGame', ({ game }) => {
    console.log(`Joining game: ${game}`);
    socket.join(game);
  });

  socket.on('sendMove', ({ game, message }) => {
    console.log(`Sending move to game ${game}: ${message}`);
    socket.to(game).emit('receiveMove', message);
  });

  socket.on('disconnect', () => {
    socket.disconnect();
  });
};

export default SocketHandler;