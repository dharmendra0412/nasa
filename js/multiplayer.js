/**
 * NASA Mission Control: Real-Time Online Multiplayer Client
 * Handles WebSocket connection, Room Lobby synchronization,
 * Role Locking (FLIGHT, PROP, SCIENCE, FDO), Live Comms Intercom & Flight Events.
 */
window.MultiplayerClient = (function () {
  "use strict";

  let ws = null;
  let isConnected = false;
  let currentRoom = null;
  let localPlayer = null;
  let roomPlayers = [];
  let roomChat = [];
  let pingMs = 0;
  let pingInterval = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;

  const eventListeners = {};

  function on(eventName, callback) {
    if (!eventListeners[eventName]) eventListeners[eventName] = [];
    eventListeners[eventName].push(callback);
  }

  function off(eventName, callback) {
    if (!eventListeners[eventName]) return;
    eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
  }

  function emit(eventName, data) {
    if (!eventListeners[eventName]) return;
    eventListeners[eventName].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[Multiplayer] Event error (${eventName}):`, err);
      }
    });
  }

  const PRODUCTION_RENDER_BACKEND = "wss://nasa-yr0n.onrender.com";

  function getWsUrl() {
    if (window.NASA_BACKEND_URL) {
      return window.NASA_BACKEND_URL.replace(/^http/, 'ws');
    }
    const hostname = window.location.hostname || "localhost";
    const isLocal = hostname === "localhost" ||
                    hostname === "127.0.0.1" ||
                    hostname.startsWith("192.168.") ||
                    hostname.startsWith("10.") ||
                    hostname.startsWith("172.");
    if (isLocal) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}`;
    }
    if (hostname.includes("onrender.com")) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}`;
    }
    // External Frontend (e.g. Vercel, Netlify, GitHub Pages) -> Connect to Render Backend
    return PRODUCTION_RENDER_BACKEND;
  }

  function connect(onOpenCallback) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      if (ws.readyState === WebSocket.OPEN && onOpenCallback) onOpenCallback();
      return;
    }

    const url = getWsUrl();
    console.log(`[Multiplayer] Connecting to WebSocket: ${url}`);

    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.error('[Multiplayer] Failed to create WebSocket:', err);
      emit('error', { message: 'Cannot connect to NASA Multiplayer server.' });
      return;
    }

    ws.onopen = () => {
      console.log('[Multiplayer] Connected to NASA Mission Control server!');
      isConnected = true;
      reconnectAttempts = 0;
      startPingLoop();
      emit('connected', { isConnected: true });
      if (onOpenCallback) onOpenCallback();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (err) {
        console.error('[Multiplayer] Error parsing message:', err);
      }
    };

    ws.onclose = () => {
      console.warn('[Multiplayer] Disconnected from server.');
      isConnected = false;
      stopPingLoop();
      emit('disconnected', {});
    };

    ws.onerror = (err) => {
      console.error('[Multiplayer] WebSocket error:', err);
      emit('error', { message: 'Connection error with multiplayer server.' });
    };
  }

  function startPingLoop() {
    stopPingLoop();
    pingInterval = setInterval(() => {
      if (isConnected && ws && ws.readyState === WebSocket.OPEN) {
        sendRaw('PING', { time: Date.now() });
      }
    }, 5000);
  }

  function stopPingLoop() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  function sendRaw(type, payload = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[Multiplayer] Cannot send message, socket not open:', type);
      return false;
    }
    ws.send(JSON.stringify({ type, payload }));
    return true;
  }

  function handleServerMessage(msg) {
    const { type, payload } = msg;

    switch (type) {
      case 'ROOM_CREATED':
      case 'ROOM_JOINED':
        currentRoom = {
          code: payload.roomCode,
          state: payload.state,
          missionId: payload.missionId,
          difficulty: payload.difficulty,
          isHost: payload.isHost
        };
        localPlayer = payload.player;
        roomPlayers = payload.players || [];
        roomChat = payload.chat || [];
        emit('roomJoined', {
          room: currentRoom,
          player: localPlayer,
          players: roomPlayers,
          chat: roomChat
        });
        break;

      case 'ROOM_UPDATE':
        if (currentRoom) {
          if (payload.state) currentRoom.state = payload.state;
          if (payload.missionId) currentRoom.missionId = payload.missionId;
          if (payload.difficulty) currentRoom.difficulty = payload.difficulty;
        }
        if (payload.players) {
          roomPlayers = payload.players;
          // Refresh localPlayer reference
          if (localPlayer) {
            const found = roomPlayers.find(p => p.id === localPlayer.id);
            if (found) localPlayer = found;
          }
        }
        emit('roomUpdated', {
          room: currentRoom,
          players: roomPlayers,
          newPlayer: payload.newPlayer || null,
          leftPlayer: payload.leftPlayer || null
        });
        break;

      case 'PLAYER_JOINED':
        emit('playerJoined', payload);
        break;

      case 'PLAYER_LEFT':
        emit('playerLeft', payload);
        break;

      case 'GAME_START':
        if (currentRoom) currentRoom.state = 'flight';
        emit('gameStart', payload);
        break;

      case 'FLIGHT_EVENT':
        emit('flightEvent', payload);
        break;

      case 'STATE_SYNC':
        emit('stateSync', payload);
        break;

      case 'CHAT_BROADCAST':
        roomChat.push(payload);
        if (roomChat.length > 50) roomChat.shift();
        emit('chatMessage', payload);
        break;

      case 'PONG':
        if (payload && payload.time) {
          pingMs = Date.now() - payload.time;
          emit('ping', { pingMs });
        }
        break;

      case 'ERROR':
        emit('error', payload);
        break;

      default:
        console.log('[Multiplayer] Received unhandled message:', type, payload);
    }
  }

  // Public Methods
  function createRoom(playerName, missionId = 'sentinel-e', difficulty = 'engineer') {
    connect(() => {
      sendRaw('ROOM_CREATE', { playerName, missionId, difficulty });
    });
  }

  function joinRoom(roomCode, playerName) {
    connect(() => {
      sendRaw('ROOM_JOIN', { roomCode, playerName });
    });
  }

  function selectRole(role) {
    sendRaw('ROLE_SELECT', { role });
  }

  function toggleReady(readyStatus) {
    sendRaw('PLAYER_READY', { ready: readyStatus });
  }

  function setMission(missionId, difficulty) {
    sendRaw('SET_MISSION', { missionId, difficulty });
  }

  function startGame() {
    sendRaw('START_GAME', {});
  }

  function sendFlightAction(action, data = {}) {
    if (!isInRoom()) return;
    sendRaw('FLIGHT_ACTION', { action, data });
  }

  let lastSyncTime = 0;
  function sendFlightSync(flightState) {
    if (!isInRoom()) return;
    const now = Date.now();
    // Throttle to 20 updates per second max
    if (now - lastSyncTime < 50) return;
    lastSyncTime = now;
    sendRaw('FLIGHT_SYNC', { state: flightState });
  }

  function sendChat(text, voiceCallout = null) {
    if (!isInRoom()) return;
    sendRaw('CHAT_MESSAGE', { text, voiceCallout });
  }

  function leaveRoom() {
    if (isInRoom()) {
      sendRaw('ROOM_LEAVE', {});
    }
    currentRoom = null;
    localPlayer = null;
    roomPlayers = [];
    roomChat = [];
    emit('roomLeft', {});
  }

  function isInRoom() {
    return isConnected && currentRoom !== null;
  }

  function getShareUrl() {
    if (!currentRoom) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom.code);
    return url.toString();
  }

  // Fast disconnect dispatch on tab close / window unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (isInRoom()) {
        sendRaw('ROOM_LEAVE', {});
      }
    });
    window.addEventListener('pagehide', () => {
      if (isInRoom()) {
        sendRaw('ROOM_LEAVE', {});
      }
    });
  }

  return {
    connect,
    on,
    off,
    createRoom,
    joinRoom,
    selectRole,
    toggleReady,
    setMission,
    startGame,
    sendFlightAction,
    sendFlightSync,
    sendChat,
    leaveRoom,
    isInRoom,
    getShareUrl,
    getPing: () => pingMs,
    getRoom: () => currentRoom,
    getLocalPlayer: () => localPlayer,
    getPlayers: () => roomPlayers,
    getChat: () => roomChat,
    isConnected: () => isConnected
  };
})();
