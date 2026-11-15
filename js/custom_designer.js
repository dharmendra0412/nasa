/**
 * NASA Custom Spacecraft & Satellite Design Studio
 * Module: js/custom_designer.js
 * Enables users to engineer, customize, 3D inspect, and launch their own satellite or spacecraft!
 */

window.CustomDesigner = (function () {
  "use strict";

  // Active Custom Spacecraft Engineering State
  const craftState = {
    name: "Aryabhata-X",
    callsign: "ASTRA-1",
    agency: "NASA",
    orbitId: "leo",
    busId: "medium-sat",
    powerId: "medium-solar",
    propulsionId: "chemical",
    antennaId: "parabolic",
    bandId: "x-band",
    thermalId: "active",
    attitudeId: "3axis",
    computerId: "standard-comp",
    groundStationId: "network",
    launchVehicleId: "workhorse",
    instruments: ["hires-cam", "ir-spec"]
  };

  // Ready-to-Fly NASA Aerospace Presets
  const presets = {
    "earth-scout": {
      name: "TerraScope Earth Scout",
      callsign: "TS-EARTH",
      agency: "NASA / Earth Science",
      orbitId: "sso",
      busId: "small-sat",
      powerId: "medium-solar",
      propulsionId: "chemical",
      antennaId: "parabolic",
      bandId: "x-band",
      thermalId: "active",
      launchVehicleId: "pathfinder",
      instruments: ["hires-cam", "spec-vis"]
    },
    "lunar-hunter": {
      name: "Selene Lunar Prospector",
      callsign: "SELENE-1",
      agency: "NASA / Artemis ISRU",
      orbitId: "lunar",
      busId: "medium-sat",
      powerId: "medium-solar",
      propulsionId: "chemical",
      antennaId: "parabolic",
      bandId: "ka-band",
      thermalId: "active",
      launchVehicleId: "workhorse",
      instruments: ["subsurface-radar", "particle-det"]
    },
    "mars-cruiser": {
      name: "Red Odyssey Mars Lander",
      callsign: "ODYSSEY-M",
      agency: "NASA / JPL",
      orbitId: "heo",
      busId: "large-sat",
      powerId: "rtg",
      propulsionId: "chemical",
      antennaId: "parabolic",
      bandId: "ka-band",
      thermalId: "active",
      launchVehicleId: "titan",
      instruments: ["drill-raman", "hires-cam", "subsurface-radar"]
    },
    "deep-space-ion": {
      name: "Aegis Deep Space Interceptor",
      callsign: "AEGIS-DS",
      agency: "NASA / Planetary Defense",
      orbitId: "lagrange",
      busId: "medium-sat",
      powerId: "rtg",
      propulsionId: "ion",
      antennaId: "phased-array",
      bandId: "ka-band",
      thermalId: "cryo",
      launchVehicleId: "titan",
      instruments: ["sar-radar", "magnetometer"]
    },
    "cubesat-constellation": {
      name: "NanoSwarm-1 Earth Array",
      callsign: "SWARM-1",
      agency: "Commercial Aerospace",
      orbitId: "leo",
      busId: "cubesat",
      powerId: "small-solar",
      propulsionId: "cold-gas",
      antennaId: "patch",
      bandId: "s-band",
      thermalId: "passive",
      launchVehicleId: "scout",
      instruments: ["wide-cam"]
    }
  };

  // Cache DOM references
  let domInitialized = false;
  let cadInitialized = false;

  function init() {
    wireHeaderButtons();
  }

  function wireHeaderButtons() {
    // 1. Center Pill Navigation Button in Portal Header
    const pillBtn = document.getElementById("tab-custom-designer");
    if (pillBtn && !pillBtn.dataset.bound) {
      pillBtn.dataset.bound = "1";
      pillBtn.addEventListener("click", () => open());
    }

    // 2. Action Button in Portal Header Right Controls
    const actionBtn = document.getElementById("btn-header-custom-studio");
    if (actionBtn && !actionBtn.dataset.bound) {
      actionBtn.dataset.bound = "1";
      actionBtn.addEventListener("click", () => open());
    }

    // 3. Hero CTA Button
    const heroBtn = document.getElementById("btn-hero-custom-studio");
    if (heroBtn && !heroBtn.dataset.bound) {
      heroBtn.dataset.bound = "1";
      heroBtn.addEventListener("click", () => open());
    }

    // 4. Design Studio Header Button
    const designSwitchBtn = document.getElementById("btn-design-to-custom-studio");
    if (designSwitchBtn && !designSwitchBtn.dataset.bound) {
      designSwitchBtn.dataset.bound = "1";
      designSwitchBtn.addEventListener("click", () => open());
    }

    // 5. Studio Header Launch Button (Top-Right "LAUNCH FLIGHT")
    const headLaunchBtn = document.getElementById("btn-custom-designer-launch");
    if (headLaunchBtn && !headLaunchBtn.dataset.bound) {
      headLaunchBtn.dataset.bound = "1";
      headLaunchBtn.addEventListener("click", () => launchCustomFlight());
    }

    // 6. Studio Header Back Button (Top-Left "← NASA HUB")
    const backBtn = document.getElementById("btn-custom-designer-back");
    if (backBtn && !backBtn.dataset.bound) {
      backBtn.dataset.bound = "1";
      backBtn.addEventListener("click", () => close());
    }
  }

  function open() {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const scr = document.getElementById("screen-custom-designer");
    if (scr) scr.classList.add("active");

    render();
    domInitialized = true;

    // Initialize 3D CAD Canvas for Custom Craft
    initCustomCAD();
    updateTelemetry();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function close() {
    const show = (window.GameUI && window.GameUI.showScreen) || (window.UI && window.UI.showScreen);
    if (typeof show === "function") {
      show("screen-title");
    } else {
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      const scr = document.getElementById("screen-title");
      if (scr) scr.classList.add("active");
    }
  }

  function initCustomCAD() {
    const canvas = document.getElementById("custom-cad-canvas");
    if (canvas && window.Space3D && window.Space3D.initDesignCADViewer) {
      window.Space3D.initDesignCADViewer(canvas, getCraftConfig());
      cadInitialized = true;
      update3DCad();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          update3DCad();
        });
      });
    }
  }

  function update3DCad() {
    if (!window.Space3D || !window.Space3D.updateDesignCAD) return;
    try {
      const config = getCraftConfig();
      window.Space3D.updateDesignCAD(config);
    } catch (e) {
      console.warn("[CustomDesigner] update3DCad error:", e);
    }
  }

  function getCraftConfig() {
    return {
      components: {
        bus: craftState.busId,
        power: craftState.powerId,
        propulsion: craftState.propulsionId,
        thermal: craftState.thermalId,
        attitude: craftState.attitudeId,
        computer: craftState.computerId,
        antenna: craftState.antennaId,
        band: craftState.bandId,
        groundStation: craftState.groundStationId
      },
      instruments: craftState.instruments.slice(),
      orbit: { id: craftState.orbitId },
      lv: { id: craftState.launchVehicleId },
      isCustomCraft: true,
      customName: craftState.name
    };
  }

  function render() {
    const container = document.getElementById("custom-designer-container");
    if (!container) return;

    const data = window.GameData;
    if (!data) return;

    container.innerHTML = `
      <div class="custom-studio-workspace">
        <!-- LEFT: Interactive Systems Architecture Panels -->
        <div class="custom-config-column">

          <!-- 1. Identity & Profile -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>🛰️</span> 1. SPACECRAFT IDENTITY & REGISTRY</div>
              <span class="custom-card-tag">FLIGHT DIRECTIVE</span>
            </div>
            <div class="custom-identity-grid">
              <div class="custom-field-group">
                <label class="custom-field-label">Spacecraft Name</label>
                <input type="text" id="custom-input-name" class="custom-input" value="${craftState.name}" maxlength="30" />
              </div>
              <div class="custom-field-group">
                <label class="custom-field-label">Callsign / Code</label>
                <input type="text" id="custom-input-callsign" class="custom-input" value="${craftState.callsign}" maxlength="12" />
              </div>
              <div class="custom-field-group">
                <label class="custom-field-label">Agency / Operator</label>
                <input type="text" id="custom-input-agency" class="custom-input" value="${craftState.agency}" maxlength="24" />
              </div>
            </div>
          </div>

          <!-- 2. Target Orbit Regime -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>🌌</span> 2. TARGET ORBIT & DESTINATION</div>
              <span class="custom-card-tag">ASTRODYNAMICS</span>
            </div>
            <div class="custom-options-grid" id="grid-orbit">
              ${(data.orbits || []).map(o => `
                <div class="custom-opt-card ${craftState.orbitId === o.id ? "active" : ""}" data-category="orbit" data-id="${o.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${o.icon || "🛰️"} ${o.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${o.description ? o.description.substring(0, 95) + "..." : ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">ALT: ${o.altitudeKm || "N/A"} km</span>
                    <span class="meta-cost">ΔV: +${o.deltaV || 0} km/s</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 3. Satellite Bus Architecture -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>📦</span> 3. SATELLITE BUS & STRUCTURE</div>
              <span class="custom-card-tag">PRIMARY CHASSIS</span>
            </div>
            <div class="custom-options-grid" id="grid-bus">
              ${(data.busSizes || []).map(b => `
                <div class="custom-opt-card ${craftState.busId === b.id ? "active" : ""}" data-category="bus" data-id="${b.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${b.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${b.description || ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">MASS: ${b.dryMass} kg</span>
                    <span class="meta-cost">$${b.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 4. Power Subsystem -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>⚡</span> 4. POWER GENERATION & STORAGE</div>
              <span class="custom-card-tag">ELECTRICAL POWER (EPS)</span>
            </div>
            <div class="custom-options-grid" id="grid-power">
              ${(data.powerSystems || []).map(p => `
                <div class="custom-opt-card ${craftState.powerId === p.id ? "active" : ""}" data-category="power" data-id="${p.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${p.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${p.description || ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-power">+${p.power} W</span>
                    <span class="meta-mass">${p.mass} kg</span>
                    <span class="meta-cost">$${p.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 5. Propulsion Subsystem -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>🚀</span> 5. PROPULSION & DELTA-V</div>
              <span class="custom-card-tag">ORBIT MANEUVER</span>
            </div>
            <div class="custom-options-grid" id="grid-propulsion">
              ${(data.propulsionSystems || []).map(pr => `
                <div class="custom-opt-card ${craftState.propulsionId === pr.id ? "active" : ""}" data-category="propulsion" data-id="${pr.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${pr.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${pr.description || ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">MASS: ${pr.mass || 0} kg</span>
                    <span class="meta-power">ΔV: +${pr.deltaV || 0} m/s</span>
                    <span class="meta-cost">$${pr.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 6. Communications & Antenna -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>📡</span> 6. TELECOMMUNICATIONS & ANTENNA</div>
              <span class="custom-card-tag">RF / LASER DOWNLINK</span>
            </div>
            <div class="custom-options-grid" id="grid-antenna">
              ${(data.antennas || []).map(a => `
                <div class="custom-opt-card ${craftState.antennaId === a.id ? "active" : ""}" data-category="antenna" data-id="${a.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${a.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${a.description || ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">${a.mass} kg</span>
                    <span class="meta-cost">$${a.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 7. Scientific Payloads (Multi-Select) -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>🔬</span> 7. SCIENTIFIC PAYLOAD & INSTRUMENTS</div>
              <span class="custom-card-tag">SELECT UP TO 4</span>
            </div>
            <div class="custom-options-grid" id="grid-instruments">
              ${(data.instruments || []).map(inst => `
                <div class="custom-opt-card ${craftState.instruments.includes(inst.id) ? "active" : ""}" data-category="instrument" data-id="${inst.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${inst.icon || "🔍"} ${inst.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">${inst.description ? inst.description.substring(0, 95) + "..." : ""}</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">${inst.mass} kg</span>
                    <span class="meta-power">${inst.power} W</span>
                    <span class="meta-cost">$${inst.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- 8. Launch Vehicle -->
          <div class="custom-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>🚀</span> 8. LAUNCH VEHICLE SELECTION</div>
              <span class="custom-card-tag">BOOSTER SIZING</span>
            </div>
            <div class="custom-options-grid" id="grid-launch-vehicle">
              ${(data.launchVehicles || []).map(lv => `
                <div class="custom-opt-card ${craftState.launchVehicleId === lv.id ? "active" : ""}" data-category="launchVehicle" data-id="${lv.id}">
                  <div class="custom-opt-header">
                    <span class="custom-opt-title">${lv.name}</span>
                    <span class="custom-opt-check">✔</span>
                  </div>
                  <div class="custom-opt-desc">Reliability: ${Math.round((lv.reliability || 0.95) * 100)}% • LEO Cap: ${lv.payloadLEO} kg</div>
                  <div class="custom-opt-meta">
                    <span class="meta-mass">LEO CAP: ${lv.payloadLEO} kg</span>
                    <span class="meta-cost">$${lv.cost}M</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

        </div>

        <!-- RIGHT: Interactive 3D CAD Blueprint & Systems Engineering Telemetry -->
        <div class="custom-preview-column">
          
          <!-- 3D CAD Viewport -->
          <div class="custom-cad-card">
            <div class="custom-cad-header-bar">
              <span class="custom-cad-title"><span>📐</span> 3D CAD BLUEPRINT</span>
              <div class="custom-cad-controls">
                <button type="button" class="btn-cad-tool" id="btn-custom-wireframe">HOLO BLUEPRINT</button>
                <button type="button" class="btn-cad-tool" id="btn-custom-reset-view">RESET VIEW</button>
              </div>
            </div>
            <div class="custom-cad-canvas-box">
              <canvas id="custom-cad-canvas" width="400" height="240"></canvas>
              <div class="cad-drag-hint">DRAG TO ROTATE 360° • SCROLL TO ZOOM</div>
            </div>
          </div>

          <!-- Real-Time NASA Systems Engineering Telemetry -->
          <div class="custom-telemetry-card">
            <div class="custom-card-header">
              <div class="custom-card-title"><span>📊</span> SYSTEMS ENGINEERING TELEMETRY</div>
              <span class="custom-card-tag" id="custom-trl-tag">TRL 8</span>
            </div>

            <div class="telemetry-dials-grid">
              <div class="dial-box">
                <span class="dial-label">TOTAL WET MASS</span>
                <span class="dial-value" id="custom-mass-val">0 kg</span>
                <span class="dial-sub" id="custom-mass-sub">Dry: 0 kg | Fuel: 0 kg</span>
              </div>
              <div class="dial-box">
                <span class="dial-label">POWER BALANCE</span>
                <span class="dial-value" id="custom-power-val">+0 W</span>
                <span class="dial-sub" id="custom-power-sub">Gen: 0W | Load: 0W</span>
              </div>
              <div class="dial-box">
                <span class="dial-label">TOTAL DELTA-V</span>
                <span class="dial-value" id="custom-deltav-val">0 m/s</span>
                <span class="dial-sub">Tsiolkovsky Budget</span>
              </div>
              <div class="dial-box">
                <span class="dial-label">FISCAL ENVELOPE</span>
                <span class="dial-value" id="custom-cost-val">$0M</span>
                <span class="dial-sub" id="custom-cost-sub">Craft + Booster</span>
              </div>
            </div>

            <!-- Launch Readiness Badge -->
            <div class="status-badge-go" id="custom-status-badge">
              ✔ ALL SUBSYSTEMS NOMINAL • GO FOR LAUNCH
            </div>

            <!-- Big Launch Action Button -->
            <button type="button" class="btn-launch-large" id="btn-custom-launch-mission">
              <span>🚀</span> LAUNCH CUSTOM CRAFT (PAD 39A)
            </button>
          </div>

        </div>
      </div>
    `;

    bindEvents();
    updateTelemetry();
  }

  function bindEvents() {
    // 1. Text Inputs
    const nameInput = document.getElementById("custom-input-name");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        craftState.name = e.target.value || "Custom Spacecraft";
      });
    }

    const callsignInput = document.getElementById("custom-input-callsign");
    if (callsignInput) {
      callsignInput.addEventListener("input", (e) => {
        craftState.callsign = e.target.value.toUpperCase() || "ASTRA-1";
      });
    }

    const agencyInput = document.getElementById("custom-input-agency");
    if (agencyInput) {
      agencyInput.addEventListener("input", (e) => {
        craftState.agency = e.target.value || "NASA";
      });
    }

    // 2. Selection Option Cards
    document.querySelectorAll(".custom-opt-card").forEach(card => {
      card.addEventListener("click", () => {
        const cat = card.dataset.category;
        const id = card.dataset.id;
        if (!cat || !id) return;

        if (cat === "instrument") {
          toggleInstrument(id);
        } else if (cat === "orbit") {
          craftState.orbitId = id;
          updateOptionUI("orbit", id);
        } else if (cat === "bus") {
          craftState.busId = id;
          updateOptionUI("bus", id);
        } else if (cat === "power") {
          craftState.powerId = id;
          updateOptionUI("power", id);
        } else if (cat === "propulsion") {
          craftState.propulsionId = id;
          updateOptionUI("propulsion", id);
        } else if (cat === "antenna") {
          craftState.antennaId = id;
          updateOptionUI("antenna", id);
        } else if (cat === "launchVehicle") {
          craftState.launchVehicleId = id;
          updateOptionUI("launchVehicle", id);
        }

        update3DCad();
        updateTelemetry();
        if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
      });
    });

    // 4. CAD Viewer Controls
    const wireBtn = document.getElementById("btn-custom-wireframe");
    if (wireBtn) {
      wireBtn.addEventListener("click", () => {
        if (window.Space3D && window.Space3D.toggleCADWireframe) {
          const isWire = window.Space3D.toggleCADWireframe();
          wireBtn.classList.toggle("active", isWire);
        }
      });
    }

    const resetViewBtn = document.getElementById("btn-custom-reset-view");
    if (resetViewBtn) {
      resetViewBtn.addEventListener("click", () => {
        initCustomCAD();
      });
    }

    // 5. Big Launch Button
    const launchBtn = document.getElementById("btn-custom-launch-mission");
    if (launchBtn && !launchBtn.dataset.bound) {
      launchBtn.dataset.bound = "1";
      launchBtn.addEventListener("click", () => {
        launchCustomFlight();
      });
    }

    // Header Back & Launch Buttons
    const backBtn = document.getElementById("btn-custom-designer-back");
    if (backBtn && !backBtn.dataset.bound) {
      backBtn.dataset.bound = "1";
      backBtn.addEventListener("click", () => close());
    }

    const headLaunchBtn = document.getElementById("btn-custom-designer-launch");
    if (headLaunchBtn && !headLaunchBtn.dataset.bound) {
      headLaunchBtn.dataset.bound = "1";
      headLaunchBtn.addEventListener("click", () => launchCustomFlight());
    }
  }

  function updateOptionUI(category, selectedId) {
    document.querySelectorAll(`.custom-opt-card[data-category="${category}"]`).forEach(c => {
      c.classList.toggle("active", c.dataset.id === selectedId);
    });
  }

  function toggleInstrument(id) {
    const idx = craftState.instruments.indexOf(id);
    if (idx >= 0) {
      if (craftState.instruments.length > 1) {
        craftState.instruments.splice(idx, 1);
      }
    } else {
      if (craftState.instruments.length < 4) {
        craftState.instruments.push(id);
      } else {
        craftState.instruments.shift();
        craftState.instruments.push(id);
      }
    }

    document.querySelectorAll(`.custom-opt-card[data-category="instrument"]`).forEach(c => {
      c.classList.toggle("active", craftState.instruments.includes(c.dataset.id));
    });
  }

  function applyPreset(preset) {
    Object.assign(craftState, preset);

    const nameInput = document.getElementById("custom-input-name");
    if (nameInput) nameInput.value = craftState.name;

    const callsignInput = document.getElementById("custom-input-callsign");
    if (callsignInput) callsignInput.value = craftState.callsign;

    const agencyInput = document.getElementById("custom-input-agency");
    if (agencyInput) agencyInput.value = craftState.agency;

    updateOptionUI("orbit", craftState.orbitId);
    updateOptionUI("bus", craftState.busId);
    updateOptionUI("power", craftState.powerId);
    updateOptionUI("propulsion", craftState.propulsionId);
    updateOptionUI("antenna", craftState.antennaId);
    updateOptionUI("launchVehicle", craftState.launchVehicleId);

    document.querySelectorAll(`.custom-opt-card[data-category="instrument"]`).forEach(c => {
      c.classList.toggle("active", craftState.instruments.includes(c.dataset.id));
    });

    update3DCad();
    updateTelemetry();
    if (window.SoundFX) window.SoundFX.playBeep(1100, 0.1);
  }

  function updateTelemetry() {
    const data = window.GameData;
    if (!data) return;

    const bus = (data.busSizes || []).find(b => b.id === craftState.busId) || {};
    const power = (data.powerSystems || []).find(p => p.id === craftState.powerId) || {};
    const prop = (data.propulsionSystems || []).find(pr => pr.id === craftState.propulsionId) || {};
    const antenna = (data.antennas || []).find(a => a.id === craftState.antennaId) || {};
    const lv = (data.launchVehicles || []).find(l => l.id === craftState.launchVehicleId) || {};
    const orbit = (data.orbits || []).find(o => o.id === craftState.orbitId) || {};

    const instList = craftState.instruments.map(id => (data.instruments || []).find(i => i.id === id) || {});

    // Accurate component mass breakdown
    const busMass = bus.dryMass || 240;
    const powerMass = power.mass || 28;
    const propMass = prop.mass || 0;
    const antennaMass = antenna.mass || 10;
    const instMass = instList.reduce((s, i) => s + (i.mass || 0), 0);
    const dryMass = busMass + powerMass + propMass + antennaMass + instMass;
    const wetMass = dryMass;

    // Power budget
    const powerGen = power.power || 300;
    const powerLoad = (prop.power || 0) + instList.reduce((s, i) => s + (i.power || 0), 0) + 75; // 75W housekeeping avionics
    const powerBalance = powerGen - powerLoad;

    // Delta-V from chosen propulsion system (scaled realistically with dry mass)
    const baseDeltaV = prop.deltaV || 0;
    const deltaV = baseDeltaV > 0 ? Math.round(baseDeltaV * Math.min(1.4, Math.max(0.4, 340 / Math.max(50, dryMass)))) : 0;

    // Cost budget
    const totalCost = (bus.cost || 5) + (power.cost || 3) + (prop.cost || 2) + (antenna.cost || 2) + (lv.cost || 15) + instList.reduce((s, i) => s + (i.cost || 0), 0);

    // Update DOM
    const massEl = document.getElementById("custom-mass-val");
    if (massEl) massEl.textContent = `${Math.round(wetMass)} kg`;

    const massSub = document.getElementById("custom-mass-sub");
    if (massSub) massSub.textContent = `Bus: ${busMass} kg | Payload: ${instMass} kg`;

    const powerEl = document.getElementById("custom-power-val");
    if (powerEl) {
      powerEl.textContent = `${powerBalance >= 0 ? "+" : ""}${Math.round(powerBalance)} W`;
      powerEl.style.color = powerBalance >= 0 ? "#00e676" : "#ff1744";
    }

    const powerSub = document.getElementById("custom-power-sub");
    if (powerSub) powerSub.textContent = `Gen: ${powerGen}W | Load: ${powerLoad}W`;

    const dvEl = document.getElementById("custom-deltav-val");
    if (dvEl) dvEl.textContent = `${deltaV} m/s`;

    const costEl = document.getElementById("custom-cost-val");
    if (costEl) costEl.textContent = `$${totalCost.toFixed(1)}M`;

    // Booster capacity margin
    const payloadCap = lv.payloadLEO || 4000;
    const margin = payloadCap - wetMass;
    const lvName = (lv && lv.name ? lv.name : "Rocket").toUpperCase();
    const statusBadge = document.getElementById("custom-status-badge");
    if (statusBadge) {
      if (margin >= 0 && powerBalance >= 0) {
        statusBadge.className = "status-badge-go";
        statusBadge.textContent = `✔ GO FOR LAUNCH: ${lvName} (MARGIN +${Math.round(margin)} kg)`;
      } else if (margin < 0) {
        statusBadge.className = "status-badge-warn";
        statusBadge.textContent = `⚠️ NO-GO: CRAFT MASS EXCEEDS ${lvName} LIMIT BY ${Math.abs(Math.round(margin))} kg`;
      } else {
        statusBadge.className = "status-badge-warn";
        statusBadge.textContent = `⚠️ WARNING: POWER DEFICIT (${powerBalance} W) — EXPAND POWER SYSTEM`;
      }
    }
  }

  function launchCustomFlight() {
    const data = window.GameData;
    if (!data) return;

    // Build custom mission object
    const customMission = {
      id: "custom-mission",
      name: craftState.name || "Custom Spacecraft",
      callsign: craftState.callsign || "ASTRA-1",
      agency: craftState.agency || "NASA",
      icon: "🛰️",
      difficulty: 2,
      destination: craftState.orbitId === "mars" ? "Mars Orbit" : craftState.orbitId === "lunar" ? "Lunar Orbit" : "Low Earth Orbit",
      type: "Custom Engineered Spacecraft",
      categoryTag: `${(craftState.agency || "NASA").toUpperCase()} • CUSTOM CLASS`,
      duration: 1095
    };

    // Inject into GameEngine
    if (window.GameEngine) {
      if (typeof window.GameEngine.setCustomMission === "function") {
        window.GameEngine.setCustomMission(customMission, {
          orbitId: craftState.orbitId,
          launchVehicleId: craftState.launchVehicleId,
          components: {
            bus: craftState.busId,
            power: craftState.powerId,
            propulsion: craftState.propulsionId,
            thermal: craftState.thermalId,
            attitude: craftState.attitudeId,
            computer: craftState.computerId,
            antenna: craftState.antennaId,
            band: craftState.bandId,
            groundStation: craftState.groundStationId
          },
          instruments: craftState.instruments.slice()
        });
      } else {
        const state = window.GameEngine.getState();
        state.missionId = "custom-mission";
        state.customMission = customMission;
        state.orbitId = craftState.orbitId;
        state.launchVehicleId = craftState.launchVehicleId;
      }
      if (typeof window.GameEngine.startSimulation === "function") {
        window.GameEngine.startSimulation();
      }
    }

    if (window.SoundFX && typeof window.SoundFX.playBeep === "function") {
      window.SoundFX.playBeep(900, 0.08);
    }

    // Switch to Arcade Flight Simulation Screen
    const show = (window.GameUI && window.GameUI.showScreen) || (window.UI && window.UI.showScreen);
    if (typeof show === "function") {
      show("screen-arcade");
    } else {
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      const scr = document.getElementById("screen-arcade");
      if (scr) scr.classList.add("active");
    }

    // Update arcade mission title banner
    const titleEl = document.getElementById("arcade-mission-title");
    if (titleEl) {
      titleEl.textContent = `🎮 ${customMission.name.toUpperCase()} - FLIGHT OPERATIONS`;
    }

    // Start 3D Spaceflight
    if (window.SpaceFlightGame && typeof window.SpaceFlightGame.start === "function") {
      const canvas3D = document.getElementById("game-canvas-3d");
      window.SpaceFlightGame.start(canvas3D, () => {
        const exitShow = (window.GameUI && window.GameUI.showScreen) || (window.UI && window.UI.showScreen);
        if (typeof exitShow === "function") {
          exitShow("screen-title");
        }
      });
    }
  }

  // Auto-wire on DOM content load
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  return {
    init,
    open,
    close,
    render,
    applyPreset,
    launchCustomFlight,
    getCraftConfig,
    updateTelemetry,
    update3DCad,
    getCraftState: () => craftState
  };
})();
