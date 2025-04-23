const express = require('express');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Load SSL certificates
const privateKey = fs.readFileSync('/etc/letsencrypt/live/pos.blueflower.fr/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/pos.blueflower.fr/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();
const PORT = 3000;

app.use(express.static("public", { dotfiles: 'allow' } ));

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start HTTPS server
httpsServer.listen(PORT, () => {
  console.log(`Listening on https://localhost:${PORT}`);
});

// Redirect HTTP to HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80);

// WebSocket server over HTTPS
const wss = new WebSocketServer({ server: httpsServer });

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
