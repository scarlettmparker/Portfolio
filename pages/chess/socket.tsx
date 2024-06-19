import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Socket, io } from 'socket.io-client';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;
const socketInitializer = async () => {
    await fetch('/api/chess/socket');
    socket = io();

    await new Promise(resolve => {
        socket.on('connect', () => {
          console.log('Connected to server!');
          resolve(true); // resolve the promise when connected
        });
    });
};

export { socket, socketInitializer };