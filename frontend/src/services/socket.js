import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId) {
    if (this.socket) {
      this.socket.emit('join-group', groupId);
    }
  }

  leaveGroup(groupId) {
    if (this.socket) {
      this.socket.emit('leave-group', groupId);
    }
  }

  sendMessage(groupId, userId, username, message) {
    if (this.socket) {
      this.socket.emit('group-message', { groupId, userId, username, message });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message');
    }
  }

  subscribeScrapeStatus(callbacks) {
    if (!this.socket) return;
    this.socket.emit('subscribe-scrape-status');

    if (callbacks.onStarted) {
      this.socket.on('scrape-started', callbacks.onStarted);
    }
    if (callbacks.onProgress) {
      this.socket.on('scrape-progress', callbacks.onProgress);
    }
    if (callbacks.onCompleted) {
      this.socket.on('scrape-completed', callbacks.onCompleted);
    }
    if (callbacks.onFailed) {
      this.socket.on('scrape-failed', callbacks.onFailed);
    }
  }

  unsubscribeScrapeStatus() {
    if (!this.socket) return;
    this.socket.off('scrape-started');
    this.socket.off('scrape-progress');
    this.socket.off('scrape-completed');
    this.socket.off('scrape-failed');
  }
}

export default new SocketService();
