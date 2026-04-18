const express = require("express");
const http = require("http");
const { Server } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.use(express.static("public"));

let rooms = {};

function createRoom(id) {
  rooms[id] = {
    players: [],
    ball: { x: 400, y: 300, vx: 4, vy: 3 },
    paddles: [250, 250]
  };
}

wss.on("connection", (ws) => {
  let roomId, playerIndex;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "join") {
      roomId = data.room;
      if (!rooms[roomId]) createRoom(roomId);

      const room = rooms[roomId];
      if (room.players.length >= 2) return;

      playerIndex = room.players.length;
      room.players.push(ws);

      ws.send(JSON.stringify({ type: "player", index: playerIndex }));
    }

    if (data.type === "move") {
      if (!rooms[roomId]) return;
      rooms[roomId].paddles[playerIndex] = data.y;
    }
  });
});

setInterval(() => {
  for (let id in rooms) {
    let r = rooms[id];
    if (r.players.length < 2) continue;

    let b = r.ball;
    b.x += b.vx;
    b.y += b.vy;

    if (b.y < 0 || b.y > 600) b.vy *= -1;

    if (b.x < 20 && Math.abs(b.y - r.paddles[0]) < 60) b.vx *= -1;
    if (b.x > 780 && Math.abs(b.y - r.paddles[1]) < 60) b.vx *= -1;

    r.players.forEach(p =>
      p.send(JSON.stringify({ type: "state", ball: b, paddles: r.paddles }))
    );
  }
}, 1000 / 60);

server.listen(3000, () => console.log("Running on port 3000"));
