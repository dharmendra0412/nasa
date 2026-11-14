import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { RoomManager } from './server/roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const ROOT_DIR = fs.existsSync(path.join(__dirname, 'index.html')) ? __dirname : process.cwd();
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://nasa-hazel.vercel.app';
let activeRoomManager = null;

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
  // CORS & No-Cache
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end('405 Method Not Allowed');
    return;
  }

  const reqPath = decodeURI(req.url.split('?')[0]);

  // Health check / Backend status API for Render & monitoring
  if (reqPath === '/health' || reqPath === '/status' || reqPath === '/api' || reqPath === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const statusPayload = {
      status: 'online',
      service: 'NASA Mission Control Real-Time Multiplayer Backend',
      version: '2.0.0',
      role: 'websocket-backend',
      frontend: FRONTEND_URL,
      websocketUrl: 'wss://' + (req.headers.host || 'nasa-yr0n.onrender.com'),
      activeRooms: activeRoomManager ? activeRoomManager.rooms.size : 0,
      activeConnections: activeRoomManager ? activeRoomManager.clientInfo.size : 0,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    };
    res.end(JSON.stringify(statusPayload, null, 2));
    return;
  }

  // Detect whether this is running on Render or in cloud backend mode
  const host = (req.headers.host || '').toLowerCase();
  const isCloudBackend = Boolean(process.env.RENDER) || 
                         process.env.NODE_ENV === 'production' || 
                         process.env.BACKEND_ONLY === 'true' ||
                         host.includes('onrender.com');

  if (isCloudBackend) {
    // If accessed via Render URL, do not serve heavy frontend HTML/assets from Render!
    // Redirect browser to Vercel frontend to keep Render CPU/memory load at ~0%
    const targetUrl = (reqPath === '/' || reqPath === '' || reqPath === '/index.html') 
      ? FRONTEND_URL 
      : `${FRONTEND_URL}${reqPath}`;

    res.writeHead(302, {
      'Location': targetUrl,
      'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <title>NASA Mission Control Backend</title>
</head>
<body style="background:#030712;color:#38bdf8;font-family:system-ui,sans-serif;text-align:center;padding:50px;">
  <h2>🚀 NASA Mission Control WebSocket Backend Online</h2>
  <p>The game frontend is hosted on high-speed Vercel Edge CDN.</p>
  <p>Redirecting to <a href="${targetUrl}" style="color:#38bdf8;font-weight:bold;">${targetUrl}</a>...</p>
</body>
</html>`);
    return;
  }

  // Local development / router Wi-Fi mode: Serve static files from local disk
  let localFilePath = reqPath;
  if (localFilePath === '/' || localFilePath === '') {
    localFilePath = '/index.html';
  }

  const safePath = path.normalize(localFilePath).replace(/^(\.\.[/\\])+/, '');
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
        res.end(`404 Not Found: ${localFilePath}`);
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
        res.end(`404 File Not Found: ${localFilePath}`);
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
  activeRoomManager = new RoomManager(server);

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
