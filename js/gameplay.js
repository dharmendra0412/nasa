/**
 * Mission Control: Space Mission Design Game
 * High-Octane 3D WebGL Arcade Flight & Orbital Operations Engine
 * 60 FPS 3D Rocket Launch, Staging, Orbital Navigation, Hazard Dodging & Science Scanning
 */

window.SpaceFlightGame = (function () {
  "use strict";

  // Canvases
  let canvas3D = null;
  let canvasHUD = null;
  let ctx = null;
  let animId = null;
  let isRunning = false;
  let using3D = false;

  // 3D Meshes
  let rocket3D = null;
  let spacecraft3D = null;
  let launchPad3D = null;
  let mccCanvas = null;
  let mccCtx = null;
  let mccMapImg = null;

  // NASA Ground Station Tracking Complexes (DSN & Polar / Near-Earth)
  const GROUND_STATIONS = [
    { id: "gds", name: "Goldstone 34M", code: "GDS", lat: 35.42, lon: -116.89, radius: 24, color: "#ffd600" },
    { id: "mds", name: "Madrid 70M", code: "MDS", lat: 40.43, lon: -4.25, radius: 25, color: "#ff9100" },
    { id: "cds", name: "Canberra 34M", code: "CDS", lat: -35.40, lon: 148.98, radius: 24, color: "#00e5ff" },
    { id: "sgs", name: "Svalbard Polar", code: "SGS", lat: 78.23, lon: 15.41, radius: 22, color: "#00e676" },
    { id: "wff", name: "Wallops Flight", code: "WFF", lat: 37.94, lon: -75.47, radius: 23, color: "#e040fb" }
  ];

  // NASA Red-Team In-Flight Emergency Anomaly Database
  const ANOMALY_DATABASE = [
    {
      id: "RW_SATURATION",
      title: "REACTION WHEEL SATURATION",
      desc: "Reaction wheel angular momentum reached 100% capacity! Attitude control authority locked. Execute RCS momentum dump immediately!",
      actionText: "EXECUTE MOMENTUM DUMP [R]"
    },
    {
      id: "SEU_REBOOT",
      title: "SINGLE-EVENT UPSET (COSMIC RAY)",
      desc: "Galactic cosmic ray flipped register bits in central avionics bus! Guidance solution desynchronized. Reboot flight computer!",
      actionText: "REBOOT FLIGHT COMPUTER [R]"
    },
    {
      id: "SOLAR_LOCK",
      title: "SOLAR ARRAY GIMBAL DRIVE STALL",
      desc: "Solar array positioning actuator seized! Solar power generation failing. Reset gimbal drive actuator current!",
      actionText: "RESET GIMBAL DRIVE [R]"
    },
    {
      id: "HEAT_PRESSURE",
      title: "AMMONIA HEAT-PIPE OVERPRESSURE",
      desc: "Active thermal radiator loop pressure exceeded maximum operating threshold! Redirect heat loop into bypass channel!",
      actionText: "REDIRECT THERMAL LOOP [R]"
    }
  ];

  function calculateGreatCircleDeg(lat1, lon1, lat2, lon2) {
    const rLat1 = (lat1 * Math.PI) / 180;
    const rLat2 = (lat2 * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const cosAngle = Math.sin(rLat1) * Math.sin(rLat2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
    const clamped = Math.max(-1, Math.min(1, cosAngle));
    return (Math.acos(clamped) * 180) / Math.PI;
  }

  // Active Game State
  let phase = "launch"; // 'launch', 'staging', 'orbit', 'gameover'
  let missionConfig = null;
  let input = {
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
    actionJustPressed: false
  };

  function sfx(fn, ...args) {
    if (window.SoundFX && typeof window.SoundFX[fn] === "function") {
      window.SoundFX[fn](...args);
    }
  }

  // Floating score popups (+50 Science, x2 Combo!)
  const floatingTexts = [];
  function addFloatingText(text, x, y, color = "#00e5ff", size = 18) {
    floatingTexts.push({ text, x, y, vy: -1.2, life: 60, maxLife: 60, color, size });
  }

  function updateAndDrawFloatingTexts() {
    if (!ctx) return;
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = `bold ${ft.size}px 'Rajdhani', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = "center";
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  // =========================================================================
  // LAUNCH & ASCENT MINIGAME STATE
  // =========================================================================
  const launchState = {
    altitude: 0,        // 0 to 100 km (Kármán line / orbit)
    velocity: 0,        // 0 to 7800 m/s
    stage: 1,           // 1 = Booster, 2 = Upper Stage, 3 = Fairing Separated
    rocketX: 480,       // Horizontal position (steering)
    rocketY: 420,
    angle: 0,           // Steering angle
    corridorX: 480,     // Target gravity turn corridor center
    fuel: 100,          // Booster fuel
    stagingPrompt: null,// Prompt message
    heat: 0,            // Aerodynamic heating
    timeInFlight: 0,
    countdown: 10.0,
    isCountingDown: true,
    lastCountdownSec: 10,
    isTransonic: false,
    vaporConeAnnounced: false
  };

  // =========================================================================
  // ORBITAL OPERATIONS FLIGHT MINIGAME STATE
  // =========================================================================
  const orbitState = {
    angle: 0,           // Satellite attitude rotation angle (radians)
    angularVelocity: 0, // Rotation velocity
    fuel: 100,          // RCS fuel
    battery: 100,       // Electrical battery
    health: 100,        // Spacecraft health
    scienceScore: 0,    // Points gathered in real-time
    dataDownlinked: 0,  // GB downlinked
    combo: 1,           // Combo multiplier
    comboTimer: 0,

    surfaceOffset: 0,   // Ground scroll
    targets: [],        // Science targets on planet
    debris: [],         // Dangerous space debris
    solarFlared: false, // Solar flare active
    solarFlareTimer: 0,
    groundStationInView: false,
    groundStationX: -100,
    orbitProgress: 0,

    // --- FEATURE 1: 2D GROUND TRACK & DSN STATIONS ---
    inclination: 51.6,       // Orbital inclination in degrees
    nodalPrecession: 0,      // Westward drift in degrees (~22.5° per orbit)
    subSatLat: 28.5,         // Current Sub-satellite Latitude
    subSatLon: -80.6,        // Current Sub-satellite Longitude
    currentStation: null,    // Active contact station object (or null)
    nextStationName: "Madrid 70M",
    nextStationEta: 245,     // Seconds until next pass
    orbitHistory: [],        // Recent ground track points [{lat, lon}]

    // --- FEATURE 4: ORBITAL ECLIPSE & THERMAL SHOCK ---
    temperature: 95.0,       // Spacecraft core temperature in °C
    targetTemp: 115.0,       // Equilibrium target temperature
    eclipsePhase: "sunlight",// 'sunlight', 'penumbra', 'umbra', 'sunrise'
    eclipseFactor: 1.0,      // 1.0 (full sun) to 0.0 (total umbra)
    heatersActive: false,    // Automated survival electric heaters
    sunriseGlowTimer: 0,     // Blinding horizon sunrise bloom timer
    prevEclipsePhase: "sunlight",

    // --- ADVANCED FEATURE: KEPLERIAN DELTA-V ORBITAL MANEUVERS ---
    apoapsis: 420.0,         // Apoapsis altitude in km
    periapsis: 400.0,        // Periapsis altitude in km
    deltaV: 1250.0,          // Remaining Delta-V reserve (m/s)
    radiusA3D: 56.0,         // 3D Semi-major axis
    radiusP3D: 54.0,         // 3D Semi-minor axis
    isReentry: false,        // Hypersonic atmospheric entry active (<100 km)
    reentryHeat: 0.0,        // Aerodynamic friction heat %

    // --- ADVANCED FEATURE: RED-TEAM IN-FLIGHT EMERGENCY ANOMALIES ---
    anomaly: {
      active: false,
      id: null,
      title: "",
      desc: "",
      actionText: "",
      timer: 0,
      maxTimer: 15.0,
      cooldown: 1200         // Frames until next anomaly (~20s)
    },

    // --- ADVANCED FEATURE: HOUSTON MOC ROLLING TELEMETRY STRIP CHART ---
    telemetryHistory: [],    // Rolling buffer of last 60 points
    telemetryTick: 0,

    // --- CONSOLE VIEW MODES & SAFE EXPLORATION ---
    safeMode: true,          // Default ON: safe exploration of all views
    viewMode: "split"        // 'split', '3d', 'track', 'telemetry', 'optical'
  };

  // Input Listeners
  function setupInputListeners() {
    window.addEventListener("keydown", (e) => {
      if (!isRunning) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) input.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) input.right = true;
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        input.up = true;
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          window.MultiplayerClient.sendFlightAction("prograde");
        }
      }
      if (["ArrowDown", "KeyS"].includes(e.code)) {
        input.down = true;
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          window.MultiplayerClient.sendFlightAction("retrograde");
        }
      }
      if (e.code === "Space") {
        e.preventDefault();
        input.action = true;
        input.actionJustPressed = true;
        if (phase === "gameover") {
          start();
          return;
        }
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          if (phase === "launch") {
            window.MultiplayerClient.sendFlightAction("stage");
          } else if (phase === "orbit") {
            window.MultiplayerClient.sendFlightAction("scan");
          }
        }
      }
      if (e.code === "KeyC") {
        toggleFlightCommsDrawer();
      }
      // Camera switch hotkeys [1] - [6]
      if (e.code === "Digit1") setCameraPreset("chase");
      if (e.code === "Digit2") setCameraPreset("orbit");
      if (e.code === "Digit3") setCameraPreset("science");
      if (e.code === "Digit4") setCameraPreset("fpv");
      if (e.code === "Digit5") setCameraPreset("earth");
      if (e.code === "Digit6") setCameraPreset("autorotate");
      if (e.code === "KeyM") setViewMode("track");
      if (e.code === "KeyR") {
        if (phase === "gameover") {
          reviveFlight();
        } else {
          resolveCurrentAnomaly();
          if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
            window.MultiplayerClient.sendFlightAction("reboot");
          }
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (!isRunning) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) input.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) input.right = false;
      if (["ArrowUp", "KeyW"].includes(e.code)) input.up = false;
      if (["ArrowDown", "KeyS"].includes(e.code)) input.down = false;
      if (e.code === "Space") {
        input.action = false;
        input.actionJustPressed = false;
      }
    });

    // Wire camera toolbar buttons
    document.querySelectorAll(".cam-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.cam) setCameraPreset(btn.dataset.cam);
      });
    });

    // Wire Console View Mode Buttons
    document.querySelectorAll(".view-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.viewMode) setViewMode(btn.dataset.viewMode);
      });
    });

    // Wire Safe View Mode Toggle
    const btnSafe = document.getElementById("btn-toggle-safe-mode");
    if (btnSafe && btnSafe.addEventListener) {
      btnSafe.addEventListener("click", () => {
        toggleSafeMode();
      });
    }

    // Wire Flight Restart Button
    const btnRestart = document.getElementById("btn-restart-flight");
    if (btnRestart && btnRestart.addEventListener) {
      btnRestart.addEventListener("click", () => {
        start();
      });
    }

    // Wire HUD Canvas Click (Revive on Game Over / Enlarge PIP Optical Feed)
    const hudEl = document.getElementById("game-canvas-hud");
    if (hudEl && hudEl.addEventListener) {
      hudEl.addEventListener("click", (e) => {
        if (phase === "gameover") {
          reviveFlight();
          return;
        }
        const rect = hudEl.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (hudEl.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (hudEl.height / rect.height);
        // Top-right onboard camera PIP area
        if (mouseX >= hudEl.width - 230 && mouseY >= 70 && mouseY <= 230) {
          setViewMode(orbitState.viewMode === "optical" ? "split" : "optical");
        }
      });
    }

    // Wire Ground Track Toggle Button & Card Resizer
    const btnTrack = document.getElementById("btn-toggle-mcc-track");
    if (btnTrack && btnTrack.addEventListener) {
      btnTrack.addEventListener("click", () => {
        setViewMode("track");
      });
    }

    const btnSize = document.getElementById("btn-toggle-groundtrack-size");
    if (btnSize && btnSize.addEventListener) {
      btnSize.addEventListener("click", () => {
        const card = document.getElementById("mcc-groundtrack-card");
        if (card) card.classList.toggle("minimized");
      });
    }

    // Wire Anomaly Resolve Button
    const btnAnomaly = document.getElementById("btn-resolve-anomaly");
    if (btnAnomaly && btnAnomaly.addEventListener) {
      btnAnomaly.addEventListener("click", () => {
        resolveCurrentAnomaly();
      });
    }
  }

  // =========================================================================
  // EMERGENCY ANOMALY SYSTEM (RED-TEAM PROTOCOLS)
  // =========================================================================
  function triggerAnomaly() {
    const os = orbitState;
    if (os.anomaly.active) return;
    const picked = ANOMALY_DATABASE[Math.floor(Math.random() * ANOMALY_DATABASE.length)];
    os.anomaly.active = true;
    os.anomaly.id = picked.id;
    os.anomaly.title = picked.title;
    os.anomaly.desc = picked.desc;
    os.anomaly.actionText = picked.actionText;
    os.anomaly.timer = 15.0;
    os.anomaly.maxTimer = 15.0;

    const banner = document.getElementById("flight-anomaly-banner");
    const titleEl = document.getElementById("anomaly-title");
    const descEl = document.getElementById("anomaly-desc");
    const actionEl = document.getElementById("anomaly-action-text");
    const touchBtn = document.getElementById("ctrl-anomaly");
    if (banner) banner.style.display = "flex";
    if (touchBtn) touchBtn.style.display = "inline-block";
    if (titleEl) titleEl.textContent = picked.title;
    if (descEl) descEl.textContent = picked.desc;
    if (actionEl) actionEl.textContent = picked.actionText;

    sfx("playAlarm");
    addFloatingText(`⚠️ EMERGENCY ANOMALY: ${picked.title}`, canvasHUD ? canvasHUD.width / 2 : 480, 160, "#ff1744", 26);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(`Warning: Emergency anomaly detected. ${picked.title}. Operator intervention required.`);
        u.rate = 1.15;
        u.pitch = 0.9;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function resolveCurrentAnomaly() {
    const os = orbitState;
    if (!os.anomaly.active) return;

    os.anomaly.active = false;
    os.anomaly.cooldown = 1800 + Math.floor(Math.random() * 900); // 30-45 seconds
    const banner = document.getElementById("flight-anomaly-banner");
    const touchBtn = document.getElementById("ctrl-anomaly");
    if (banner) banner.style.display = "none";
    if (touchBtn) touchBtn.style.display = "none";

    os.scienceScore += 75; // Reward
    sfx("playBeep", 1280, 0.2);
    addFloatingText("🔧 ANOMALY RESOLVED! RED-TEAM PROTOCOL SUCCESS (+75 XP)", canvasHUD ? canvasHUD.width / 2 : 480, 160, "#00e676", 24);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance("Anomaly resolved. Systems nominal. Telemetry restored.");
        u.rate = 1.2;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function toggleGroundTrackView() {
    setViewMode("track");
  }

  function setViewMode(mode) {
    orbitState.viewMode = mode;
    const workspace = document.getElementById("arcade-workspace");
    if (workspace) {
      workspace.className = "arcade-workspace view-mode-" + mode;
    }
    document.querySelectorAll(".view-mode-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.viewMode === mode);
    });

    if (mode === "track") {
      const card = document.getElementById("mcc-groundtrack-card");
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (mode === "telemetry") {
      const card = document.getElementById("mcc-telemetry-card");
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (mode === "optical") {
      const card = document.getElementById("optical-feed-card");
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      if (typeof window !== "undefined" && window.scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (window.Space3D && window.Space3D.handleResize) {
      setTimeout(() => { window.Space3D.handleResize(); }, 80);
    }
    sfx("playBeep", 1080, 0.05);
  }

  function toggleSafeMode() {
    orbitState.safeMode = !orbitState.safeMode;
    const btn = document.getElementById("btn-toggle-safe-mode");
    const txt = document.getElementById("safe-mode-text");
    if (btn) btn.classList.toggle("inactive", !orbitState.safeMode);
    if (txt) {
      txt.textContent = orbitState.safeMode ? "🛡️ SAFE VIEW: ON" : "⚔️ CHALLENGE: ON";
    }
    if (orbitState.safeMode) {
      orbitState.health = 100;
      orbitState.battery = 100;
      addFloatingText("🛡️ SAFE VIEW MODE: ALL HAZARDS SUPPRESSED", canvasHUD ? canvasHUD.width / 2 : 480, 180, "#00e676", 24);
      sfx("playBeep", 1350, 0.15);
    } else {
      addFloatingText("⚠️ REALISTIC FLIGHT HAZARDS: ACTIVE", canvasHUD ? canvasHUD.width / 2 : 480, 180, "#ff9100", 22);
      sfx("playBeep", 650, 0.15);
    }
  }

  function reviveFlight() {
    orbitState.health = 100;
    orbitState.battery = 100;
    orbitState.safeMode = true;
    orbitState.temperature = 22.0;
    phase = "orbit";
    const btn = document.getElementById("btn-toggle-safe-mode");
    const txt = document.getElementById("safe-mode-text");
    if (btn) btn.classList.remove("inactive");
    if (txt) txt.textContent = "🛡️ SAFE VIEW: ON";
    sfx("playBeep", 1200, 0.2);
    addFloatingText("🔄 SPACECRAFT RESTORED! SAFE MODE ENGAGED", canvasHUD ? canvasHUD.width / 2 : 480, 200, "#00e676", 26);
  }

  function setCameraPreset(mode) {
    document.querySelectorAll(".cam-btn").forEach(b => {
      if (b.dataset.cam) b.classList.toggle("active", b.dataset.cam === mode);
    });
    if (window.Space3D) window.Space3D.setCameraMode(mode);
    if (window.SoundFX) window.SoundFX.playBeep(900, 0.04);
  }

  // =========================================================================
  // INITIALIZATION & START
  // =========================================================================
  function start(canvasElement, onCompleteCallback) {
    canvas3D = document.getElementById("game-canvas-3d") || canvasElement;
    canvasHUD = document.getElementById("game-canvas-hud") || canvasElement;
    if (canvasHUD && canvasHUD.getContext) {
      ctx = canvasHUD.getContext("2d");
    }

    isRunning = true;
    phase = "launch";

    const state = window.GameEngine.getState();
    const mission = window.GameData.missions.find(m => m.id === state.missionId);
    const orbit = window.GameData.orbits.find(o => o.id === state.orbitId);
    const lv = window.GameData.launchVehicles.find(l => l.id === state.launchVehicleId);

    missionConfig = {
      mission,
      orbit,
      lv,
      onComplete: onCompleteCallback
    };

    // Initialize 3D Engine
    using3D = false;
    if (window.Space3D && canvas3D) {
      using3D = window.Space3D.init(canvas3D);
      const orbitId = orbit ? orbit.id : "leo";
      window.Space3D.setupCelestialBody(orbitId);
      window.Space3D.setupOrbitLine(55, 55);

      rocket3D = window.Space3D.buildRocket(missionConfig);
      spacecraft3D = window.Space3D.buildSpacecraft(missionConfig);
      launchPad3D = window.Space3D.buildLaunchPad3D();

      const scene = window.Space3D.getScene();
      if (scene) {
        if (launchPad3D) scene.add(launchPad3D);
        scene.add(rocket3D);
        scene.add(spacecraft3D);
        spacecraft3D.visible = false; // Hidden inside fairing during launch
      }

      window.Space3D.setRocketGroup(rocket3D);
      window.Space3D.setSpacecraftGroup(spacecraft3D);
      window.Space3D.setCameraMode("chase");
    }

    // Reset launch state
    const w = (canvasHUD ? canvasHUD.width : 960);
    const h = (canvasHUD ? canvasHUD.height : 540);
    launchState.altitude = 0;
    launchState.velocity = 0;
    launchState.stage = 1;
    launchState.rocketX = w / 2;
    launchState.rocketY = h - 90;
    launchState.angle = 0;
    launchState.corridorX = w / 2;
    launchState.fuel = 100;
    launchState.heat = 0;
    launchState.timeInFlight = 0;
    launchState.countdown = 10.0;
    launchState.isCountingDown = true;
    launchState.lastCountdownSec = 10;
    launchState.isTransonic = false;
    launchState.vaporConeAnnounced = false;
    launchState.stagingPrompt = "T-MINUS 10s: SOUND SUPPRESSION ACTIVE | [SPACEBAR] SKIP";

    // Reset orbit state
    orbitState.angle = 0;
    orbitState.angularVelocity = 0;
    orbitState.fuel = 100;
    orbitState.battery = 100;
    orbitState.health = 100;
    orbitState.scienceScore = 0;
    orbitState.dataDownlinked = 0;
    orbitState.combo = 1;
    orbitState.comboTimer = 0;
    orbitState.targets = [];
    orbitState.debris = [];
    orbitState.orbitProgress = 0;

    // Feature 1: Ground Track & Orbit Geometry
    if (orbit) {
      if (orbit.id === "sso") orbitState.inclination = 97.4;
      else if (orbit.id === "polar" || orbit.id === "lunar") orbitState.inclination = 90.0;
      else if (orbit.id === "geo") orbitState.inclination = 0.0;
      else orbitState.inclination = 51.6;
    }
    orbitState.nodalPrecession = 0;
    orbitState.subSatLat = 28.5;
    orbitState.subSatLon = -80.6;
    orbitState.currentStation = null;
    orbitState.nextStationName = "Wallops Flight Facility";
    orbitState.nextStationEta = 95;
    orbitState.orbitHistory = [{ lat: 28.5, lon: -80.6 }];

    // Feature 4: Thermal Shock & Orbital Eclipse
    orbitState.temperature = 95.0;
    orbitState.targetTemp = 115.0;
    orbitState.eclipsePhase = "sunlight";
    orbitState.eclipseFactor = 1.0;
    orbitState.heatersActive = false;
    orbitState.sunriseGlowTimer = 0;
    orbitState.prevEclipsePhase = "sunlight";

    // Keplerian Orbit & Delta-V State
    orbitState.apoapsis = 420.0;
    orbitState.periapsis = 400.0;
    orbitState.deltaV = 1250.0;
    orbitState.radiusA3D = 56.0;
    orbitState.radiusP3D = 54.0;
    orbitState.isReentry = false;
    orbitState.reentryHeat = 0.0;

    // Emergency Anomaly State
    orbitState.anomaly = {
      active: false,
      id: null,
      title: "",
      desc: "",
      actionText: "",
      timer: 0,
      maxTimer: 15.0,
      cooldown: 1200
    };
    orbitState.telemetryHistory = [
      { battery: 100, temperature: 24, downlink: 18.5, deltaV: 0, apoapsis: 0, periapsis: 0 },
      { battery: 100, temperature: 24, downlink: 18.5, deltaV: 0, apoapsis: 0, periapsis: 0 }
    ];
    orbitState.telemetryTick = 0;
    orbitState.safeMode = true;
    orbitState.viewMode = "split";

    const btnSafe = document.getElementById("btn-toggle-safe-mode");
    const txtSafe = document.getElementById("safe-mode-text");
    if (btnSafe) btnSafe.classList.remove("inactive");
    if (txtSafe) txtSafe.textContent = "🛡️ SAFE VIEW: ON";
    const workspace = document.getElementById("arcade-workspace");
    if (workspace) workspace.className = "arcade-workspace view-mode-split";

    const anomalyBanner = document.getElementById("flight-anomaly-banner");
    if (anomalyBanner) anomalyBanner.style.display = "none";
    const touchAnomalyBtn = document.getElementById("ctrl-anomaly");
    if (touchAnomalyBtn) touchAnomalyBtn.style.display = "none";

    // Initialize 2D Ground Track Canvas & Texture
    mccCanvas = document.getElementById("mcc-groundtrack-canvas");
    if (mccCanvas && mccCanvas.getContext) {
      mccCtx = mccCanvas.getContext("2d");
    }
    if (!mccMapImg && typeof Image !== "undefined") {
      mccMapImg = new Image();
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.earthDay) {
        mccMapImg.src = window.PhotorealisticTextures.earthDay;
      } else {
        mccMapImg.src = "assets/earth_day.jpg";
      }
    }

    // Multiplayer In-Flight HUD & Drawer setup
    if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
      const mpBanner = document.getElementById("flight-multiplayer-hud");
      if (mpBanner) mpBanner.style.display = "flex";
      const hudCode = document.getElementById("hud-room-code");
      if (hudCode) hudCode.textContent = window.MultiplayerClient.getRoom()?.code || "ONLINE";
      updateFlightHudCrew();
    } else {
      const mpBanner = document.getElementById("flight-multiplayer-hud");
      if (mpBanner) mpBanner.style.display = "none";
      const drawer = document.getElementById("flight-comms-drawer");
      if (drawer) drawer.style.display = "none";
    }

    floatingTexts.length = 0;

    sfx("playLaunch");
    loop();
  }

  function stop() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    if (using3D && launchPad3D && window.Space3D) {
      const scene = window.Space3D.getScene();
      if (scene) scene.remove(launchPad3D);
      launchPad3D = null;
    }
  }

  // =========================================================================
  // MAIN GAME LOOP (60 FPS)
  // =========================================================================
  function loop() {
    if (!isRunning) return;

    update();
    draw();

    input.actionJustPressed = false;
    animId = requestAnimationFrame(loop);
  }

  // =========================================================================
  // UPDATE LOGIC
  // =========================================================================
  function update() {
    if (phase === "launch") {
      updateLaunchPhase();
    } else if (phase === "orbit") {
      updateOrbitPhase();
    }

    // Multiplayer State Synchronization (Authoritative Broadcast from Host)
    if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
      const room = window.MultiplayerClient.getRoom();
      if (room && room.isHost) {
        window.MultiplayerClient.sendFlightSync(getStateSnapshot());
      }
    }
  }

  // 1. UPDATE: LAUNCH & ASCENT PHASE
  function updateLaunchPhase() {
    const ls = launchState;
    const w = canvasHUD ? canvasHUD.width : 960;

    // --- T-MINUS 10 COUNTDOWN SEQUENCE ---
    if (ls.isCountingDown) {
      // Spacebar or tap skips countdown to immediate liftoff
      if (input.actionJustPressed) {
        ls.countdown = 0;
        ls.isCountingDown = false;
        ls.stagingPrompt = "IGNITION & LIFTOFF! STEER INTO GREEN FLIGHT CORRIDOR!";
        sfx("playLaunch");
        addFloatingText("🚀 LIFTOFF! WE HAVE LIFTOFF!", w / 2, 220, "#00e5ff", 26);
      } else {
        ls.countdown -= 1 / 60;
        const sec = Math.ceil(ls.countdown);

        if (sec !== ls.lastCountdownSec && sec >= 0) {
          ls.lastCountdownSec = sec;
          sfx("playBeep", 880, 0.08); // NASA countdown pip tone

          // Real speech synthesis for mission control audio countdown
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            let txt = null;
            if (sec === 10) txt = "T-minus ten seconds, sound suppression active";
            else if (sec === 6) txt = "Main engine start sequence";
            else if (sec <= 5 && sec > 0) txt = String(sec);
            else if (sec === 0) txt = "Liftoff!";

            if (txt) {
              try {
                const u = new SpeechSynthesisUtterance(txt);
                u.rate = 1.15;
                u.pitch = 0.95;
                window.speechSynthesis.speak(u);
              } catch (e) {}
            }
          }
        }

        if (sec > 6) {
          ls.stagingPrompt = `T-MINUS ${sec}s: SOUND SUPPRESSION WATER DELUGE ACTIVE | [SPACEBAR] SKIP`;
        } else if (sec > 0) {
          ls.stagingPrompt = `T-MINUS ${sec}s: MAIN ENGINE IGNITION START | [SPACEBAR] SKIP`;
        }

        // Rocket stays on pad + Sound Suppression Deluge Steam Clouds
        if (using3D && rocket3D && window.THREE) {
          rocket3D.position.set(0, -12, 0);
          rocket3D.rotation.z = 0;
          if (launchPad3D) {
            launchPad3D.position.set(0, -12, 0);
            launchPad3D.visible = true;
          }

          // Billowing white steam clouds from water deluge manifolds
          const steamPos = new window.THREE.Vector3(
            (Math.random() - 0.5) * 6,
            -14.5,
            (Math.random() - 0.5) * 6
          );
          window.Space3D.addRocketExhaust(steamPos, new window.THREE.Vector3(0, 0.6, 0), 2, true);

          // T-4 seconds: Engine pre-ignition flame starts
          if (sec <= 4) {
            const nozPos = rocket3D.position.clone().add(new window.THREE.Vector3(0, -6.5, 0));
            window.Space3D.addRocketExhaust(nozPos, new window.THREE.Vector3(0, -1, 0), 2);
          }
        }

        if (ls.countdown <= 0) {
          ls.isCountingDown = false;
          ls.stagingPrompt = "LIFTOFF! STEER INTO GREEN FLIGHT CORRIDOR!";
          sfx("playLaunch");
          addFloatingText("🚀 LIFTOFF! WE HAVE LIFTOFF!", w / 2, 220, "#00e5ff", 26);
        }
        return; // Stay on pad until T-0
      }
    }

    ls.timeInFlight++;

    // Gravity turn corridor shifts horizontally to simulate pitching down-range
    const targetTurn = (ls.altitude / 80) * 140;
    ls.corridorX = (w / 2) + targetTurn;

    // Steering Rocket
    const steerSpeed = 2.4;
    if (input.left) {
      ls.rocketX -= steerSpeed;
      ls.angle = Math.max(-0.28, ls.angle - 0.02);
    } else if (input.right) {
      ls.rocketX += steerSpeed;
      ls.angle = Math.min(0.28, ls.angle + 0.02);
    } else {
      ls.angle *= 0.94; // Re-center
    }

    // Rocket acceleration & altitude gain
    const thrust = ls.stage === 1 ? 0.38 : (ls.stage === 2 ? 0.48 : 0.60);
    ls.velocity += thrust;
    ls.altitude += (ls.velocity / 280);
    ls.fuel = Math.max(0, ls.fuel - 0.22);

    // Max-Q Heat
    if (ls.altitude > 12 && ls.altitude < 42) {
      ls.heat = Math.min(100, (ls.velocity / 28) * Math.sin((ls.altitude - 12) / 30 * Math.PI));
    } else {
      ls.heat = Math.max(0, ls.heat - 1.6);
    }

    // Down-range Flight Trajectory from Cape Canaveral (28.5°N, -80.6°W) toward Bermuda
    const downrangeFraction = Math.min(1.0, ls.altitude / 100);
    orbitState.subSatLat = 28.5 + (downrangeFraction * 6.5);
    orbitState.subSatLon = -80.6 + (downrangeFraction * 20.0);

    // Record launch ground track points
    if (orbitState.orbitHistory.length === 0 || Math.abs(orbitState.subSatLon - orbitState.orbitHistory[orbitState.orbitHistory.length - 1].lon) > 0.3) {
      orbitState.orbitHistory.push({ lat: orbitState.subSatLat, lon: orbitState.subSatLon });
      if (orbitState.orbitHistory.length > 250) orbitState.orbitHistory.shift();
    }

    // Sample Houston MOC Rolling Telemetry Strip Chart during Launch (every 15 frames = 4 Hz)
    orbitState.telemetryTick++;
    if (orbitState.telemetryTick >= 15) {
      orbitState.telemetryTick = 0;
      orbitState.telemetryHistory.push({
        battery: ls.fuel,
        temperature: ls.heat,
        downlink: 18.5,
        deltaV: ls.velocity,
        apoapsis: ls.altitude,
        periapsis: 0
      });
      if (orbitState.telemetryHistory.length > 60) {
        orbitState.telemetryHistory.shift();
      }
    }

    // 3D Rocket Transform & Particle Plume
    if (using3D && rocket3D && window.THREE) {
      rocket3D.position.set((ls.rocketX - (w / 2)) * 0.05, -12 + (ls.altitude * 0.28), 0);
      rocket3D.rotation.z = -ls.angle;

      // Billowing 3D Exhaust Fire Plume
      const nozPos = rocket3D.position.clone().add(new window.THREE.Vector3(0, -6.5, 0));
      window.Space3D.addRocketExhaust(nozPos, new window.THREE.Vector3(0, -1, 0), 3);

      // Launch Pad recedes downwards
      if (launchPad3D) {
        launchPad3D.position.y = -12 - (ls.altitude * 0.4);
        if (ls.altitude > 28) launchPad3D.visible = false;
      }

      // Mach 1.0 Transonic Vapor Shock Cone
      ls.isTransonic = (ls.velocity >= 310 && ls.velocity <= 440) || (ls.altitude >= 11 && ls.altitude <= 18);
      if (rocket3D.userData && rocket3D.userData.vaporConeMesh) {
        rocket3D.userData.vaporConeMesh.visible = ls.isTransonic;
      }
      if (ls.isTransonic && !ls.vaporConeAnnounced) {
        ls.vaporConeAnnounced = true;
        addFloatingText("⚡ MACH 1.0 TRANSONIC VAPOR CONE!", ls.rocketX, ls.rocketY - 45, "#00e5ff", 22);
        sfx("playBeep", 1200, 0.12);
      }
    }

    // Staging Checkpoints
    if (ls.stage === 1 && ls.altitude >= 28) {
      ls.stagingPrompt = "⚡ MECO! PRESS [SPACEBAR] OR TAP STAGE TO SEPARATE STAGE 1!";
      if (input.actionJustPressed || ls.fuel <= 0) {
        ls.stage = 2;
        ls.fuel = 100;
        ls.stagingPrompt = "STAGE 2 IGNITION CONFIRMED! CLIMBING TO VACUUM!";
        sfx("playBeep", 650, 0.15);
        addFloatingText("STAGE 1 SEPARATION ✔", ls.rocketX, ls.rocketY - 40, "#00e676", 22);

        // Stage 1 separation in 3D
        if (rocket3D && rocket3D.userData && rocket3D.userData.stage1Mesh) {
          rocket3D.userData.stage1Mesh.position.y -= 4;
        }
      }
    } else if (ls.stage === 2 && ls.altitude >= 60) {
      ls.stagingPrompt = "✨ VACUUM ACHIEVED! PRESS [SPACEBAR] TO JETTISON PAYLOAD FAIRING!";
      if (input.actionJustPressed) {
        ls.stage = 3;
        ls.stagingPrompt = "FAIRING JETTISONED! EXECUTING FINAL ORBITAL INSERTION!";
        sfx("playBeep", 800, 0.15);
        addFloatingText("FAIRING JETTISON ✔", ls.rocketX, ls.rocketY - 40, "#00e5ff", 22);

        // Clamshell fairing separation in 3D
        if (rocket3D && rocket3D.userData && rocket3D.userData.fairingCone) {
          rocket3D.userData.fairingCone.visible = false;
          rocket3D.userData.fairingBase.visible = false;
          if (spacecraft3D) {
            spacecraft3D.visible = true;
            spacecraft3D.position.copy(rocket3D.position).add(new window.THREE.Vector3(0, 3, 0));
          }
        }
      }
    } else if (ls.stage === 3 && ls.altitude >= 98) {
      // Orbital insertion complete! Transition to 3D Orbit Flight
      phase = "orbit";
      sfx("playBeep", 950, 0.25);
      addFloatingText("🎉 ORBIT INSERTION ACHIEVED!", w / 2, 240, "#00e676", 28);

      if (rocket3D) rocket3D.visible = false;
      if (spacecraft3D) {
        spacecraft3D.visible = true;
        spacecraft3D.position.set(0, 0, 55);
        spacecraft3D.rotation.set(0, 0, 0);
      }
      if (window.Space3D) window.Space3D.setCameraMode("chase");
    }
  }

  // 2. UPDATE: ORBITAL OPERATIONS & SCIENCE SCANNING PHASE
  function updateOrbitPhase() {
    const os = orbitState;
    const w = canvasHUD ? canvasHUD.width : 960;
    os.surfaceOffset += 1.2;
    os.orbitProgress += 0.006;

    // Attitude Steering (Left/Right)
    const rotSpeed = 0.055;
    if (input.left) {
      os.angularVelocity = Math.max(-0.08, os.angularVelocity - 0.008);
    } else if (input.right) {
      os.angularVelocity = Math.min(0.08, os.angularVelocity + 0.008);
    } else {
      os.angularVelocity *= 0.95;
    }
    os.angle += os.angularVelocity;

    // Prograde Burn (Up / W): Raises Apoapsis
    if (input.up && os.fuel > 0 && os.deltaV > 0) {
      os.fuel = Math.max(0, os.fuel - 0.2);
      os.deltaV = Math.max(0, os.deltaV - 1.8);
      os.apoapsis += 0.5;
      os.radiusA3D = Math.min(85, os.radiusA3D + 0.02);
      if (window.Space3D && window.Space3D.updateOrbitGeometry) {
        window.Space3D.updateOrbitGeometry(os.radiusA3D, os.radiusP3D, os.inclination);
      }
      if (using3D && spacecraft3D && window.Space3D && window.THREE) {
        const nozPos = spacecraft3D.position.clone().add(new window.THREE.Vector3(0, 0, -2.5));
        window.Space3D.addRocketExhaust(nozPos, new window.THREE.Vector3(0, 0, -1), 3);
      }
    }

    // Retrograde Burn (Down / S): Lowers Periapsis (De-Orbit)
    if (input.down && os.fuel > 0 && os.deltaV > 0) {
      os.fuel = Math.max(0, os.fuel - 0.2);
      os.deltaV = Math.max(0, os.deltaV - 1.8);
      os.periapsis = Math.max(20, os.periapsis - 0.5);
      os.radiusP3D = Math.max(42, os.radiusP3D - 0.02);
      if (window.Space3D && window.Space3D.updateOrbitGeometry) {
        window.Space3D.updateOrbitGeometry(os.radiusA3D, os.radiusP3D, os.inclination);
      }
      if (using3D && spacecraft3D && window.Space3D && window.THREE) {
        const frontPos = spacecraft3D.position.clone().add(new window.THREE.Vector3(0, 0, 2.5));
        window.Space3D.addRocketExhaust(frontPos, new window.THREE.Vector3(0, 0, 1), 3);
      }
    }

    // Atmospheric De-orbit / Hypersonic Re-entry Check (Kármán Line = 100 km)
    if (os.periapsis < 100) {
      os.isReentry = true;
      os.reentryHeat = Math.min(100, os.reentryHeat + 0.35);
      if (window.Space3D && window.Space3D.setReentryPlasma) {
        window.Space3D.setReentryPlasma(true);
      }
      // Hypersonic plasma sheath creates RF blackout
      os.currentStation = null;
      os.groundStationInView = false;
      if (os.periapsis < 65) {
        os.health = Math.max(0, os.health - 0.12);
        if (Math.random() < 0.05) {
          addFloatingText("🔥 HYPERSONIC RE-ENTRY: AERO-THERMAL SHOCK!", w / 2, 230, "#ff3d00", 22);
        }
      }
    } else {
      os.isReentry = false;
      os.reentryHeat = Math.max(0, os.reentryHeat - 0.5);
      if (window.Space3D && window.Space3D.setReentryPlasma) {
        window.Space3D.setReentryPlasma(false);
      }
    }

    // 3D Spacecraft Position along Keplerian Ellipse
    const a = (os.radiusA3D + os.radiusP3D) / 2;
    const b = Math.sqrt(Math.max(1, os.radiusA3D * os.radiusP3D));
    const c = a - os.radiusP3D; // Focal offset
    const incRad = (os.inclination * Math.PI) / 180;
    const craftX = Math.cos(os.orbitProgress) * a - c;
    const craftZ = Math.sin(os.orbitProgress) * b;
    const craftY = Math.sin(os.orbitProgress) * b * Math.sin(incRad);

    if (using3D && spacecraft3D) {
      spacecraft3D.position.set(craftX, craftY, craftZ);
      spacecraft3D.rotation.y = os.angle;
    }

    // --- FEATURE 4: ORBITAL ECLIPSE (UMBRA/PENUMBRA) & THERMAL SHOCK ---
    // Sun vector is normalized from (80, 30, 90) -> (0.645, 0.242, 0.725)
    const sunDot = (craftX * 0.645 + craftY * 0.242 + craftZ * 0.725);
    const distSq = (craftX * craftX + craftY * craftY + craftZ * craftZ) - (sunDot * sunDot);

    // Planet radius = 40. Shadow cone extends behind planet (sunDot < 0)
    if (sunDot < -8.0 && distSq < 1550) {
      os.eclipsePhase = "umbra";
      os.eclipseFactor = 0.0;
      os.targetTemp = -138.0;
    } else if (sunDot < -4.0 && distSq < 1850) {
      os.eclipsePhase = "penumbra";
      os.eclipseFactor = 0.35;
      os.targetTemp = 15.0;
    } else {
      os.eclipsePhase = "sunlight";
      os.eclipseFactor = 1.0;
      os.targetTemp = 115.0;
    }

    // Eclipse State Change Audio & Speech Announcements
    if (os.eclipsePhase !== os.prevEclipsePhase) {
      if (os.eclipsePhase === "umbra") {
        sfx("playBeep", 460, 0.2);
        addFloatingText("🌑 ECLIPSE ENTRY: TOTAL UMBRA (-138°C)", w / 2, 210, "#e040fb", 24);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const u = new SpeechSynthesisUtterance("Warning: Eclipse entry. Umbra confirmed. Switching to internal battery.");
            u.rate = 1.15;
            u.pitch = 0.95;
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }
      } else if (os.prevEclipsePhase === "umbra" && os.eclipsePhase === "sunlight") {
        os.sunriseGlowTimer = 75; // Radiant sunrise lens flare bloom
        sfx("playBeep", 1320, 0.25);
        addFloatingText("🌅 ORBITAL SUNRISE! SOLAR POWER RESTORED", w / 2, 210, "#ffd600", 26);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const u = new SpeechSynthesisUtterance("Orbital sunrise confirmed. Solar arrays charging. Spacecraft exiting shadow.");
            u.rate = 1.15;
            u.pitch = 0.95;
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }
      }
      os.prevEclipsePhase = os.eclipsePhase;
    }

    // Thermal Temperature Transition (Equilibrium Approach)
    os.temperature += (os.targetTemp - os.temperature) * 0.015;

    // Automated Survival Heaters
    if (os.temperature < 0 && os.battery > 0) {
      os.heatersActive = true;
      os.battery = Math.max(0, os.battery - 0.12); // Extra survival heater load
      if (os.temperature < -125) os.temperature = -125; // Heaters stabilize core
    } else {
      os.heatersActive = false;
      if (os.battery <= 0 && os.eclipsePhase === "umbra") {
        // Cold Soak Failure Risk!
        os.health = Math.max(0, os.health - 0.18);
        if (Math.random() < 0.05) {
          addFloatingText("❄️ COLD SOAK HAZARD: AVIONICS FREEZING!", w / 2, 230, "#ff1744", 20);
        }
      }
    }

    // Solar Power Generation vs Battery Drain
    const panelNormal = Math.abs(Math.sin(os.angle));
    if (os.eclipsePhase === "sunlight") {
      if (panelNormal > 0.42) {
        os.battery = Math.min(100, os.battery + 0.22);
      } else {
        os.battery = Math.max(0, os.battery - 0.05);
      }
    } else if (os.eclipsePhase === "penumbra") {
      os.battery = Math.min(100, os.battery + 0.05);
    } else {
      // 0 W in Umbra: Base avionics drain
      os.battery = Math.max(0, os.battery - 0.08);
    }

    // --- FEATURE 1: 2D SUB-SATELLITE POINT & DSN LINE-OF-SIGHT ---
    const theta = os.orbitProgress;
    const latRad = Math.asin(Math.sin(incRad) * Math.sin(theta));
    os.subSatLat = (latRad * 180) / Math.PI;

    os.nodalPrecession += 0.0035; // Nodal precession ~22.5° westward drift per orbit
    const relLonRad = Math.atan2(Math.cos(incRad) * Math.sin(theta), Math.cos(theta));
    let lonDeg = ((relLonRad * 180) / Math.PI) - os.nodalPrecession;
    lonDeg = ((lonDeg + 180) % 360 + 360) % 360 - 180;
    os.subSatLon = lonDeg;

    // Track ground history
    if (os.orbitHistory.length === 0 || Math.abs(os.subSatLon - os.orbitHistory[os.orbitHistory.length - 1].lon) > 1.2) {
      os.orbitHistory.push({ lat: os.subSatLat, lon: os.subSatLon });
      if (os.orbitHistory.length > 250) os.orbitHistory.shift();
    }

    // Check Ground Station Line-Of-Sight (AOS / LOS)
    let contactStation = null;
    let minDistance = 999;
    let closestStation = null;

    for (const st of GROUND_STATIONS) {
      const distDeg = calculateGreatCircleDeg(os.subSatLat, os.subSatLon, st.lat, st.lon);
      if (distDeg <= st.radius) {
        contactStation = st;
        break;
      }
      if (distDeg < minDistance) {
        minDistance = distDeg;
        closestStation = st;
      }
    }

    if (contactStation) {
      if (!os.currentStation) {
        sfx("playBeep", 1440, 0.15);
        addFloatingText(`📡 AOS: ${contactStation.name.toUpperCase()} (LINK ESTABLISHED)`, w / 2, 190, "#00e676", 24);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const u = new SpeechSynthesisUtterance(`Acquisition of signal: ${contactStation.code} carrier locked`);
            u.rate = 1.2;
            u.pitch = 1.0;
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }
      }
      os.currentStation = contactStation;
      os.groundStationInView = true;
      os.dataDownlinked += 2.2; // High downlink throughput

      // 3D Downlink Beam connecting satellite to ground station
      if (using3D && spacecraft3D && window.Space3D && window.THREE && Math.random() < 0.25) {
        const phi = (contactStation.lat * Math.PI) / 180;
        const lam = (contactStation.lon * Math.PI) / 180;
        const rGlobe = 40.2;
        const gsPos = new window.THREE.Vector3(
          rGlobe * Math.cos(phi) * Math.sin(lam),
          rGlobe * Math.sin(phi) - 55,
          rGlobe * Math.cos(phi) * Math.cos(lam)
        );
        window.Space3D.showDownlinkBeam(spacecraft3D.position, gsPos);
      }
    } else {
      if (os.currentStation) {
        addFloatingText(`📡 LOS: ${os.currentStation.code} PASS COMPLETED`, w / 2, 190, "#ffab00", 20);
      }
      os.currentStation = null;
      os.groundStationInView = false;
      if (closestStation) {
        os.nextStationName = closestStation.name;
        os.nextStationEta = Math.max(5, Math.round((minDistance - closestStation.radius) * 4.5));
      }
    }

    // Combo timer decay
    if (os.comboTimer > 0) {
      os.comboTimer--;
      if (os.comboTimer <= 0) os.combo = 1;
    }

    // Spawn Science Targets on Planet Surface
    if (Math.random() < 0.018 && os.targets.length < 3) {
      const targetTypes = [
        { name: "🌀 Cyclone Eyewall", score: 45, icon: "🌀" },
        { name: "🧊 Polar Ice Melt", score: 50, icon: "🧊" },
        { name: "🌋 Volcanic Plume", score: 60, icon: "🌋" },
        { name: "💧 Water Ice Crater", score: 55, icon: "💧" },
        { name: "☄️ NEO Asteroid Flyby", score: 70, icon: "☄️" }
      ];
      const picked = targetTypes[Math.floor(Math.random() * targetTypes.length)];
      os.targets.push({
        name: picked.name,
        score: picked.score,
        icon: picked.icon,
        x: w + 60,
        y: (canvasHUD ? canvasHUD.height : 540) - 90,
        scanned: false
      });
    }

    // Update Targets & Science Scan [SPACEBAR]
    for (let i = os.targets.length - 1; i >= 0; i--) {
      const tgt = os.targets[i];
      tgt.x -= 2.0;

      const inBoresight = Math.abs(tgt.x - (w / 2)) < 85;
      const cameraPointingDown = Math.abs(Math.sin(os.angle)) < 0.45;

      if (inBoresight && cameraPointingDown && !tgt.scanned && input.actionJustPressed) {
        tgt.scanned = true;
        os.combo = Math.min(5, os.combo + 1);
        os.comboTimer = 180;
        const awardedScience = tgt.score * os.combo;
        os.scienceScore += awardedScience;

        sfx("playBeep", 1100, 0.12);
        addFloatingText(`+${awardedScience} SCIENCE! (Combo x${os.combo})`, w / 2, 220, "#00e676", 24);

        // Volumetric 3D Cyan Scan Cone onto Planet Surface
        if (using3D && spacecraft3D && window.Space3D && window.THREE) {
          const targetSurface = new window.THREE.Vector3(
            spacecraft3D.position.x * 0.72,
            -18,
            spacecraft3D.position.z * 0.72
          );
          window.Space3D.showScanCone(spacecraft3D.position, targetSurface);
        }

        // Sync with GameEngine
        const sim = window.GameEngine.getState().simulation;
        sim.scienceCollected += (awardedScience / 10);
      }

      if (tgt.x < -80) os.targets.splice(i, 1);
    }

    // Spawn Space Debris
    if (Math.random() < 0.012 && os.debris.length < 2) {
      os.debris.push({
        x: w + 50,
        y: (canvasHUD ? canvasHUD.height : 540) / 2 + (Math.random() - 0.5) * 80,
        vx: -(3.5 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 1.5,
        size: 8 + Math.random() * 6
      });
    }

    // Update Debris & Collision Detection
    for (let i = os.debris.length - 1; i >= 0; i--) {
      const deb = os.debris[i];
      deb.x += deb.vx;
      deb.y += deb.vy;

      const dx = deb.x - (w / 2);
      const dy = deb.y - ((canvasHUD ? canvasHUD.height : 540) / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 30) {
        os.health = Math.max(0, os.health - 20);
        sfx("playAlarm");
        addFloatingText("💥 IMPACT! HULL INTEGRITY -20%", w / 2, 200, "#ff1744", 24);
        os.debris.splice(i, 1);
        continue;
      }

      if (deb.x < -60) os.debris.splice(i, 1);
    }

    // Solar Storm Anomaly event trigger
    os.solarFlareTimer++;
    if (os.solarFlareTimer > 900) {
      os.solarFlared = true;
      if (os.solarFlareTimer > 1150) {
        os.solarFlared = false;
        os.solarFlareTimer = 0;
      } else if (panelNormal > 0.8) {
        os.health = Math.max(0, os.health - 0.05);
      }
    }

    // In-Flight Emergency Anomaly Clock & Failure Check
    if (os.anomaly.active) {
      os.anomaly.timer -= 1 / 60;
      const cdEl = document.getElementById("anomaly-countdown");
      if (cdEl) {
        cdEl.textContent = `T-${Math.max(0, Math.ceil(os.anomaly.timer))}s`;
      }
      if (os.anomaly.timer <= 0) {
        os.anomaly.active = false;
        os.anomaly.cooldown = 1200;
        const banner = document.getElementById("flight-anomaly-banner");
        const touchBtn = document.getElementById("ctrl-anomaly");
        if (banner) banner.style.display = "none";
        if (touchBtn) touchBtn.style.display = "none";

        os.health = Math.max(0, os.health - 25);
        sfx("playAlarm");
        addFloatingText("💥 ANOMALY TIMEOUT: CRITICAL SUBSYSTEM LOSS (-25% HP)", w / 2, 170, "#ff1744", 26);
      }
    } else {
      os.anomaly.cooldown--;
      if (os.anomaly.cooldown <= 0) {
        triggerAnomaly();
      }
    }

    // Sample Houston MOC Rolling Telemetry Strip Chart (every 15 frames = 4 Hz)
    os.telemetryTick++;
    if (os.telemetryTick >= 15) {
      os.telemetryTick = 0;
      os.telemetryHistory.push({
        battery: os.battery,
        temperature: os.temperature,
        downlink: os.currentStation ? (2.2 * 8) : 0,
        deltaV: os.deltaV,
        apoapsis: os.apoapsis,
        periapsis: os.periapsis
      });
      if (os.telemetryHistory.length > 60) {
        os.telemetryHistory.shift();
      }
    }

    // Safe Exploration Mode Safeguards (Allows uninterrupted viewing of all perspectives)
    if (os.safeMode) {
      os.battery = Math.max(35, os.battery);
      os.health = Math.max(50, os.health);
      if (os.temperature < -40) os.temperature = -40;
      if (os.anomaly.active && os.anomaly.timer < 3) {
        resolveCurrentAnomaly();
      }
    }

    // Health depletion check (active only when safeMode is false)
    if (os.health <= 0 && !os.safeMode) {
      phase = "gameover";
      sfx("playAlarm");
    }
  }

  // =========================================================================
  // DRAWING / RENDERING
  // =========================================================================
  function draw() {
    // 1. Render 3D WebGL Scene with Solar Shadow & Thermal Lighting
    if (using3D && window.Space3D) {
      window.Space3D.renderFrame({
        attitudeAngle: orbitState.angle,
        eclipseFactor: orbitState.eclipseFactor,
        isSunrise: orbitState.sunriseGlowTimer > 0
      });
    }

    // 2. Render 2D Telemetry & HUD on Overlay Canvas
    if (ctx && canvasHUD) {
      const w = canvasHUD.width;
      const h = canvasHUD.height;
      ctx.clearRect(0, 0, w, h);

      if (phase === "launch") {
        drawLaunchHUD(w, h);
      } else if (phase === "orbit") {
        drawOrbitHUD(w, h);
      } else if (phase === "gameover") {
        drawGameOver(w, h);
      }

      updateAndDrawFloatingTexts();
    }

    // 3. Render Houston MCC 2D Ground Track Orbit Map & Rolling Strip Chart
    drawMCCGroundTrack();
    drawMCCTelemetryChart();
    drawOpticalFeedCanvas();
  }

  // 1. DRAW LAUNCH HUD
  function drawLaunchHUD(w, h) {
    const ls = launchState;

    // Green Flight Corridor Reticle Overlay
    ctx.strokeStyle = "rgba(0, 230, 118, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(ls.corridorX - 70, 0);
    ctx.lineTo(ls.corridorX - 70, h);
    ctx.moveTo(ls.corridorX + 70, 0);
    ctx.lineTo(ls.corridorX + 70, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(0, 230, 118, 0.06)";
    ctx.fillRect(ls.corridorX - 70, 0, 140, h);

    // Top Telemetry Bar
    ctx.fillStyle = "rgba(10, 15, 30, 0.85)";
    ctx.fillRect(20, 16, w - 40, 52);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    ctx.strokeRect(20, 16, w - 40, 52);

    ctx.font = "bold 15px 'Orbitron', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`ALTITUDE: ${Math.round(ls.altitude)} km (Kármán: 100 km)`, 36, 40);

    ctx.fillStyle = "#00e5ff";
    ctx.fillText(`VELOCITY: ${Math.round(ls.velocity)} m/s`, 36, 58);

    ctx.fillStyle = ls.fuel < 20 ? "#ff1744" : "#ffd600";
    ctx.textAlign = "right";
    ctx.fillText(`STAGE ${ls.stage} FUEL: ${Math.round(ls.fuel)}%`, w - 36, 40);

    ctx.fillStyle = ls.heat > 50 ? "#ff5722" : "#a5d6a7";
    ctx.fillText(`MAX-Q HEAT: ${Math.round(ls.heat)}%`, w - 36, 58);

    // Transonic Mach 1.0 Vapor Shock Cone Alert Banner
    if (ls.isTransonic) {
      ctx.fillStyle = "rgba(0, 229, 255, 0.25)";
      ctx.fillRect(w / 2 - 270, 74, 540, 30);
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w / 2 - 270, 74, 540, 30);

      ctx.font = "bold 13px 'Orbitron', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("⚡ TRANSONIC REGIME: MACH 1.0 • VAPOR SHOCK CONE ACTIVE", w / 2, 94);
    }

    // Center Staging Prompt Banner
    if (ls.stagingPrompt && !ls.isCountingDown) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(w / 2 - 280, 80, 560, 36);
      ctx.strokeStyle = "#ffd600";
      ctx.strokeRect(w / 2 - 280, 80, 560, 36);

      ctx.font = "bold 14px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#ffd600";
      ctx.textAlign = "center";
      ctx.fillText(ls.stagingPrompt, w / 2, 103);
    }

    // NASA T-Minus Digital Countdown Overlay
    if (ls.isCountingDown) {
      const sec = Math.max(0, Math.ceil(ls.countdown));
      ctx.fillStyle = "rgba(2, 8, 20, 0.88)";
      ctx.fillRect(w / 2 - 250, h / 2 - 95, 500, 190);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 250, h / 2 - 95, 500, 190);

      // Header
      ctx.font = "bold 13px 'Orbitron', monospace";
      ctx.fillStyle = "#00e5ff";
      ctx.textAlign = "center";
      ctx.fillText("KENNEDY SPACE CENTER LC-39A • COUNTDOWN", w / 2, h / 2 - 65);

      // Digital Timer
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillStyle = sec <= 3 ? "#ff1744" : (sec <= 6 ? "#ffd600" : "#00e676");
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.fillText(`T - 00:0${sec}`, w / 2, h / 2);
      ctx.shadowBlur = 0;

      // Status line
      ctx.font = "bold 14px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(sec > 6 ? "SOUND SUPPRESSION WATER DELUGE ACTIVE" : "MAIN ENGINES IGNITED • ALL SYSTEMS GO", w / 2, h / 2 + 35);

      // Skip prompt
      ctx.font = "12px 'Rajdhani', sans-serif";
      ctx.fillStyle = "rgba(0, 229, 255, 0.8)";
      ctx.fillText("PRESS [SPACEBAR] OR TAP TO SKIP TO IMMEDIATE LIFTOFF", w / 2, h / 2 + 65);
    }

    // Onboard RocketCam PIP Optical Monitor
    drawOnboardPIP(w - 215, 78, 195, 110);
  }

  // 2. DRAW ORBIT HUD
  function drawOrbitHUD(w, h) {
    const os = orbitState;

    // Top Telemetry Bar
    ctx.fillStyle = "rgba(10, 15, 30, 0.88)";
    ctx.fillRect(20, 14, w - 40, 58);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    ctx.strokeRect(20, 14, w - 40, 58);

    ctx.font = "bold 14px 'Orbitron', monospace";
    ctx.fillStyle = "#00e676";
    ctx.textAlign = "left";
    ctx.fillText(`SCIENCE RETURN: ${Math.round(os.scienceScore)} PTS`, 36, 36);

    ctx.fillStyle = os.combo > 1 ? "#ffd600" : "#80deea";
    ctx.font = "12px 'Rajdhani', sans-serif";
    ctx.fillText(`COMBO MULTIPLIER: x${os.combo}`, 36, 56);

    // Battery & RCS
    ctx.textAlign = "center";
    ctx.font = "bold 13px 'Orbitron', monospace";
    if (os.eclipsePhase === "sunlight") {
      ctx.fillStyle = "#00e676";
      ctx.fillText(`BATTERY: ${Math.round(os.battery)}% ⚡ [▲ CHARGING]`, w / 2 - 90, 36);
    } else {
      ctx.fillStyle = "#ffd600";
      ctx.fillText(`BATTERY: ${Math.round(os.battery)}% ⚡ [▼ DRAIN ${os.heatersActive ? "HEATERS" : ""}]`, w / 2 - 90, 36);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px 'Rajdhani', sans-serif";
    ctx.fillText(`RCS FUEL: ${Math.round(os.fuel)}% ⛽`, w / 2 - 90, 56);

    // Thermal & Eclipse Status
    ctx.font = "bold 13px 'Orbitron', monospace";
    if (os.eclipsePhase === "umbra") {
      ctx.fillStyle = "#e040fb";
      ctx.fillText(`THERMAL: ${Math.round(os.temperature)}°C [🌑 UMBRA]`, w / 2 + 105, 36);
    } else if (os.eclipsePhase === "penumbra") {
      ctx.fillStyle = "#ffab00";
      ctx.fillText(`THERMAL: ${Math.round(os.temperature)}°C [🌓 PENUMBRA]`, w / 2 + 105, 36);
    } else {
      ctx.fillStyle = "#81d4fa";
      ctx.fillText(`THERMAL: +${Math.round(os.temperature)}°C [☀️ SUN]`, w / 2 + 105, 36);
    }

    ctx.font = "12px 'Rajdhani', sans-serif";
    ctx.fillStyle = os.currentStation ? "#00e676" : "#ffd600";
    ctx.fillText(`DOWNLINK: ${Math.round(os.dataDownlinked)} GB 📡 ${os.currentStation ? "(" + os.currentStation.code + " AOS)" : "(LOS)"}`, w / 2 + 105, 56);

    // Right Side: Health & Action
    ctx.textAlign = "right";
    ctx.font = "bold 13px 'Orbitron', monospace";
    ctx.fillStyle = os.health > 40 ? "#00e676" : "#ff1744";
    ctx.fillText(`HEALTH: ${Math.round(os.health)}% 🛡️`, w - 36, 36);

    ctx.font = "12px 'Rajdhani', sans-serif";
    ctx.fillStyle = "#81d4fa";
    ctx.fillText("SPACE: SCAN / STAGE", w - 36, 56);

    // Keplerian Orbit Dynamics Telemetry Sub-bar
    ctx.fillStyle = "rgba(4, 12, 28, 0.88)";
    ctx.fillRect(20, 74, w - 40, 24);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
    ctx.strokeRect(20, 74, w - 40, 24);

    ctx.font = "bold 11px 'Orbitron', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#00e5ff";
    ctx.fillText(`APOAPSIS (Ap): ${Math.round(os.apoapsis)} km`, 36, 90);

    ctx.fillStyle = os.periapsis < 100 ? "#ff3d00" : "#ffd600";
    ctx.fillText(`PERIAPSIS (Pe): ${Math.round(os.periapsis)} km ${os.periapsis < 100 ? "⚠️ [ATMOSPHERE]" : ""}`, 260, 90);

    ctx.fillStyle = "#ff9100";
    ctx.fillText(`REMAINING ΔV: ${Math.round(os.deltaV)} m/s`, 520, 90);

    ctx.fillStyle = "#a5d6a7";
    ctx.textAlign = "right";
    ctx.fillText("MANEUVERS: [W] PROGRADE (Ap▲) • [S] RETROGRADE (Pe▼)", w - 36, 90);

    // Hypersonic Re-entry Alert Banner
    if (os.isReentry) {
      ctx.fillStyle = "rgba(255, 61, 0, 0.35)";
      ctx.fillRect(w / 2 - 270, 102, 540, 28);
      ctx.strokeStyle = "#ff3d00";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w / 2 - 270, 102, 540, 28);

      ctx.font = "bold 12px 'Orbitron', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`🔥 HYPERSONIC RE-ENTRY ACTIVE • ABLATIVE HEAT: ${Math.round(os.reentryHeat)}% • RF BLACKOUT`, w / 2, 121);
    }

    // Mini Houston MCC Orbit Track HUD Radar (Bottom-Left)
    ctx.fillStyle = "rgba(4, 10, 24, 0.85)";
    ctx.fillRect(20, h - 116, 225, 96);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, h - 116, 225, 96);

    ctx.font = "bold 10px 'Orbitron', monospace";
    ctx.fillStyle = "#00e5ff";
    ctx.textAlign = "left";
    ctx.fillText("🛰️ HOUSTON MCC ORBIT RADAR", 30, h - 98);

    ctx.font = "bold 11px 'Rajdhani', sans-serif";
    ctx.fillStyle = os.currentStation ? "#00e676" : "#ffab00";
    ctx.fillText(os.currentStation ? `● AOS: ${os.currentStation.name} [LOCKED]` : `● LOS [NEXT: ${os.nextStationName}]`, 30, h - 80);

    const latDir = os.subSatLat >= 0 ? "N" : "S";
    const lonDir = os.subSatLon >= 0 ? "E" : "W";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`SSP: ${Math.abs(os.subSatLat).toFixed(1)}°${latDir}, ${Math.abs(os.subSatLon).toFixed(1)}°${lonDir}`, 30, h - 63);

    ctx.fillStyle = os.temperature < 0 ? "#80deea" : "#ffd600";
    ctx.fillText(`CORE: ${os.temperature > 0 ? "+" : ""}${Math.round(os.temperature)}°C [${os.eclipsePhase.toUpperCase()}]`, 30, h - 46);

    ctx.fillStyle = "rgba(0, 229, 255, 0.75)";
    ctx.font = "10px 'Rajdhani', sans-serif";
    ctx.fillText("⌨️ [M] SCROLL TO 2D WORLD MAP", 30, h - 29);

    // Target scanning prompt when target in boresight
    const activeTarget = os.targets.find(t => Math.abs(t.x - (w / 2)) < 85 && !t.scanned);
    if (activeTarget) {
      ctx.fillStyle = "rgba(0, 229, 255, 0.25)";
      ctx.fillRect(w / 2 - 220, 80, 440, 36);
      ctx.strokeStyle = "#00e5ff";
      ctx.strokeRect(w / 2 - 220, 80, 440, 36);

      ctx.font = "bold 15px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#00e5ff";
      ctx.textAlign = "center";
      ctx.fillText(`🎯 ${activeTarget.name.toUpperCase()} IN SIGHT: PRESS [SPACE] TO SCAN!`, w / 2, 103);
    }

    // Solar Storm Alert
    if (os.solarFlared) {
      ctx.fillStyle = "rgba(255, 87, 34, 0.2)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ff5722";
      ctx.font = "bold 18px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠️ SOLAR FLARE CORONA ACTIVE - ROTATE PANELS EDGE-ON!", w / 2, 140);
    }

    // Sunrise Lens Flare / Atmospheric Horizon Bloom
    if (os.sunriseGlowTimer > 0) {
      const alpha = Math.min(0.8, os.sunriseGlowTimer / 60);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.75);
      grad.addColorStop(0, `rgba(255, 245, 180, ${alpha * 0.95})`);
      grad.addColorStop(0.25, `rgba(255, 200, 60, ${alpha * 0.7})`);
      grad.addColorStop(0.65, `rgba(0, 229, 255, ${alpha * 0.35})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      os.sunriseGlowTimer--;
    }

    // Authentic ADI Flight Navball (Bottom-Center)
    drawNavball(w / 2, h - 62, 38);

    // Onboard SpacecraftCam PIP Optical Monitor (Top-Right)
    drawOnboardPIP(w - 215, 104, 195, 110);
  }

  // =========================================================================
  // ADVANCED FEATURE: FLIGHT ADI NAVBALL (8-BALL ATTITUDE DIRECTOR INDICATOR)
  // =========================================================================
  function drawNavball(cx, cy, r) {
    if (!ctx) return;
    const os = orbitState;
    ctx.save();

    // Outer shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = "#030814";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Clip to spherical inner viewport
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Rotate context by spacecraft attitude roll angle
    ctx.translate(cx, cy);
    ctx.rotate(os.angle);

    // Pitch shift along local vertical
    const pitchOffset = Math.sin(os.orbitProgress) * 12;

    // Sky Hemisphere (Top - Aerospace Blue)
    ctx.fillStyle = "#0277bd";
    ctx.fillRect(-r * 1.5, -r * 1.5 + pitchOffset, r * 3, r * 1.5);

    // Ground/Earth Hemisphere (Bottom - Aerospace Amber/Brown)
    ctx.fillStyle = "#bf360c";
    ctx.fillRect(-r * 1.5, pitchOffset, r * 3, r * 1.5);

    // Artificial Horizon Line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 1.5, pitchOffset);
    ctx.lineTo(r * 1.5, pitchOffset);
    ctx.stroke();

    // Pitch Ladder Rungs (+20°, +10°, -10°, -20°)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.2;
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";

    [-20, -10, 10, 20].forEach(deg => {
      const py = pitchOffset - (deg * 1.2);
      if (Math.abs(py) < r - 4) {
        ctx.beginPath();
        const rw = (Math.abs(deg) === 20) ? 22 : 14;
        ctx.moveTo(-rw / 2, py);
        ctx.lineTo(rw / 2, py);
        ctx.stroke();
        ctx.fillText(deg.toString(), rw / 2 + 7, py + 3);
      }
    });

    // Prograde Reticle (Yellow circle with 3 fins)
    const proY = pitchOffset;
    ctx.strokeStyle = "#ffd600";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, proY, 5.5, 0, Math.PI * 2);
    ctx.moveTo(-9, proY); ctx.lineTo(-5.5, proY);
    ctx.moveTo(5.5, proY); ctx.lineTo(9, proY);
    ctx.moveTo(0, proY - 9); ctx.lineTo(0, proY - 5.5);
    ctx.stroke();

    // Retrograde Reticle (Circle with cross) - 180° away
    const retroY = pitchOffset + r * 1.25;
    if (Math.abs(retroY) < r) {
      ctx.strokeStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(0, retroY, 5.5, 0, Math.PI * 2);
      ctx.moveTo(-4, retroY - 4); ctx.lineTo(4, retroY + 4);
      ctx.moveTo(-4, retroY + 4); ctx.lineTo(4, retroY - 4);
      ctx.stroke();
    }

    ctx.restore();

    // Center Fixed Aircraft / Spacecraft Reference Reticle (>--o--<)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "#ffd600";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.moveTo(-16, 0); ctx.lineTo(-6, 0); ctx.lineTo(-4, 4);
    ctx.moveTo(16, 0); ctx.lineTo(6, 0); ctx.lineTo(4, 4);
    ctx.stroke();
    ctx.restore();

    // Title label
    ctx.font = "bold 9px 'Orbitron', monospace";
    ctx.fillStyle = "#00e5ff";
    ctx.textAlign = "center";
    ctx.fillText("ADI NAVBALL", cx, cy - r - 6);
  }

  // =========================================================================
  // ADVANCED FEATURE: ONBOARD ROCKETCAM / SPACECRAFTCAM PIP OPTICAL MONITOR
  // =========================================================================
  function drawOnboardPIP(x, y, pw, ph) {
    if (!ctx) return;
    drawOpticalToCanvas(ctx, x, y, pw, ph, false);
  }

  let opticalCanvas = null;
  let opticalCtx = null;

  function drawOpticalFeedCanvas() {
    if (orbitState.viewMode !== "optical") return;
    if (!opticalCanvas) opticalCanvas = document.getElementById("optical-feed-canvas");
    if (!opticalCanvas || !opticalCanvas.getContext) return;
    if (!opticalCtx) opticalCtx = opticalCanvas.getContext("2d");

    drawOpticalToCanvas(opticalCtx, 0, 0, opticalCanvas.width, opticalCanvas.height, true);
  }

  function drawOpticalToCanvas(tCtx, x, y, pw, ph, isFullscreen = false) {
    if (!tCtx) return;
    tCtx.save();

    // Outer aerospace monitor frame
    tCtx.fillStyle = "rgba(4, 10, 24, 0.95)";
    tCtx.fillRect(x, y, pw, ph);
    tCtx.strokeStyle = "rgba(0, 229, 255, 0.65)";
    tCtx.lineWidth = isFullscreen ? 2.5 : 1.5;
    tCtx.strokeRect(x, y, pw, ph);

    // Inner clipping
    tCtx.beginPath();
    tCtx.rect(x + 1, y + 1, pw - 2, ph - 2);
    tCtx.clip();

    const t = Date.now() * 0.002;

    if (phase === "launch") {
      // Rocket ascent optical feed
      const altNorm = Math.min(1, launchState.altitude / 100);
      const skyGrad = tCtx.createLinearGradient(x, y, x, y + ph);
      skyGrad.addColorStop(0, `rgb(${Math.round(20 * (1 - altNorm))}, ${Math.round(40 * (1 - altNorm))}, ${Math.round(70 * (1 - altNorm))})`);
      skyGrad.addColorStop(1, `rgb(${Math.round(100 * (1 - altNorm))}, ${Math.round(180 * (1 - altNorm))}, ${Math.round(255 * (1 - altNorm))})`);
      tCtx.fillStyle = skyGrad;
      tCtx.fillRect(x, y, pw, ph);

      // Rocket fuselage curve
      tCtx.fillStyle = "#e0e6ed";
      tCtx.beginPath();
      tCtx.ellipse(x + (pw * 0.2), y + ph + (ph * 0.2), pw * 0.25, ph * 0.9, -0.2, 0, Math.PI * 2);
      tCtx.fill();

      // Rocket engine fire plume
      const fireX = x + (pw * 0.28);
      const fireY = y + ph - 10;
      const fireGrad = tCtx.createRadialGradient(fireX, fireY, 5, fireX, fireY, isFullscreen ? 80 : 35);
      fireGrad.addColorStop(0, "#ffffff");
      fireGrad.addColorStop(0.3, "#ffd600");
      fireGrad.addColorStop(0.8, "rgba(255, 61, 0, 0.8)");
      fireGrad.addColorStop(1, "rgba(255, 61, 0, 0)");
      tCtx.fillStyle = fireGrad;
      tCtx.beginPath();
      tCtx.arc(fireX, fireY, (isFullscreen ? 65 : 26) + Math.sin(t * 18) * (isFullscreen ? 10 : 4), 0, Math.PI * 2);
      tCtx.fill();
    } else {
      // Spacecraft orbit optical feed
      tCtx.fillStyle = "#01040a";
      tCtx.fillRect(x, y, pw, ph);

      // Distant Stars
      tCtx.fillStyle = "#ffffff";
      tCtx.fillRect(x + (pw * 0.15), y + (ph * 0.25), 1.5, 1.5);
      tCtx.fillRect(x + (pw * 0.45), y + (ph * 0.18), 1.2, 1.2);
      tCtx.fillRect(x + (pw * 0.8), y + (ph * 0.35), 1.5, 1.5);
      tCtx.fillRect(x + (pw * 0.65), y + (ph * 0.7), 1.2, 1.2);

      // Earth limb curvature
      const earthRadius = isFullscreen ? (pw * 0.65) : 95;
      const earthCenterY = y + ph + (isFullscreen ? (ph * 0.45) : 65);
      const earthGrad = tCtx.createRadialGradient(x + pw / 2, earthCenterY, 30, x + pw / 2, earthCenterY, earthRadius);
      earthGrad.addColorStop(0, "#1565c0");
      earthGrad.addColorStop(0.6, "#00838f");
      earthGrad.addColorStop(0.85, "#00e5ff");
      earthGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
      tCtx.fillStyle = earthGrad;
      tCtx.beginPath();
      tCtx.arc(x + pw / 2, earthCenterY, earthRadius, 0, Math.PI * 2);
      tCtx.fill();

      // Solar Array Wing in foreground (Top-left)
      const panelW = isFullscreen ? 160 : 42;
      const panelH = isFullscreen ? 65 : 18;
      tCtx.fillStyle = "#0d47a1";
      tCtx.fillRect(x + (pw * 0.05), y + (ph * 0.15), panelW, panelH);
      tCtx.strokeStyle = "#82b1ff";
      tCtx.lineWidth = 1.2;
      tCtx.strokeRect(x + (pw * 0.05), y + (ph * 0.15), panelW, panelH);

      // Hypersonic Re-entry Plasma Sheath across lens
      if (orbitState.isReentry) {
        const plasmaGrad = tCtx.createLinearGradient(x, y, x + pw, y + ph);
        plasmaGrad.addColorStop(0, "rgba(255, 61, 0, 0.45)");
        plasmaGrad.addColorStop(0.5, "rgba(255, 145, 0, 0.25)");
        plasmaGrad.addColorStop(1, "rgba(255, 61, 0, 0.6)");
        tCtx.fillStyle = plasmaGrad;
        tCtx.fillRect(x, y, pw, ph);
      }
    }

    // CRT Scanlines
    tCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
    for (let sy = y; sy < y + ph; sy += (isFullscreen ? 4 : 3)) {
      tCtx.fillRect(x, sy, pw, 1);
    }

    // Header: REC blip + Title
    tCtx.fillStyle = "rgba(0, 0, 0, 0.78)";
    const barH = isFullscreen ? 26 : 18;
    tCtx.fillRect(x, y, pw, barH);
    const blink = Math.sin(t * 5) > 0;
    tCtx.fillStyle = blink ? "#ff1744" : "#757575";
    tCtx.beginPath();
    tCtx.arc(x + 12, y + (barH / 2), isFullscreen ? 5 : 3.5, 0, Math.PI * 2);
    tCtx.fill();

    tCtx.font = isFullscreen ? "bold 12px 'Orbitron', monospace" : "bold 9px 'Orbitron', monospace";
    tCtx.fillStyle = "#00e5ff";
    tCtx.textAlign = "left";
    tCtx.fillText(phase === "launch" ? "ROCKETCAM • ONBOARD OPTICAL" : "SPACECRAFTCAM • NADIR OPTICAL", x + (isFullscreen ? 26 : 18), y + (barH / 2) + (isFullscreen ? 4 : 3));

    tCtx.font = isFullscreen ? "11px monospace" : "8px monospace";
    tCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
    tCtx.textAlign = "right";
    tCtx.fillText("FOV 65° • CLICK TO ENLARGE", x + pw - 8, y + (barH / 2) + (isFullscreen ? 4 : 3));

    tCtx.restore();
  }

  // =========================================================================
  // ADVANCED FEATURE: HOUSTON MOC 4-CHANNEL ROLLING TELEMETRY STRIP CHART
  // =========================================================================
  let stripCanvas = null;
  let stripCtx = null;

  function drawMCCTelemetryChart() {
    if (!stripCanvas) stripCanvas = document.getElementById("mcc-stripchart-canvas");
    if (!stripCanvas || !stripCanvas.getContext) return;
    if (!stripCtx) stripCtx = stripCanvas.getContext("2d");

    const w = stripCanvas.width;
    const h = stripCanvas.height;
    const history = orbitState.telemetryHistory;

    // Background
    stripCtx.fillStyle = "#020712";
    stripCtx.fillRect(0, 0, w, h);

    // Grid lines
    stripCtx.strokeStyle = "rgba(0, 229, 255, 0.12)";
    stripCtx.lineWidth = 1;
    for (let gy = 0; gy <= h; gy += 30) {
      stripCtx.beginPath();
      stripCtx.moveTo(0, gy);
      stripCtx.lineTo(w, gy);
      stripCtx.stroke();
    }
    for (let gx = 0; gx <= w; gx += 60) {
      stripCtx.beginPath();
      stripCtx.moveTo(gx, 0);
      stripCtx.lineTo(gx, h);
      stripCtx.stroke();
    }

    if (!history || history.length < 2) {
      stripCtx.fillStyle = "rgba(0, 229, 255, 0.5)";
      stripCtx.font = "11px 'Orbitron', monospace";
      stripCtx.textAlign = "center";
      stripCtx.fillText("ACQUIRING REAL-TIME 4-CHANNEL S-BAND TELEMETRY STREAM...", w / 2, h / 2 + 4);
      return;
    }

    const n = history.length;
    const stepX = w / 59; // 60 data points buffer

    function drawChannel(color, getValueNorm) {
      stripCtx.strokeStyle = color;
      stripCtx.lineWidth = 2;
      stripCtx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * stepX;
        const valNorm = Math.max(0, Math.min(1, getValueNorm(history[i])));
        const y = h - 6 - valNorm * (h - 16);
        if (i === 0) stripCtx.moveTo(x, y);
        else stripCtx.lineTo(x, y);
      }
      stripCtx.stroke();

      // Leading data blip
      if (n > 0) {
        const lastX = (n - 1) * stepX;
        const lastNorm = Math.max(0, Math.min(1, getValueNorm(history[n - 1])));
        const lastY = h - 6 - lastNorm * (h - 16);
        stripCtx.fillStyle = color;
        stripCtx.beginPath();
        stripCtx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
        stripCtx.fill();
      }
    }

    // CH-1: Battery / Propellant (0-100%) -> Cyan
    drawChannel("#00e5ff", (d) => d.battery / 100);

    // CH-2: Core Temperature (-150°C to +150°C) or Launch Max-Q Heat (0-100°C) -> Magenta
    drawChannel("#e040fb", (d) => phase === "launch" ? (d.temperature / 100) : ((d.temperature + 150) / 300));

    // CH-3: RF Downlink (0-20 Mbps) -> Green
    drawChannel("#00e676", (d) => d.downlink / 20);

    // CH-4: Ascent Velocity (0-8000 m/s) in launch, or Delta-V (0-1500 m/s) in orbit -> Orange
    drawChannel("#ff9100", (d) => phase === "launch" ? (d.deltaV / 8000) : (d.deltaV / 1500));
  }

  // =========================================================================
  // FEATURE 1: HOUSTON MCC 2D ORBIT GROUND TRACK & TELEMETRY CONSOLE
  // =========================================================================
  function drawMCCGroundTrack() {
    if (!mccCanvas) mccCanvas = document.getElementById("mcc-groundtrack-canvas");
    if (!mccCanvas || !mccCanvas.getContext) return;
    if (!mccCtx) mccCtx = mccCanvas.getContext("2d");

    const w = mccCanvas.width;
    const h = mccCanvas.height;
    const os = orbitState;

    // 1. Draw World Map Background
    if (mccMapImg && mccMapImg.complete && mccMapImg.naturalWidth > 0) {
      mccCtx.drawImage(mccMapImg, 0, 0, w, h);
    } else {
      mccCtx.fillStyle = "#020b18";
      mccCtx.fillRect(0, 0, w, h);
    }

    // Coordinate grid overlay
    mccCtx.strokeStyle = "rgba(0, 229, 255, 0.12)";
    mccCtx.lineWidth = 1;
    // Latitudes: Equator & Tropics
    [-60, -30, 0, 30, 60].forEach(lat => {
      const y = ((90 - lat) / 180) * h;
      mccCtx.beginPath();
      mccCtx.moveTo(0, y);
      mccCtx.lineTo(w, y);
      if (lat === 0) {
        mccCtx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        mccCtx.setLineDash([4, 4]);
      } else {
        mccCtx.strokeStyle = "rgba(0, 229, 255, 0.12)";
        mccCtx.setLineDash([2, 4]);
      }
      mccCtx.stroke();
    });
    // Longitudes
    [-120, -60, 0, 60, 120].forEach(lon => {
      const x = ((lon + 180) / 360) * w;
      mccCtx.beginPath();
      mccCtx.moveTo(x, 0);
      mccCtx.lineTo(x, h);
      mccCtx.strokeStyle = (lon === 0) ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 229, 255, 0.12)";
      mccCtx.setLineDash([2, 4]);
      mccCtx.stroke();
    });
    mccCtx.setLineDash([]);

    // 2. Night Terminator Shading
    const sunLon = (((-os.nodalPrecession * 2) % 360 + 360) % 360) - 180;
    const nightCenterLon = ((sunLon + 180 + 180) % 360) - 180;
    const nightX = ((nightCenterLon + 180) / 360) * w;
    const nightGrad = mccCtx.createRadialGradient(nightX, h / 2, 20, nightX, h / 2, w * 0.45);
    nightGrad.addColorStop(0, "rgba(2, 6, 20, 0.68)");
    nightGrad.addColorStop(0.7, "rgba(2, 6, 20, 0.5)");
    nightGrad.addColorStop(1, "rgba(2, 6, 20, 0.0)");
    mccCtx.fillStyle = nightGrad;
    mccCtx.fillRect(0, 0, w, h);

    // 3. Ground Stations & Radio LOS Cones
    GROUND_STATIONS.forEach(st => {
      const sx = ((st.lon + 180) / 360) * w;
      const sy = ((90 - st.lat) / 180) * h;
      const rx = (st.radius / 360) * w;
      const ry = (st.radius / 180) * h;

      const isContact = os.currentStation && os.currentStation.id === st.id;

      // LOS Coverage Footprint Circle
      mccCtx.beginPath();
      mccCtx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      if (isContact) {
        mccCtx.fillStyle = "rgba(0, 230, 118, 0.22)";
        mccCtx.fill();
        mccCtx.strokeStyle = "#00e676";
        mccCtx.lineWidth = 2;
        mccCtx.stroke();
      } else {
        mccCtx.fillStyle = "rgba(0, 229, 255, 0.06)";
        mccCtx.fill();
        mccCtx.strokeStyle = st.color;
        mccCtx.lineWidth = 1;
        mccCtx.stroke();
      }

      // Station Dish Icon & Callsign
      mccCtx.fillStyle = isContact ? "#00e676" : st.color;
      mccCtx.font = "bold 10px 'Orbitron', monospace";
      mccCtx.textAlign = "center";
      mccCtx.fillText(`📡 ${st.code}`, sx, sy - ry - 4);
    });

    // 4. Orbital Ground Track Curves
    // A) Past Track (Dotted)
    if (os.orbitHistory.length > 1) {
      mccCtx.strokeStyle = "rgba(0, 229, 255, 0.45)";
      mccCtx.lineWidth = 1.5;
      mccCtx.setLineDash([4, 4]);
      mccCtx.beginPath();
      for (let i = 0; i < os.orbitHistory.length; i++) {
        const pt = os.orbitHistory[i];
        const px = ((pt.lon + 180) / 360) * w;
        const py = ((90 - pt.lat) / 180) * h;
        if (i === 0 || Math.abs(pt.lon - os.orbitHistory[i - 1].lon) > 120) {
          mccCtx.moveTo(px, py);
        } else {
          mccCtx.lineTo(px, py);
        }
      }
      mccCtx.stroke();
      mccCtx.setLineDash([]);
    }

    // B) Future Track (Next Orbit or Launch Ascent Corridor)
    if (phase === "launch") {
      const kscX = ((-80.6 + 180) / 360) * w;
      const kscY = ((90 - 28.5) / 180) * h;
      const insX = ((-60.6 + 180) / 360) * w;
      const insY = ((90 - 35.0) / 180) * h;

      mccCtx.strokeStyle = "#00e5ff";
      mccCtx.lineWidth = 2.5;
      mccCtx.setLineDash([6, 6]);
      mccCtx.beginPath();
      mccCtx.moveTo(kscX, kscY);
      mccCtx.lineTo(insX, insY);
      mccCtx.stroke();
      mccCtx.setLineDash([]);

      // Cape Canaveral LC-39A Marker
      mccCtx.fillStyle = "#ff5252";
      mccCtx.beginPath();
      mccCtx.arc(kscX, kscY, 4, 0, Math.PI * 2);
      mccCtx.fill();
      mccCtx.fillStyle = "#ff8a80";
      mccCtx.font = "bold 9px 'Orbitron', monospace";
      mccCtx.fillText("LC-39A (KSC)", kscX, kscY + 12);
    } else {
      mccCtx.strokeStyle = "#00e5ff";
      mccCtx.lineWidth = 2;
      mccCtx.beginPath();
      const incRad = (os.inclination * Math.PI) / 180;
      let prevLon = null;
      for (let step = 0; step <= 80; step++) {
        const fTheta = os.orbitProgress + (step / 80) * (Math.PI * 2);
        const fLat = Math.asin(Math.sin(incRad) * Math.sin(fTheta)) * (180 / Math.PI);
        const fRelLon = Math.atan2(Math.cos(incRad) * Math.sin(fTheta), Math.cos(fTheta)) * (180 / Math.PI);
        const fNodal = os.nodalPrecession + (step / 80) * 22.5;
        let fLon = ((fRelLon - fNodal + 180) % 360 + 360) % 360 - 180;

        const fx = ((fLon + 180) / 360) * w;
        const fy = ((90 - fLat) / 180) * h;

        if (step === 0 || (prevLon !== null && Math.abs(fLon - prevLon) > 120)) {
          mccCtx.moveTo(fx, fy);
        } else {
          mccCtx.lineTo(fx, fy);
        }
        prevLon = fLon;
      }
      mccCtx.stroke();
    }

    // 5. Satellite / Rocket Sub-satellite Position (Crosshair + Blip)
    const satX = ((os.subSatLon + 180) / 360) * w;
    const satY = ((90 - os.subSatLat) / 180) * h;

    // Pulsing target ring
    const pulse = 10 + Math.sin(Date.now() * 0.006) * 3;
    mccCtx.strokeStyle = (phase === "launch" || os.currentStation) ? "#00e676" : "#ffd600";
    mccCtx.lineWidth = 1.5;
    mccCtx.beginPath();
    mccCtx.arc(satX, satY, pulse, 0, Math.PI * 2);
    mccCtx.stroke();

    // Vehicle Icon
    mccCtx.font = "14px 'Rajdhani', sans-serif";
    mccCtx.textAlign = "center";
    mccCtx.fillText(phase === "launch" ? "🚀" : "🛰️", satX, satY + 5);

    // Callout Tag
    mccCtx.fillStyle = "rgba(4, 10, 24, 0.85)";
    mccCtx.fillRect(satX + 12, satY - 18, 125, 18);
    mccCtx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    mccCtx.strokeRect(satX + 12, satY - 18, 125, 18);

    mccCtx.fillStyle = "#ffffff";
    mccCtx.font = "bold 9px 'Orbitron', monospace";
    mccCtx.textAlign = "left";
    const tagText = phase === "launch"
      ? `ASCENT: ${Math.round(launchState.altitude)} KM`
      : `ALT: ${Math.round(os.apoapsis)} KM`;
    mccCtx.fillText(tagText, satX + 16, satY - 6);

    // 6. Update HTML Console Badges
    const badgeEl = document.getElementById("mcc-pass-badge");
    const coordsEl = document.getElementById("mcc-subsat-coords");
    const nextEl = document.getElementById("mcc-next-station");
    const tempEl = document.getElementById("mcc-temp-val");
    const eclipseEl = document.getElementById("mcc-eclipse-val");
    const battEl = document.getElementById("mcc-battery-val");

    if (badgeEl) {
      if (phase === "launch") {
        badgeEl.className = "mcc-badge badge-aos";
        badgeEl.textContent = "AOS: WALLOPS RANGE [ASCENT TRACKING]";
      } else if (os.currentStation) {
        badgeEl.className = "mcc-badge badge-aos";
        badgeEl.textContent = `AOS: ${os.currentStation.code} [CARRIER LOCKED]`;
      } else {
        badgeEl.className = "mcc-badge badge-los";
        badgeEl.textContent = `LOS (LOSS OF SIGNAL)`;
      }
    }

    if (coordsEl) {
      const latDir = os.subSatLat >= 0 ? "N" : "S";
      const lonDir = os.subSatLon >= 0 ? "E" : "W";
      coordsEl.textContent = `LAT: ${Math.abs(os.subSatLat).toFixed(1)}° ${latDir} | LON: ${Math.abs(os.subSatLon).toFixed(1)}° ${lonDir}`;
    }

    if (nextEl) {
      if (phase === "launch") {
        nextEl.textContent = launchState.stage === 1
          ? "STAGE 1 BOOST PHASE (MAIN ENGINES)"
          : (launchState.stage === 2 ? "STAGE 2 VACUUM INSERTION" : "FINAL INSERTION BURN");
      } else if (os.currentStation) {
        nextEl.textContent = `DOWNLINK ACTIVE (+2.2 GB/s)`;
      } else {
        const mins = Math.floor(os.nextStationEta / 60);
        const secs = String(os.nextStationEta % 60).padStart(2, "0");
        nextEl.textContent = `NEXT AOS: ${os.nextStationName} (${mins}:${secs})`;
      }
    }

    if (tempEl) {
      if (phase === "launch") {
        tempEl.textContent = `${Math.round(launchState.heat)}°C (MAX-Q)`;
        tempEl.style.color = launchState.heat > 50 ? "#ff5252" : "#00e5ff";
      } else {
        const sign = os.temperature > 0 ? "+" : "";
        tempEl.textContent = `${sign}${Math.round(os.temperature)}°C`;
        tempEl.style.color = os.temperature < 0 ? "#80deea" : "#ffd600";
      }
    }

    if (eclipseEl) {
      if (phase === "launch") {
        eclipseEl.innerHTML = `<span style="color: #00e676;">🚀 KSC EASTERN RANGE AZIMUTH 51.6°</span>`;
      } else if (os.eclipsePhase === "umbra") {
        eclipseEl.innerHTML = `<span style="color: #e040fb;">🌑 UMBRA (-130°C • HEATERS ON)</span>`;
      } else if (os.eclipsePhase === "penumbra") {
        eclipseEl.innerHTML = `<span style="color: #ffab00;">🌓 PENUMBRA</span>`;
      } else {
        eclipseEl.innerHTML = `<span style="color: #00e676;">☀️ SUNLIGHT (+115°C)</span>`;
      }
    }

    if (battEl) {
      if (phase === "launch") {
        battEl.textContent = `FUEL: ${Math.round(launchState.fuel)}%`;
        battEl.style.color = launchState.fuel < 20 ? "#ff5252" : "#00e676";
      } else {
        battEl.textContent = `${Math.round(os.battery)}%`;
        battEl.style.color = os.battery < 25 ? "#ff1744" : "#ffffff";
      }
    }
  }

  // 3. DRAW GAME OVER (WITH INTERACTIVE REVIVE / RESTART CONTROLS)
  function drawGameOver(w, h) {
    ctx.fillStyle = "rgba(2, 6, 18, 0.94)";
    ctx.fillRect(0, 0, w, h);

    // Glowing alert border
    ctx.strokeStyle = "rgba(255, 23, 68, 0.65)";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.font = "bold 34px 'Orbitron', monospace";
    ctx.fillStyle = "#ff1744";
    ctx.textAlign = "center";
    ctx.fillText("⚠️ CRITICAL FAILURE: SIGNAL LOST", w / 2, h / 2 - 70);

    ctx.font = "16px 'Rajdhani', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Spacecraft suffered power starvation or fatal hull breach.", w / 2, h / 2 - 30);

    // Button 1: Revive in Safe View Mode
    ctx.fillStyle = "rgba(0, 230, 118, 0.25)";
    ctx.fillRect(w / 2 - 250, h / 2 + 5, 500, 48);
    ctx.strokeStyle = "#00e676";
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 250, h / 2 + 5, 500, 48);

    ctx.font = "bold 16px 'Orbitron', monospace";
    ctx.fillStyle = "#00e676";
    ctx.fillText("🛡️ CLICK OR PRESS [R] TO REVIVE IN SAFE VIEW", w / 2, h / 2 + 35);

    // Button 2: Restart flight
    ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
    ctx.fillRect(w / 2 - 250, h / 2 + 65, 500, 44);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w / 2 - 250, h / 2 + 65, 500, 44);

    ctx.font = "bold 15px 'Rajdhani', sans-serif";
    ctx.fillStyle = "#00e5ff";
    ctx.fillText("🔄 PRESS [SPACEBAR] TO RESTART FLIGHT ASCENT", w / 2, h / 2 + 93);
  }

  // =========================================================================
  // MULTIPLAYER REAL-TIME CO-OP SYNCHRONIZATION & ACTION HANDLERS
  // =========================================================================
  function getStateSnapshot() {
    return {
      phase: phase,
      launch: {
        altitude: launchState.altitude,
        velocity: launchState.velocity,
        stage: launchState.stage,
        fuel: launchState.fuel,
        heat: launchState.heat,
        countdown: launchState.countdown,
        isCountingDown: launchState.isCountingDown
      },
      orbit: {
        fuel: orbitState.fuel,
        battery: orbitState.battery,
        health: orbitState.health,
        apoapsis: orbitState.apoapsis,
        periapsis: orbitState.periapsis,
        deltaV: orbitState.deltaV,
        temperature: orbitState.temperature,
        eclipsePhase: orbitState.eclipsePhase,
        subSatLat: orbitState.subSatLat,
        subSatLon: orbitState.subSatLon,
        scienceScore: orbitState.scienceScore,
        anomaly: orbitState.anomaly.active ? orbitState.anomaly : null
      }
    };
  }

  function handleRemoteStateSync(remote) {
    if (!remote) return;
    if (window.MultiplayerClient && !window.MultiplayerClient.getRoom()?.isHost) {
      if (remote.phase && phase !== remote.phase) {
        phase = remote.phase;
      }
      if (remote.launch) {
        launchState.altitude = remote.launch.altitude;
        launchState.velocity = remote.launch.velocity;
        launchState.stage = remote.launch.stage;
        launchState.fuel = remote.launch.fuel;
        launchState.heat = remote.launch.heat;
        launchState.countdown = remote.launch.countdown;
        launchState.isCountingDown = remote.launch.isCountingDown;
      }
      if (remote.orbit) {
        orbitState.fuel = remote.orbit.fuel;
        orbitState.battery = remote.orbit.battery;
        orbitState.health = remote.orbit.health;
        orbitState.apoapsis = remote.orbit.apoapsis;
        orbitState.periapsis = remote.orbit.periapsis;
        orbitState.deltaV = remote.orbit.deltaV;
        orbitState.temperature = remote.orbit.temperature;
        orbitState.eclipsePhase = remote.orbit.eclipsePhase;
        orbitState.subSatLat = remote.orbit.subSatLat;
        orbitState.subSatLon = remote.orbit.subSatLon;
        orbitState.scienceScore = remote.orbit.scienceScore;
        if (remote.orbit.anomaly && !orbitState.anomaly.active) {
          orbitState.anomaly = { ...remote.orbit.anomaly };
          const banner = document.getElementById("flight-anomaly-banner");
          if (banner) banner.style.display = "flex";
        } else if (!remote.orbit.anomaly && orbitState.anomaly.active) {
          orbitState.anomaly.active = false;
          const banner = document.getElementById("flight-anomaly-banner");
          if (banner) banner.style.display = "none";
        }
      }
    }
  }

  function handleRemoteFlightEvent(evt) {
    if (!evt) return;
    const actor = evt.actor || "Crew Member";
    const role = evt.role || "crew";
    const ticker = document.getElementById("hud-action-ticker");
    if (ticker) {
      ticker.textContent = `● [${role.toUpperCase()}: ${actor}] ${evt.type.toUpperCase()}`;
      ticker.classList.add("flash");
      setTimeout(() => ticker.classList.remove("flash"), 1200);
    }

    const w = canvasHUD ? canvasHUD.width : 960;
    if (evt.type === "prograde") {
      orbitState.fuel = Math.max(0, orbitState.fuel - 0.2);
      orbitState.deltaV = Math.max(0, orbitState.deltaV - 1.8);
      orbitState.apoapsis += 0.5;
      orbitState.radiusA3D = Math.min(85, orbitState.radiusA3D + 0.02);
      if (window.Space3D && window.Space3D.updateOrbitGeometry) {
        window.Space3D.updateOrbitGeometry(orbitState.radiusA3D, orbitState.radiusP3D, orbitState.inclination);
      }
      if (using3D && spacecraft3D && window.Space3D && window.THREE) {
        const nozPos = spacecraft3D.position.clone().add(new window.THREE.Vector3(0, 0, -2.5));
        window.Space3D.addRocketExhaust(nozPos, new window.THREE.Vector3(0, 0, -1), 3);
      }
      sfx("playBeep", 440, 0.05);
      addFloatingText(`🔥 [PROP: ${actor}] PROGRADE BURN (+15 m/s)`, w / 2, 200, "#00e5ff", 20);
    } else if (evt.type === "retrograde") {
      orbitState.fuel = Math.max(0, orbitState.fuel - 0.2);
      orbitState.deltaV = Math.max(0, orbitState.deltaV - 1.8);
      orbitState.periapsis = Math.max(20, orbitState.periapsis - 0.5);
      orbitState.radiusP3D = Math.max(42, orbitState.radiusP3D - 0.02);
      if (window.Space3D && window.Space3D.updateOrbitGeometry) {
        window.Space3D.updateOrbitGeometry(orbitState.radiusA3D, orbitState.radiusP3D, orbitState.inclination);
      }
      if (using3D && spacecraft3D && window.Space3D && window.THREE) {
        const frontPos = spacecraft3D.position.clone().add(new window.THREE.Vector3(0, 0, 2.5));
        window.Space3D.addRocketExhaust(frontPos, new window.THREE.Vector3(0, 0, 1), 3);
      }
      sfx("playBeep", 330, 0.05);
      addFloatingText(`💨 [PROP: ${actor}] RETROGRADE BURN`, w / 2, 200, "#ff9100", 20);
    } else if (evt.type === "stage") {
      if (phase === "launch") {
        if (launchState.isCountingDown) {
          launchState.countdown = 0;
          launchState.isCountingDown = false;
        } else if (launchState.stage === 1) {
          launchState.stage = 2;
          launchState.fuel = 100;
          addFloatingText(`🚀 [FLIGHT: ${actor}] STAGE 1 SEPARATION`, w / 2, 200, "#00e676", 22);
        } else if (launchState.stage === 2) {
          launchState.stage = 3;
          addFloatingText(`✨ [FLIGHT: ${actor}] FAIRING JETTISONED`, w / 2, 200, "#00e5ff", 22);
        }
        sfx("playBeep", 750, 0.15);
      }
    } else if (evt.type === "scan") {
      orbitState.scienceScore += 100;
      sfx("playBeep", 1100, 0.2);
      addFloatingText(`🔬 [SCIENCE: ${actor}] TARGET SCANNED (+100 XP)`, w / 2, 220, "#00e676", 24);
    } else if (evt.type === "reboot") {
      resolveCurrentAnomaly();
      addFloatingText(`🛡️ [SYSTEMS: ${actor}] ANOMALY RESOLVED!`, w / 2, 180, "#00e676", 22);
    } else if (evt.type === "station") {
      if (evt.data && evt.data.id) {
        const st = GROUND_STATIONS.find(s => s.id === evt.data.id);
        if (st) {
          orbitState.currentStation = st;
          addFloatingText(`📡 [COMMS: ${actor}] DSN LOCKED: ${st.name}`, w / 2, 180, "#b388ff", 20);
          sfx("playBeep", 900, 0.1);
        }
      }
    }
  }

  function updateFlightHudCrew() {
    if (!window.MultiplayerClient) return;
    const players = window.MultiplayerClient.getPlayers();
    const local = window.MultiplayerClient.getLocalPlayer();
    const container = document.getElementById("hud-crew-chips");
    if (!container) return;

    container.innerHTML = "";
    const roleIcons = {
      flight_director: "🚀",
      systems_engineer: "⚡",
      science_officer: "🔬",
      comms_officer: "📡",
      crew_specialist: "👨‍🚀"
    };

    players.forEach(p => {
      const chip = document.createElement("span");
      chip.className = `hud-crew-chip ${local && p.id === local.id ? "you" : ""}`;
      const icon = roleIcons[p.role] || "👤";
      chip.textContent = `${icon} ${p.name} ${local && p.id === local.id ? "(YOU)" : ""}`;
      container.appendChild(chip);
    });
  }

  function toggleFlightCommsDrawer() {
    const drawer = document.getElementById("flight-comms-drawer");
    if (drawer) {
      const isVisible = drawer.style.display === "flex";
      drawer.style.display = isVisible ? "none" : "flex";
      if (!isVisible) {
        const input = document.getElementById("flight-drawer-input");
        if (input) input.focus();
      }
    }
  }

  function initMultiplayerHooks() {
    if (typeof window === "undefined" || !window.MultiplayerClient) return;

    window.MultiplayerClient.on("flightEvent", (evt) => {
      handleRemoteFlightEvent(evt);
    });

    window.MultiplayerClient.on("stateSync", (data) => {
      handleRemoteStateSync(data.state);
    });

    window.MultiplayerClient.on("roomUpdated", () => {
      if (isRunning) updateFlightHudCrew();
    });

    window.MultiplayerClient.on("playerLeft", (leftPlayer) => {
      if (isRunning && leftPlayer) {
        updateFlightHudCrew();
        const w = canvasHUD ? canvasHUD.width : 960;
        addFloatingText(`⚠️ [DISCONNECT] ${leftPlayer.name} VACATED CONSOLE`, w / 2, 160, "#ff1744", 24);
        if (window.SoundFX) {
          window.SoundFX.playLeave();
          window.SoundFX.speak(`Alert: ${leftPlayer.name} has disconnected`);
        }
        const ticker = document.getElementById("hud-action-ticker");
        if (ticker) {
          ticker.textContent = `● [DISCONNECT] ${leftPlayer.name} VACATED CONSOLE`;
          ticker.classList.add("flash");
        }
      }
    });

    window.MultiplayerClient.on("playerJoined", (newPlayer) => {
      if (isRunning && newPlayer) {
        updateFlightHudCrew();
        const w = canvasHUD ? canvasHUD.width : 960;
        addFloatingText(`🛰️ [CONNECTED] ${newPlayer.name} JOINED CREW`, w / 2, 160, "#00e676", 24);
        if (window.SoundFX) {
          window.SoundFX.playJoin();
          window.SoundFX.speak(`${newPlayer.name} connected to flight operations`);
        }
      }
    });
  }

  function setInput(key, state) {
    if (key in input) {
      input[key] = state;
      if (key === "action" && state) {
        input.actionJustPressed = true;
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          if (phase === "launch") {
            window.MultiplayerClient.sendFlightAction("stage");
          } else if (phase === "orbit") {
            window.MultiplayerClient.sendFlightAction("scan");
          }
        }
      }
      if (key === "up" && state) {
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          window.MultiplayerClient.sendFlightAction("prograde");
        }
      }
      if (key === "down" && state) {
        if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
          window.MultiplayerClient.sendFlightAction("retrograde");
        }
      }
    }
  }

  function getScoreData() {
    return {
      science: orbitState.scienceScore,
      data: orbitState.dataDownlinked,
      health: orbitState.health
    };
  }

  return {
    init: function() {
      setupInputListeners();
      initMultiplayerHooks();
    },
    start,
    stop,
    update,
    draw,
    setInput,
    getScoreData,
    getPhase: () => phase,
    getLaunchState: () => launchState,
    getOrbitState: () => orbitState,
    triggerAnomaly,
    resolveAnomaly: resolveCurrentAnomaly,
    setViewMode,
    setCameraPreset,
    toggleSafeMode,
    reviveFlight,
    initMultiplayerHooks,
    toggleFlightCommsDrawer
  };
})();

window.SpaceFlightGame.init();
