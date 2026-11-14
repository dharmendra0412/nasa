// Automated Backend & WebSocket Integration Test for NASA Multiplayer
const http = require('http');
const WebSocket = require('ws');

async function runMultiplayerTests() {
  console.log("=== RUNNING NASA REAL-TIME MULTIPLAYER BACKEND TESTS ===");

  // Import RoomManager dynamically (ES module)
  const { RoomManager } = await import('./server/roomManager.js');

  const testServer = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
  });

  const TEST_PORT = 8089;
  const roomManager = new RoomManager(testServer);

  await new Promise((resolve) => testServer.listen(TEST_PORT, '127.0.0.1', resolve));
  console.log(`[PASS] Test HTTP + WebSocket Server started on port ${TEST_PORT}`);

  const wsUrl = `ws://127.0.0.1:${TEST_PORT}`;

  function createClient(name) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.messages = [];
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          ws.messages.push(msg);
          if (ws.onNewMessage) ws.onNewMessage(msg);
        } catch (e) {}
      });
    });
  }

  function waitForMessage(ws, predicateOrType, timeout = 3000) {
    const isMatch = typeof predicateOrType === 'function' 
      ? predicateOrType 
      : (m) => m.type === predicateOrType;

    return new Promise((resolve, reject) => {
      const idx = ws.messages.findIndex(isMatch);
      if (idx !== -1) {
        const found = ws.messages.splice(idx, 1)[0];
        return resolve(found);
      }

      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for message: ${predicateOrType}`));
      }, timeout);

      const handler = (msg) => {
        if (isMatch(msg)) {
          clearTimeout(timer);
          const i = ws.messages.indexOf(msg);
          if (i !== -1) ws.messages.splice(i, 1);
          resolve(msg);
        }
      };
      ws.onNewMessage = handler;
    });
  }

  // Test 1: Connect Host & Client
  const hostWs = await createClient('Host');
  const clientWs = await createClient('Client');
  console.log('[PASS] Connected 2 WebSocket clients simultaneously');

  // Test 2: Host creates room
  hostWs.send(JSON.stringify({
    type: 'ROOM_CREATE',
    payload: {
      roomCode: 'ORION',
      playerName: 'Commander Sarah',
      missionId: 'sentinel-e',
      difficulty: 'engineer'
    }
  }));

  const createdMsg = await waitForMessage(hostWs, 'ROOM_CREATED');
  if (createdMsg.payload.roomCode !== 'ORION' || !createdMsg.payload.isHost) {
    throw new Error('Room creation failed: ' + JSON.stringify(createdMsg));
  }
  console.log(`[PASS] Host created room "${createdMsg.payload.roomCode}" as Flight Director`);

  // Test 3: Client joins room
  clientWs.send(JSON.stringify({
    type: 'ROOM_JOIN',
    payload: {
      roomCode: 'ORION',
      playerName: 'Engineer Priya'
    }
  }));

  const joinedMsg = await waitForMessage(clientWs, 'ROOM_JOINED');
  if (joinedMsg.payload.roomCode !== 'ORION' || joinedMsg.payload.isHost) {
    throw new Error('Room join failed: ' + JSON.stringify(joinedMsg));
  }
  console.log(`[PASS] Client joined room "${joinedMsg.payload.roomCode}" successfully`);

  // Host should receive ROOM_UPDATE
  const hostUpdate = await waitForMessage(hostWs, 'ROOM_UPDATE');
  if (hostUpdate.payload.players.length !== 2) {
    throw new Error('Host did not receive update with 2 players');
  }
  console.log('[PASS] Host received ROOM_UPDATE with 2 connected crew members');

  // Test 4: Role Selection
  clientWs.send(JSON.stringify({
    type: 'ROLE_SELECT',
    payload: { role: 'systems_engineer' }
  }));

  const roleUpdate = await waitForMessage(hostWs, 'ROOM_UPDATE');
  const priya = roleUpdate.payload.players.find(p => p.name === 'Engineer Priya');
  if (!priya || priya.role !== 'systems_engineer') {
    throw new Error('Role selection did not propagate');
  }
  console.log('[PASS] Role Selection verified: Engineer Priya claimed "systems_engineer"');

  // Test 5: Comms Intercom Chat
  clientWs.send(JSON.stringify({
    type: 'CHAT_MESSAGE',
    payload: {
      text: 'Propulsion systems ready. Go for launch!',
      voiceCallout: 'ALL_SYSTEMS_GO'
    }
  }));

  const chatOnHost = await waitForMessage(hostWs, m => m.type === 'CHAT_BROADCAST' && m.payload.sender === 'Engineer Priya');
  if (!chatOnHost.payload.text.includes('Propulsion systems ready')) {
    throw new Error('Chat broadcast mismatch: ' + JSON.stringify(chatOnHost));
  }
  console.log('[PASS] Live Comms Intercom chat broadcast between crew members verified');

  // Test 6: Host starts game
  hostWs.send(JSON.stringify({
    type: 'START_GAME',
    payload: {}
  }));

  const gameStartOnClient = await waitForMessage(clientWs, 'GAME_START');
  if (gameStartOnClient.payload.roomCode !== 'ORION') {
    throw new Error('Game start signal not received by client');
  }
  console.log('[PASS] T-0 Game Start sequence synchronized across all clients');

  // Test 7: Real-time Flight Action (Propulsion Prograde Burn)
  clientWs.send(JSON.stringify({
    type: 'FLIGHT_ACTION',
    payload: {
      action: 'prograde',
      data: { delta: 1.0 }
    }
  }));

  const actionOnHost = await waitForMessage(hostWs, 'FLIGHT_EVENT');
  if (actionOnHost.payload.type !== 'prograde' || actionOnHost.payload.actor !== 'Engineer Priya') {
    throw new Error('Flight action mismatch: ' + JSON.stringify(actionOnHost));
  }
  console.log('[PASS] Real-time Flight Action (Prograde Thruster Burn) received and routed');

  // Test 8: Authoritative State Synchronization
  const testState = {
    altitude: 120.5,
    velocity: 4200.0,
    stage: 2,
    apoapsis: 425.0
  };

  hostWs.send(JSON.stringify({
    type: 'FLIGHT_SYNC',
    payload: { state: testState }
  }));

  const syncOnClient = await waitForMessage(clientWs, 'STATE_SYNC');
  if (syncOnClient.payload.state.altitude !== 120.5) {
    throw new Error('State sync data mismatch');
  }
  console.log('[PASS] Authoritative State Synchronization (20Hz Telemetry Buffer) verified');

  // Teardown
  hostWs.close();
  clientWs.close();
  testServer.close();

  console.log('\n===============================================================');
  console.log('  ALL 8 REAL-TIME MULTIPLAYER BACKEND TESTS PASSED WITH 0 ERRORS!');
  console.log('===============================================================\n');

  process.exit(0);
}

runMultiplayerTests().catch((err) => {
  console.error('[FAIL] Multiplayer tests failed:', err);
  process.exit(1);
});
