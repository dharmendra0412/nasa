import { WebSocketServer, WebSocket } from 'ws';

// NASA Memorable Mission Room Names
const ROOM_NAMES = [
  'APOLLO', 'ARTEMIS', 'ORION', 'SATURN', 'VOYAGER',
  'TITAN', 'GEMINI', 'MERCURY', 'DISCOVERY', 'ENDEAVOUR',
  'COLUMBIA', 'ATLANTIS', 'PERSEVERANCE', 'CURIOSITY',
  'NEW-HORIZONS', 'HUBBLE', 'WEBB', 'PIONEER', 'MARINER', 'JUNO'
];

export class RoomManager {
  constructor(server) {
    this.rooms = new Map(); // roomCode -> Room
    this.clientRooms = new Map(); // ws -> roomCode
    this.clientInfo = new Map(); // ws -> { id, name, role, isHost }

    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();

    // Cleanup stale empty rooms every 60 seconds
    setInterval(() => this.cleanupEmptyRooms(), 60000);
  }

  generateRoomCode() {
    // Try to find an unused NASA mission name
    for (const name of ROOM_NAMES) {
      if (!this.rooms.has(name)) {
        return name;
      }
    }
    // Fallback: random 4-letter alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = 'c_' + Math.random().toString(36).substring(2, 9);
      ws.clientId = clientId;
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          this.handleMessage(ws, msg);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err.message);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        console.error(`[WS] Client ${clientId} error:`, err.message);
      });
    });

    // Heartbeat ping every 5 seconds for rapid disconnect detection
    setInterval(() => {
      for (const client of this.wss.clients) {
        if (!client.isAlive) {
          client.terminate();
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 5000);
  }

  handleMessage(ws, msg) {
    const { type, payload } = msg;

    switch (type) {
      case 'ROOM_CREATE':
        this.handleRoomCreate(ws, payload);
        break;
      case 'ROOM_JOIN':
        this.handleRoomJoin(ws, payload);
        break;
      case 'ROLE_SELECT':
        this.handleRoleSelect(ws, payload);
        break;
      case 'PLAYER_READY':
        this.handlePlayerReady(ws, payload);
        break;
      case 'SET_MISSION':
        this.handleSetMission(ws, payload);
        break;
      case 'START_GAME':
        this.handleStartGame(ws, payload);
        break;
      case 'FLIGHT_ACTION':
        this.handleFlightAction(ws, payload);
        break;
      case 'FLIGHT_SYNC':
        this.handleFlightSync(ws, payload);
        break;
      case 'CHAT_MESSAGE':
        this.handleChatMessage(ws, payload);
        break;
      case 'PING':
        this.send(ws, 'PONG', { time: payload?.time || Date.now() });
        break;
      case 'ROOM_LEAVE':
        this.handleDisconnect(ws);
        break;
      default:
        console.warn('[WS] Unknown message type:', type);
    }
  }

  handleRoomCreate(ws, payload = {}) {
    const desiredCode = (payload.roomCode || '').trim().toUpperCase();
    const roomCode = desiredCode && !this.rooms.has(desiredCode) 
      ? desiredCode 
      : this.generateRoomCode();

    const playerName = (payload.playerName || 'Commander').trim().substring(0, 24);
    const missionId = payload.missionId || 'sentinel-e';
    const difficulty = payload.difficulty || 'engineer';
    const maxPlayers = Math.min(4, Math.max(1, parseInt(payload.maxPlayers || payload.crewSize || 4, 10)));

    const player = {
      id: ws.clientId,
      name: playerName,
      role: 'flight_director',
      ready: true,
      isHost: true,
      joinedAt: Date.now()
    };

    const room = {
      code: roomCode,
      hostId: ws.clientId,
      status: 'lobby',
      missionId: missionId,
      difficulty: difficulty,
      maxPlayers: maxPlayers,
      createdAt: Date.now(),
      players: new Map([[ws.clientId, { player, ws }]]),
      chat: [
        {
          id: 'sys_' + Date.now(),
          sender: 'HOUSTON CAPCOM',
          role: 'system',
          text: `Mission Control room [${roomCode}] initialized (${maxPlayers}-crew configuration). Share link with your flight crew!`,
          time: new Date().toLocaleTimeString(),
          voiceCallout: 'ALL_SYSTEMS_GO'
        }
      ],
      flightState: null
    };

    this.rooms.set(roomCode, room);
    this.clientRooms.set(ws, roomCode);
    this.clientInfo.set(ws, player);

    console.log(`[ROOM] Created room ${roomCode} by ${playerName} (${ws.clientId}, max ${maxPlayers} players)`);

    this.send(ws, 'ROOM_CREATED', {
      roomCode: roomCode,
      player: player,
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers,
      chat: room.chat,
      isHost: true
    });
  }

  handleRoomJoin(ws, payload = {}) {
    const rawCode = (payload.roomCode || '').trim().toUpperCase();
    const room = this.rooms.get(rawCode);

    if (!room) {
      this.send(ws, 'ERROR', {
        code: 'ROOM_NOT_FOUND',
        message: `Mission Room "${rawCode}" does not exist. Check code or create a new room!`
      });
      return;
    }

    const maxAllowed = room.maxPlayers || 4;
    if (room.players.size >= maxAllowed) {
      this.send(ws, 'ERROR', {
        code: 'ROOM_FULL',
        message: `Mission Room "${rawCode}" is currently full (maximum ${maxAllowed} flight crew members).`
      });
      return;
    }

    const playerName = (payload.playerName || `Astronaut ${room.players.size + 1}`).trim().substring(0, 24);
    
    // Auto-assign first unassigned primary role if available
    const existingRoles = Array.from(room.players.values()).map(p => p.player.role);
    const standardRoles = ['flight_director', 'systems_engineer', 'science_officer', 'comms_officer'];
    const nextRole = standardRoles.find(r => !existingRoles.includes(r)) || 'crew_specialist';

    const player = {
      id: ws.clientId,
      name: playerName,
      role: nextRole,
      ready: false,
      isHost: false,
      joinedAt: Date.now()
    };

    room.players.set(ws.clientId, { player, ws });
    this.clientRooms.set(ws, room.code);
    this.clientInfo.set(ws, player);

    console.log(`[ROOM] ${playerName} joined room ${room.code} as ${nextRole}`);

    // Welcome message in comms
    const joinMsg = {
      id: 'sys_' + Date.now(),
      sender: 'HOUSTON CAPCOM',
      role: 'system',
      text: `${playerName} connected to audio loop as ${this.formatRoleName(nextRole)}.`,
      time: new Date().toLocaleTimeString(),
      voiceCallout: 'CREW_JOINED'
    };
    room.chat.push(joinMsg);

    // Send join confirmation to the newcomer
    this.send(ws, 'ROOM_JOINED', {
      roomCode: room.code,
      player: player,
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4,
      chat: room.chat,
      isHost: false
    });

    // Notify other players
    this.broadcastToRoom(room.code, 'ROOM_UPDATE', {
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4,
      newPlayer: player
    }, ws.clientId);

    this.broadcastToRoom(room.code, 'CHAT_BROADCAST', joinMsg);
  }

  handleRoleSelect(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerWrap = room.players.get(ws.clientId);
    if (!playerWrap) return;

    const requestedRole = payload.role;
    playerWrap.player.role = requestedRole;

    console.log(`[ROOM] ${playerWrap.player.name} in ${roomCode} picked role: ${requestedRole}`);

    this.broadcastToRoom(roomCode, 'ROOM_UPDATE', {
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4
    });
  }

  handlePlayerReady(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerWrap = room.players.get(ws.clientId);
    if (!playerWrap) return;

    playerWrap.player.ready = Boolean(payload.ready);

    this.broadcastToRoom(roomCode, 'ROOM_UPDATE', {
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4
    });
  }

  handleSetMission(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Only host can modify mission settings
    if (room.hostId !== ws.clientId) {
      this.send(ws, 'ERROR', { message: 'Only Flight Director (Host) can configure mission parameters.' });
      return;
    }

    if (payload.missionId) room.missionId = payload.missionId;
    if (payload.difficulty) room.difficulty = payload.difficulty;

    this.broadcastToRoom(roomCode, 'ROOM_UPDATE', {
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4
    });
  }

  handleStartGame(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.hostId !== ws.clientId) {
      this.send(ws, 'ERROR', { message: 'Only Flight Director (Host) can authorize mission launch.' });
      return;
    }

    room.status = 'flight';

    const launchMsg = {
      id: 'sys_' + Date.now(),
      sender: 'FLIGHT DIRECTOR',
      role: 'flight_director',
      text: '🚀 T-0 LAUNCH SEQUENCE COMMENCED! ALL STATIONS GO FOR POWERED FLIGHT!',
      time: new Date().toLocaleTimeString(),
      voiceCallout: 'LAUNCH_COMMIT'
    };
    room.chat.push(launchMsg);

    this.broadcastToRoom(roomCode, 'GAME_START', {
      roomCode: room.code,
      missionId: room.missionId,
      difficulty: room.difficulty,
      players: this.serializePlayers(room)
    });

    this.broadcastToRoom(roomCode, 'CHAT_BROADCAST', launchMsg);
  }

  handleFlightAction(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerWrap = room.players.get(ws.clientId);
    const actorName = playerWrap ? playerWrap.player.name : 'Crew Member';
    const actorRole = playerWrap ? playerWrap.player.role : 'crew';

    const event = {
      type: payload.action,
      data: payload.data || {},
      actor: actorName,
      role: actorRole,
      timestamp: Date.now()
    };

    // Broadcast flight action to all crew in room
    this.broadcastToRoom(roomCode, 'FLIGHT_EVENT', event);
  }

  handleFlightSync(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Keep authoritative snapshot in room
    room.flightState = payload.state;

    // Relay to other clients in room (exclude sender to prevent bounce)
    this.broadcastToRoom(roomCode, 'STATE_SYNC', {
      state: payload.state,
      timestamp: Date.now()
    }, ws.clientId);
  }

  handleChatMessage(ws, payload = {}) {
    const roomCode = this.clientRooms.get(ws);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerWrap = room.players.get(ws.clientId);
    const sender = playerWrap ? playerWrap.player.name : 'Anonymous';
    const role = playerWrap ? playerWrap.player.role : 'crew';
    const text = (payload.text || '').trim().substring(0, 160);

    if (!text && !payload.voiceCallout) return;

    const chatItem = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender: sender,
      role: role,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      voiceCallout: payload.voiceCallout || null
    };

    room.chat.push(chatItem);
    if (room.chat.length > 50) room.chat.shift();

    this.broadcastToRoom(roomCode, 'CHAT_BROADCAST', chatItem);
  }

  handleDisconnect(ws) {
    const roomCode = this.clientRooms.get(ws);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.clientRooms.delete(ws);
      this.clientInfo.delete(ws);
      return;
    }

    const playerWrap = room.players.get(ws.clientId);
    const playerName = playerWrap ? playerWrap.player.name : 'Crew member';
    const playerRole = playerWrap ? playerWrap.player.role : 'crew';

    room.players.delete(ws.clientId);
    this.clientRooms.delete(ws);
    this.clientInfo.delete(ws);

    console.log(`[ROOM] ${playerName} disconnected from ${roomCode}`);

    if (room.players.size === 0) {
      console.log(`[ROOM] Room ${roomCode} is now empty. Scheduling cleanup.`);
      return;
    }

    // If host left, assign host to next remaining player
    let newHostName = null;
    if (room.hostId === ws.clientId) {
      const nextHostWrap = room.players.values().next().value;
      if (nextHostWrap) {
        room.hostId = nextHostWrap.player.id;
        nextHostWrap.player.isHost = true;
        newHostName = nextHostWrap.player.name;
        console.log(`[ROOM] Reassigned host of ${roomCode} to ${nextHostWrap.player.name}`);
      }
    }

    const leftData = {
      id: ws.clientId,
      name: playerName,
      role: playerRole,
      newHostName: newHostName
    };

    const leaveMsg = {
      id: 'sys_' + Date.now(),
      sender: 'HOUSTON CAPCOM',
      role: 'system',
      text: `⚠️ ${playerName} (${this.formatRoleName(playerRole)}) left the flight room. Console is now open.`,
      time: new Date().toLocaleTimeString(),
      voiceCallout: 'CREW_LEFT'
    };
    room.chat.push(leaveMsg);

    this.broadcastToRoom(roomCode, 'ROOM_UPDATE', {
      players: this.serializePlayers(room),
      state: room.status,
      missionId: room.missionId,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers || 4,
      leftPlayer: leftData
    });

    this.broadcastToRoom(roomCode, 'PLAYER_LEFT', leftData);
    this.broadcastToRoom(roomCode, 'CHAT_BROADCAST', leaveMsg);
  }

  cleanupEmptyRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.size === 0 && (now - room.createdAt > 300000)) {
        this.rooms.delete(code);
        console.log(`[ROOM] Removed expired empty room: ${code}`);
      }
    }
  }

  serializePlayers(room) {
    const list = [];
    for (const wrap of room.players.values()) {
      list.push({
        id: wrap.player.id,
        name: wrap.player.name,
        role: wrap.player.role,
        ready: wrap.player.ready,
        isHost: wrap.player.isHost,
        joinedAt: wrap.player.joinedAt
      });
    }
    return list;
  }

  formatRoleName(role) {
    const map = {
      flight_director: 'Flight Director',
      systems_engineer: 'Systems Engineer',
      science_officer: 'Science Officer',
      comms_officer: 'Comms Officer',
      crew_specialist: 'Crew Specialist'
    };
    return map[role] || role;
  }

  send(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  broadcastToRoom(roomCode, type, payload, excludeClientId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const data = JSON.stringify({ type, payload });
    for (const [clientId, wrap] of room.players.entries()) {
      if (excludeClientId && clientId === excludeClientId) continue;
      if (wrap.ws.readyState === WebSocket.OPEN) {
        wrap.ws.send(data);
      }
    }
  }
}
