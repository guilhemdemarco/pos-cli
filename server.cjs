const express = require('express');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static("public", { dotfiles: 'allow' } ));
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  let ptyProcess;

  const startApp = () => {
    if (ptyProcess) {
      ptyProcess.kill();
    }

    ptyProcess = pty.spawn('bun', ['run', 'src/index.ts'], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env
    });

    ptyProcess.onData(data => {
      ws.send(data);
    });

    ptyProcess.onExit(({ exitCode }) => {
      ws.send(`\n\n[CLI exited with code ${exitCode}. Restarting...]\n`);
      startApp(); // Restart the app
    });
  };

  startApp(); // First launch

  ws.on('message', msg => {
    ptyProcess.write(msg);
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });
});
