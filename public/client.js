const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const params = new URLSearchParams(window.location.search);
let room = params.get("room");

if (!room) {
  room = Math.random().toString(36).substr(2, 6);
  window.location.search = "?room=" + room;
}

const ws = new WebSocket(`ws://${location.host}`);

let player = 0;
let paddleY = 250;

let state = {
  ball: { x: 400, y: 300 },
  paddles: [250, 250]
};

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "join", room }));
};

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  if (data.type === "player") player = data.index;
  if (data.type === "state") state = data;
};

function sendMove() {
  ws.send(JSON.stringify({ type: "move", y: paddleY }));
}

// Keyboard
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") paddleY -= 20;
  if (e.key === "ArrowDown") paddleY += 20;
  sendMove();
});

// Mouse
document.addEventListener("mousemove", (e) => {
  paddleY = e.clientY;
  sendMove();
});

// Controller
function updateGamepad() {
  const gp = navigator.getGamepads()[0];
  if (gp) {
    paddleY += gp.axes[1] * 10;
    sendMove();
  }
}

function draw() {
  ctx.clearRect(0, 0, 800, 600);

  ctx.fillStyle = "white";

  ctx.fillRect(10, state.paddles[0], 10, 120);
  ctx.fillRect(780, state.paddles[1], 10, 120);

  ctx.fillRect(state.ball.x, state.ball.y, 10, 10);

  requestAnimationFrame(draw);
}

function loop() {
  updateGamepad();
  requestAnimationFrame(loop);
}

draw();
loop();
