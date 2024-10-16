import { WebSocketServer } from 'ws';
import express from 'express';

const app = express();

// Tạo WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Lắng nghe kết nối WebSocket từ client
wss.on('connection', (ws) => {
  console.log('Client connected for review import status');

  // Gửi thông báo khi client kết nối
  ws.send(JSON.stringify({ status: 'Connected to WebSocket server' }));

  // Xử lý khi nhận tin nhắn từ client
  ws.on('message', (message) => {
    console.log('Received from client:', message);
  });

  // Khi client đóng kết nối
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Kết hợp WebSocket với HTTP server
const server = app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
// auto ++ reviewCount
wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "new_review", productId: "12345" }));
    }
  });