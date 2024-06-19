import { io } from 'socket.io-client';

const socket = io();

const socketInitializer = async () => {
    await fetch('/api/socket');

    await new Promise(resolve => {
        socket.on('connect', () => {
          console.log('Connected to server!');
          resolve(true); // Resolve the promise when connected
        });
    });
};

export { socket, socketInitializer };