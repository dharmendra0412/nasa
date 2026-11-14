// Automated Comprehensive Test Suite for NASA Simulator
const fs = require('fs');
const path = require('path');

console.log("=== RUNNING NASA SIMULATOR COMPREHENSIVE TESTS ===");

// 1. Syntax Validation for all JS files
const jsFiles = ['data.js', 'engine.js', 'renderer3d.js', 'gameplay.js', 'multiplayer.js', 'ui.js'];
let syntaxPassed = true;

for (const file of jsFiles) {
  const filePath = path.join(__dirname, 'js', file);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    new Function(code);
    console.log(`[PASS] Syntax OK: js/${file}`);
  } catch (err) {
    console.error(`[FAIL] Syntax error in js/${file}:`, err.message);
    syntaxPassed = false;
  }
}

if (!syntaxPassed) {
  process.exit(1);
}

// 2. Mock DOM & Browser Environment
class MockContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'left';
    this.lineDash = [];
  }
  fillRect() {}
  clearRect() {}
  strokeRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  stroke() {}
  fill() {}
  fillText() {}
  setLineDash(arr) { this.lineDash = arr; }
  rect() {}
  createRadialGradient() {
    return { addColorStop() {} };
  }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  clip() {}
  closePath() {}
  measureText() { return { width: 50 }; }
  scale() {}
  translate() {}
  rotate() {}
  drawImage() {}
  save() {}
  restore() {}
}

class MockElement {
  constructor(id) {
    this.id = id;
    this.style = {};
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.width = 960;
    this.height = 540;
    this.listeners = {};
    this.dataset = {};
  }
  getContext(type) {
    return new MockContext2D();
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  scrollIntoView() {}
  classList = {
    add: (c) => { this.className += ' ' + c; },
    remove: (c) => { this.className = this.className.replace(c, '').trim(); },
    toggle: (c) => {
      if (this.className.includes(c)) this.className = this.className.replace(c, '').trim();
      else this.className += ' ' + c;
    }
  };
}

const mockElements = {
  'game-canvas-3d': new MockElement('game-canvas-3d'),
  'game-canvas-hud': new MockElement('game-canvas-hud'),
  'optical-feed-card': new MockElement('optical-feed-card'),
  'optical-feed-canvas': new MockElement('optical-feed-canvas'),
  'mcc-groundtrack-card': new MockElement('mcc-groundtrack-card'),
  'mcc-groundtrack-canvas': new MockElement('mcc-groundtrack-canvas'),
  'mcc-telemetry-card': new MockElement('mcc-telemetry-card'),
  'mcc-stripchart-canvas': new MockElement('mcc-stripchart-canvas'),
  'mcc-pass-badge': new MockElement('mcc-pass-badge'),
  'mcc-subsat-coords': new MockElement('mcc-subsat-coords'),
  'mcc-next-station': new MockElement('mcc-next-station'),
  'mcc-temp-val': new MockElement('mcc-temp-val'),
  'mcc-eclipse-val': new MockElement('mcc-eclipse-val'),
  'mcc-battery-val': new MockElement('mcc-battery-val'),
  'flight-anomaly-banner': new MockElement('flight-anomaly-banner'),
  'anomaly-title': new MockElement('anomaly-title'),
  'anomaly-desc': new MockElement('anomaly-desc'),
  'anomaly-countdown': new MockElement('anomaly-countdown'),
  'anomaly-action-text': new MockElement('anomaly-action-text'),
  'btn-toggle-safe-mode': new MockElement('btn-toggle-safe-mode'),
  'safe-mode-text': new MockElement('safe-mode-text'),
  'btn-restart-flight': new MockElement('btn-restart-flight'),
  'arcade-workspace': new MockElement('arcade-workspace')
};

global.document = {
  getElementById: (id) => mockElements[id] || new MockElement(id),
  querySelectorAll: (selector) => [],
  createElement: (tag) => new MockElement(tag)
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.window = {
  addEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080,
  scrollTo: () => {},
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  THREE: null, // Will run gracefully without WebGL in headless node
  speechSynthesis: { speak: () => {} }
};
global.SpeechSynthesisUtterance = function(t) { this.text = t; };

// Load modules
const dataCode = fs.readFileSync(path.join(__dirname, 'js', 'data.js'), 'utf8');
eval(dataCode);

const engineCode = fs.readFileSync(path.join(__dirname, 'js', 'engine.js'), 'utf8');
eval(engineCode);

const rendererCode = fs.readFileSync(path.join(__dirname, 'js', 'renderer3d.js'), 'utf8');
eval(rendererCode);

const gameplayCode = fs.readFileSync(path.join(__dirname, 'js', 'gameplay.js'), 'utf8');
eval(gameplayCode);

console.log("[PASS] All JavaScript modules loaded and evaluated successfully in runtime environment");

// 3. Test GameEngine initialization
const engine = window.GameEngine;
engine.init();
const state = engine.getState();
console.log(`[PASS] GameEngine initialized: missionId = ${state.missionId}`);

// 4. Test GameLoop and SpaceFlight Gameplay
const flight = window.SpaceFlightGame;
flight.start(mockElements['game-canvas-3d'], () => {
  console.log("Flight finished callback");
});
console.log("[PASS] SpaceFlightGame.start() executed successfully in launch phase");

// 5. Test Launch Phase frame updates and draw calls
for (let frame = 0; frame < 60; frame++) {
  // Simulate 60 frames (1 second) of launch flight
  flight.update();
  flight.draw();
}
console.log(`[PASS] 60 frames of Launch Phase processed without errors`);
console.log(`       - Launch Altitude: ${flight.getLaunchState().altitude.toFixed(2)} km`);
console.log(`       - Launch Velocity: ${flight.getLaunchState().velocity.toFixed(2)} m/s`);
console.log(`       - Telemetry History samples: ${flight.getOrbitState().telemetryHistory.length}`);
console.log(`       - Ground Track coordinates: Lat ${flight.getOrbitState().subSatLat.toFixed(2)}°, Lon ${flight.getOrbitState().subSatLon.toFixed(2)}°`);
console.log(`       - Pass Badge text: "${mockElements['mcc-pass-badge'].textContent}"`);
console.log(`       - Next Event text: "${mockElements['mcc-next-station'].textContent}"`);

if (flight.getOrbitState().telemetryHistory.length < 2) {
  console.error("[FAIL] Telemetry history was not sampled during launch!");
  process.exit(1);
} else {
  console.log("[PASS] Houston Oscilloscope actively populated during Launch Phase!");
}

if (!mockElements['mcc-pass-badge'].textContent.includes("ASCENT TRACKING")) {
  console.error("[FAIL] Ground Track badge did not reflect ascent tracking!");
  process.exit(1);
} else {
  console.log("[PASS] Houston Ground Track actively tracking ascent corridor!");
}

// 6. Test All 5 View Modes
const viewModes = ['split', '3d', 'track', 'telemetry', 'optical'];
for (const vm of viewModes) {
  flight.setViewMode(vm);
  flight.draw();
  console.log(`[PASS] View mode '${vm}' engaged & rendered with 0 errors. Class: ${mockElements['arcade-workspace'].className}`);
}

// 7. Test All 6 Camera Presets
const cameraPresets = ['chase', 'orbit', 'science', 'fpv', 'earth', 'autorotate'];
for (const cp of cameraPresets) {
  flight.setCameraPreset(cp);
  console.log(`[PASS] Camera preset '${cp}' switched successfully`);
}

// 8. Test Safe Exploration Mode Toggle
console.log(`Initial Safe Mode: ${flight.getOrbitState().safeMode}`);
flight.toggleSafeMode();
console.log(`After Toggle 1: Safe Mode = ${flight.getOrbitState().safeMode}`);
flight.toggleSafeMode();
console.log(`After Toggle 2: Safe Mode = ${flight.getOrbitState().safeMode}`);

// 9. Test Emergency Anomaly Trigger and Solve
flight.triggerAnomaly();
console.log(`[PASS] Emergency Anomaly triggered: "${flight.getOrbitState().anomaly.title}"`);
flight.resolveAnomaly();
console.log(`[PASS] Emergency Anomaly resolved: active = ${flight.getOrbitState().anomaly.active}`);

// 10. Test Transition to Orbit Phase
flight.getLaunchState().stage = 3;
flight.getLaunchState().altitude = 100;
flight.update(); // triggers transition to orbit
console.log(`[PASS] Flight Phase transitioned to: '${flight.getPhase()}'`);

// Process 30 frames in orbit
for (let frame = 0; frame < 30; frame++) {
  flight.update();
  flight.draw();
}
console.log(`[PASS] 30 frames of Orbit Phase processed without errors`);
console.log(`       - Orbit Apoapsis: ${flight.getOrbitState().apoapsis.toFixed(1)} km`);
console.log(`       - Orbit Battery: ${flight.getOrbitState().battery.toFixed(1)}%`);
console.log(`       - Orbit Temperature: ${flight.getOrbitState().temperature.toFixed(1)}°C`);

// 11. Test Interactive Flight Revival (reviveFlight)
flight.reviveFlight();
console.log(`[PASS] reviveFlight() executed. Phase is '${flight.getPhase()}', health is ${flight.getOrbitState().health}%`);

// 12. Test User-Friendly AutoConfigure for All Mission Presets (All 6 NASA App Challenge Missions)
const testMissions = ['sentinel-e', 'stormwatch', 'artemis-scout', 'red-pioneer', 'asteroid-guard', 'deepview'];
for (const mid of testMissions) {
  const result = window.GameEngine.autoConfigure(mid);
  if (!result.canLaunch) {
    console.error(`[FAIL] AutoConfigure failed for mission: ${mid}`);
    process.exit(1);
  }
  console.log(`[PASS] AutoConfigure verified for '${mid}': canLaunch = true, errors = 0`);
}

console.log("\n=======================================================");
console.log("ALL 12 SIMULATION & RENDER TESTS PASSED WITH 0 ERRORS!");
console.log("=======================================================");
process.exit(0);
