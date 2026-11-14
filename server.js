import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { RoomManager } from './server/roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address
        });
      }
    }
  }
  return addresses;
}

function handleRequest(req, res) {
  // CORS & No-Cache for real-time development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end('405 Method Not Allowed');
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`404 Not Found: ${reqPath}`);
      } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`500 Internal Server Error: ${err.message}`);
      }
      return;
    }

    let targetFile = filePath;
    if (stats.isDirectory()) {
      targetFile = path.join(filePath, 'index.html');
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(targetFile, (readErr, data) => {
      if (readErr) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`404 File Not Found: ${reqPath}`);
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', data.length);
      res.end(data);
    });
  });
}

function startServer(port) {
  const server = http.createServer(handleRequest);

  // Initialize Real-time WebSocket Room Manager
  const roomManager = new RoomManager(server);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[!] Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[ERROR] Server error:', err.message);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const netIPs = getLocalIPAddresses();
    
    console.log('\n===============================================================');
    console.log('   🚀 NASA MISSION CONTROL - REAL-TIME MULTIPLAYER SERVER');
    console.log('===============================================================');
    console.log(`\n  ✅ HTTP & WebSocket Server online and listening on all interfaces:\n`);
    console.log(`  💻 Localhost (This PC):`);
    console.log(`     👉  http://localhost:${port}/`);
    console.log(`     👉  http://127.0.0.1:${port}/\n`);
    
    if (netIPs.length > 0) {
      console.log(`  📱 Router / Wi-Fi Network (Play with friends on same Wi-Fi):`);
      netIPs.forEach(ip => {
        console.log(`     👉  http://${ip.address}:${port}/  [${ip.name}]`);
      });
      const wifi = netIPs.find(i => /wi-fi|wlan|wireless/i.test(i.name)) || netIPs[0];
      console.log(`\n  🌍 Invite Link for Friends on Wi-Fi:`);
      console.log(`     👉  http://${wifi.address}:${port}/`);
    }

    console.log('\n  🌐 PLAY WITH FRIENDS OVER THE INTERNET (ANYWHERE IN THE WORLD):');
    console.log(`     Run this in another terminal to generate an instant public HTTPS link:`);
    console.log(`     👉  npm run share   (or: npx localtunnel --port ${port})\n`);
    console.log('===============================================================');
    console.log('  Press Ctrl + C to stop the server.');
    console.log('===============================================================\n');
  });
}

startServer(DEFAULT_PORT);
