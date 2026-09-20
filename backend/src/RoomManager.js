import { Room } from './Room.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa huruf/angka yang mirip (O/0, I/1)

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code -> Room
  }

  generateCode() {
    let code;
    do {
      code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  createRoom() {
    const code = this.generateCode();
    const room = new Room(code, this.io);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get((code || '').toUpperCase());
  }

  removeRoomIfEmpty(code) {
    const room = this.rooms.get(code);
    if (room && room.isEmpty()) {
      room.destroy();
      this.rooms.delete(code);
    }
  }
}
