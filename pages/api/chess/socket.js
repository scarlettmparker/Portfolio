import { Server } from 'socket.io';
import { findOnlinePlayer, setPlayer, setCurrentPlayer, setState } from './serverutils';

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = res.socket.server.io = new Server(res.socket.server);
    io.on('connection', (socket) => {
      attachEventHandlers(io, socket);
    });
  }
  res.end();
};

const attachEventHandlers = (io, socket) => {
  socket.on('joinGame', ({ game }) => {
    socket.join(game);
  });

  socket.on('setPlayer', async ({game}) => {
    let role = ''; // initialize role variable
    if (await findOnlinePlayer(game, "player0") == false) {
      console.log("player 0 not found");
      setPlayer(game, "player0", true);
      role = 'player0';
    } else if (await findOnlinePlayer(game, "player1") == false) {
      console.log("player 1 not found");
      setPlayer(game, "player1", true);
      role = 'player1';
    } else { 
      // game is full
      role = 'spectator';
    }
    socket.emit('startGame', role); // emit 'startGame' with the player's role
  })

  socket.on('setState', ( {game, message} ) => {
    // update game state on server
    setState(game, message);
  });

  socket.on('setCurrentPlayer', ({game, nextPlayer}) => {
    setCurrentPlayer(game, nextPlayer);
  });

  socket.on('sendMove', ({ game, message }, callback) => {
    console.log(`Sending move to game ${game}: ${message}`);
    socket.to(game).emit('receiveMove', message);

    // acknowledge the message was received
    if (callback) {
      callback({ status: 'ok' });
    }
  });

  socket.on('disconnect', () => {
    socket.disconnect();
  });
};

export default SocketHandler;