/**
 * Mission Control: Space Mission Design Game
 * Systems Engineering Calculation & Simulation Engine
 */

window.GameEngine = (function () {
  "use strict";

  let state = {
    phase: "setup",
    difficulty: "engineer",
    players: [],
    missionId: null,
    orbitId: null,
    components: {
      bus: null,
      power: null,
      thermal: null,
      computer: null,
      attitude: null,
      propulsion: null,
      antenna: null,
      band: null,
      groundStation: null
    },
    instruments: [],
    launchVehicleId: null,
    simulation: {
      running: false,
      day: 0,
      totalDays: 0,
      scienceCollected: 0,
      dataCollected: 0,
      eventsOccurred: [],
      instrumentStatus: {},
      powerDegradation: 0,
      healthPercent: 100,
      log: []
    }
  };

  // Helper to find an item in GameData arrays
  function findItem(array, id) {
    if (!array || !id) return null;
    return array.find(item => item.id === id) || null;
  }

  function getDifficultyObj() {
    return findItem(window.GameData.difficulties, state.difficulty) || window.GameData.difficulties[1];
  }

  function getMissionObj() {
    return findItem(window.GameData.missions, state.missionId);
  }

  function getOrbitObj() {
    return findItem(window.GameData.orbits, state.orbitId);
  }

  function getBusObj() {
    return findItem(window.GameData.busSizes, state.components.bus);
  }

  function getLaunchVehicleObj() {
    return findItem(window.GameData.launchVehicles, state.launchVehicleId);
  }

  // PUBLIC METHODS
  function init(difficultyId) {
    const validDiff = ["cadet", "engineer", "director"].includes(difficultyId) ? difficultyId : "engineer";
    state = {
      phase: "setup",
      difficulty: validDiff,
      players: [],
      missionId: null,
      orbitId: null,
      components: {
        bus: null,
        power: null,
        thermal: null,
        computer: null,
        attitude: null,
        propulsion: null,
        antenna: null,
        band: null,
        groundStation: null
      },
      instruments: [],
      launchVehicleId: null,
      simulation: {
        running: false,
        day: 0,
        totalDays: 0,
        scienceCollected: 0,
        dataCollected: 0,
        eventsOccurred: [],
        instrumentStatus: {},
        powerDegradation: 0,
        healthPercent: 100,
        log: []
      }
    };
    return getState();
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function setPhase(phase) {
    state.phase = phase;
  }

  function setPlayers(players) {
    state.players = Array.isArray(players) ? players : [];
  }

  function selectMission(missionId) {
    state.missionId = missionId;
    const mission = getMissionObj();
    if (mission) {
      state.simulation.totalDays = mission.duration;
    }
  }

  function setCustomMission(customMission, config) {
    state.missionId = customMission ? customMission.id : "custom-mission";
    state.customMission = customMission;
    if (config) {
      if (config.orbitId) state.orbitId = config.orbitId;
      if (config.launchVehicleId) state.launchVehicleId = config.launchVehicleId;
      if (config.components) Object.assign(state.components, config.components);
      if (config.instruments) state.instruments = config.instruments.slice();
    }
  }

  function selectOrbit(orbitId) {
    state.orbitId = orbitId;
  }

  function setComponent(category, componentId) {
    if (category in state.components) {
      state.components[category] = componentId;
    }
  }

  function toggleInstrument(instrumentId) {
    const index = state.instruments.indexOf(instrumentId);
    if (index >= 0) {
      state.instruments.splice(index, 1);
      return false; // removed
    } else {
      state.instruments.push(instrumentId);
      return true; // added
    }
  }

  function selectLaunchVehicle(vehicleId) {
    state.launchVehicleId = vehicleId;
  }

  /**
   * Calculate current resource consumption based on selected subsystems
   */
  function getResourceUsage() {
    let budget = 0;
    let mass = 0;
    let power = 0;
    let dataRate = 0;

    const data = window.GameData;

    // 1. Bus
    const bus = findItem(data.busSizes, state.components.bus);
    if (bus) {
      budget += bus.cost || 0;
      mass += bus.dryMass || 0;
    }

    // 2. Power Subsystem
    const pwr = findItem(data.powerSystems, state.components.power);
    if (pwr) {
      budget += pwr.cost || 0;
      mass += pwr.mass || 0;
    }

    // 3. Thermal
    const therm = findItem(data.thermalSystems, state.components.thermal);
    if (therm) {
      budget += therm.cost || 0;
      mass += therm.mass || 0;
    }

    // 4. Onboard Computer / Avionics
    const comp = findItem(data.computers, state.components.computer);
    if (comp) {
      budget += comp.cost || 0;
      mass += comp.mass || 0;
      power += comp.power || 0;
    }

    // 5. ADCS
    const adcs = findItem(data.attitudeControls, state.components.attitude);
    if (adcs) {
      budget += adcs.cost || 0;
      mass += adcs.mass || 0;
      power += adcs.power || 0;
    }

    // 6. Propulsion
    const prop = findItem(data.propulsionSystems, state.components.propulsion);
    if (prop) {
      budget += prop.cost || 0;
      mass += prop.mass || 0;
      power += prop.power || 0;
    }

    // 7. Telecommunications: Antenna, Frequency Band, Ground Station
    const ant = findItem(data.antennas, state.components.antenna);
    if (ant) {
      budget += ant.cost || 0;
      mass += ant.mass || 0;
    }
    const band = findItem(data.frequencyBands, state.components.band);
    if (band) {
      budget += band.cost || 0;
    }
    const gs = findItem(data.groundStations, state.components.groundStation);
    if (gs) {
      budget += gs.cost || 0;
    }

    // 8. Scientific Instruments
    state.instruments.forEach(instId => {
      const inst = findItem(data.instruments, instId);
      if (inst) {
        budget += inst.cost || 0;
        mass += inst.mass || 0;
        power += inst.power || 0;
        dataRate += inst.dataRate || 0;
      }
    });

    // 9. Launch Vehicle
    const lv = findItem(data.launchVehicles, state.launchVehicleId);
    if (lv) {
      budget += lv.cost || 0;
    }

    return {
      budget: Math.round(budget * 10) / 10,
      mass: Math.round(mass * 10) / 10,
      power: Math.round(power * 10) / 10,
      dataRate: Math.round(dataRate * 10) / 10
    };
  }

  /**
   * Calculate resource limits based on difficulty, launch vehicle, orbit, power, and comms architecture
   */
  function getResourceLimits() {
    const data = window.GameData;
    const diff = getDifficultyObj();
    const budgetLimit = diff ? diff.budget : 400;

    // Mass Limit determined by Launch Vehicle payload capacity to the target orbit
    let massLimit = 99999;
    const lv = findItem(data.launchVehicles, state.launchVehicleId);
    const orbit = findItem(data.orbits, state.orbitId);

    if (lv) {
      const orbitType = orbit ? orbit.type : "LEO";
      switch (orbitType) {
        case "LEO":
        case "SSO":
          massLimit = lv.payloadLEO;
          break;
        case "GEO":
          massLimit = lv.payloadGTO;
          break;
        case "MEO":
        case "HEO":
          massLimit = Math.round(lv.payloadLEO * 0.60);
          break;
        case "lunar":
          massLimit = Math.round(lv.payloadGTO * 0.70);
          break;
        case "L2":
          massLimit = Math.round(lv.payloadGTO * 0.60);
          break;
        default:
          massLimit = lv.payloadLEO;
      }
    }

    // Power Limit determined by Power System generation (adjusted by orbital solar irradiance if solar)
    let powerLimit = 0;
    const pwr = findItem(data.powerSystems, state.components.power);
    if (pwr) {
      powerLimit = pwr.power;
      // Solar arrays generate less at Mars / deep space, but RTG remains 100%
      if (pwr.type === "solar" && state.missionId === "red-pioneer") {
        powerLimit = Math.round(powerLimit * 0.44); // Solar irradiance at 1.52 AU is ~43% of Earth
      }
    }

    // Comms Effective Bandwidth Limit (considering antenna rate, band max throughput, and ground pass duration)
    let dataRateLimit = 0;
    const ant = findItem(data.antennas, state.components.antenna);
    const band = findItem(data.frequencyBands, state.components.band);
    const gs = findItem(data.groundStations, state.components.groundStation);

    if (ant && band && gs) {
      const rfBottleneck = Math.min(ant.dataRate, band.maxDataRate);
      // Effective 24-hour average throughput factoring in ground pass coverage
      const coverageFraction = gs.coverage / 24;
      dataRateLimit = Math.round(rfBottleneck * coverageFraction * 10) / 10;
    }

    return {
      budget: budgetLimit,
      mass: massLimit,
      power: powerLimit,
      dataRate: dataRateLimit
    };
  }

  /**
   * Percentages for resource gauge HUD
   */
  function getResourcePercentages() {
    const usage = getResourceUsage();
    const limits = getResourceLimits();

    const calcPct = (use, limit) => {
      if (!limit || limit <= 0) return use > 0 ? 150 : 0;
      return Math.min(150, Math.round((use / limit) * 100));
    };

    return {
      budget: calcPct(usage.budget, limits.budget),
      mass: calcPct(usage.mass, limits.mass),
      power: calcPct(usage.power, limits.power),
      dataRate: calcPct(usage.dataRate, limits.dataRate)
    };
  }

  /**
   * System engineering margin and consistency analysis
   */
  function getWarnings() {
    const warnings = [];
    const data = window.GameData;
    const usage = getResourceUsage();
    const limits = getResourceLimits();
    const mission = getMissionObj();
    const orbit = getOrbitObj();
    const bus = getBusObj();
    const lv = getLaunchVehicleObj();
    const adcs = findItem(data.attitudeControls, state.components.attitude);

    // 1. Critical Hard Limit Violations (Errors)
    if (usage.budget > limits.budget) {
      warnings.push({
        severity: "error",
        message: `Budget Overrun: Project cost ($${usage.budget}M) exceeds maximum mission allocation ($${limits.budget}M) by $${Math.round((usage.budget - limits.budget)*10)/10}M!`
      });
    }

    if (lv && usage.mass > limits.mass) {
      warnings.push({
        severity: "error",
        message: `Negative Mass Margin: Spacecraft wet mass (${usage.mass} kg) exceeds ${lv.name} lift capacity to ${orbit ? orbit.type : "orbit"} (${limits.mass} kg)! Rocket cannot reach target orbit.`
      });
    }

    if (state.components.power && limits.power > 0 && usage.power > limits.power) {
      warnings.push({
        severity: "error",
        message: `Power Deficit: Subsystems require ${usage.power} W, but power system only yields ${limits.power} W (-${usage.power - limits.power} W deficit). Spacecraft will brown out!`
      });
    }

    if (lv && orbit && !lv.maxOrbitTypes.includes(orbit.type)) {
      warnings.push({
        severity: "error",
        message: `Incompatible Launcher: ${lv.name} upper stage cannot reach ${orbit.name}. Select a higher-energy launch vehicle.`
      });
    }

    // 2. High Priority Systems Engineering Issues (Warnings)
    if (limits.dataRate > 0 && usage.dataRate > limits.dataRate) {
      warnings.push({
        severity: "warning",
        message: `Link Budget Deficit: Instruments generate ${usage.dataRate} Mbps, but ground link capacity is only ${limits.dataRate} Mbps. Onboard storage will overflow and drop science data!`
      });
    }

    // Mission requirement validation
    if (mission) {
      if (state.instruments.length < mission.requirements.minInstruments) {
        warnings.push({
          severity: "warning",
          message: `Science Payload Under-specified: ${mission.name} requires at least ${mission.requirements.minInstruments} instruments (currently ${state.instruments.length} selected).`
        });
      }

      const selectedCategories = state.instruments.map(id => {
        const inst = findItem(data.instruments, id);
        return inst ? inst.category : "";
      });

      mission.requirements.requiredCategories.forEach(cat => {
        if (!selectedCategories.includes(cat)) {
          warnings.push({
            severity: "warning",
            message: `Missing Mandatory Science Category: ${mission.name} specifically requires at least one '${cat.toUpperCase()}' sensor.`
          });
        }
      });

      if (orbit && mission.requirements.preferredOrbits && !mission.requirements.preferredOrbits.includes(orbit.id)) {
        warnings.push({
          severity: "info",
          message: `Sub-optimal Orbit: ${mission.name} achieves highest science return in ${mission.requirements.preferredOrbits.join(" or ").toUpperCase()} (selected: ${orbit.name}).`
        });
      }
    }

    // Bus Payload Mass Capacity
    if (bus) {
      let payloadMass = 0;
      state.instruments.forEach(id => {
        const inst = findItem(data.instruments, id);
        if (inst) payloadMass += inst.mass;
      });
      if (payloadMass > bus.maxPayloadMass) {
        warnings.push({
          severity: "warning",
          message: `Bus Payload Limit Exceeded: Selected instruments weigh ${payloadMass} kg, exceeding ${bus.name} structural limit of ${bus.maxPayloadMass} kg.`
        });
      }
    }

    // ADCS Pointing Jitter vs Precision Instruments
    if (adcs) {
      const needsPrecise = state.instruments.some(id => {
        const inst = findItem(data.instruments, id);
        return inst && inst.requiredPointing === "precise";
      });
      const needsModerate = state.instruments.some(id => {
        const inst = findItem(data.instruments, id);
        return inst && inst.requiredPointing === "moderate";
      });

      if (needsPrecise && adcs.pointingAccuracy > 5) {
        warnings.push({
          severity: "warning",
          message: `ADCS Pointing Jitter: Selected optical/telescopic payload demands ultra-fine arcsecond pointing, but ${adcs.name} provides only ${adcs.pointingAccuracy} arcsec stability. Image blurring will occur.`
        });
      } else if (needsModerate && adcs.type === "spin") {
        warnings.push({
          severity: "warning",
          message: `Spin Stabilization Incompatible: Directional instruments cannot maintain target lock on a spin-stabilized spacecraft.`
        });
      }
    }

    // Thermal vs Orbit
    if (state.orbitId === "l2" && state.components.thermal === "passive") {
      warnings.push({
        severity: "warning",
        message: `Thermal Sensitivity: L2 space observatory requires active or cryogenic cooling to prevent detector saturation.`
      });
    }

    // Mars solar check
    if (state.missionId === "red-pioneer" && state.components.power && state.components.power.includes("solar")) {
      warnings.push({
        severity: "info",
        message: `Solar Attenuation at Mars: Solar flux at 1.5 AU is ~44% of Earth orbit. Ensure sufficient array sizing or consider an RTG.`
      });
    }

    // 3. Selection Incompleteness
    if (!state.missionId) warnings.push({ severity: "info", message: "Select a primary Mission Objective to begin." });
    if (!state.orbitId) warnings.push({ severity: "info", message: "Select a target Mission Orbit." });
    if (!state.components.bus) warnings.push({ severity: "info", message: "Choose a Spacecraft Bus Platform." });
    if (!state.components.power) warnings.push({ severity: "info", message: "Select a Power Generation System." });
    if (!state.components.computer) warnings.push({ severity: "info", message: "Equip a Command & Flight Computer." });
    if (!state.components.attitude) warnings.push({ severity: "info", message: "Equip an Attitude Determination & Control System (ADCS)." });
    if (!state.components.antenna) warnings.push({ severity: "info", message: "Select a Telemetry Antenna." });
    if (!state.components.band) warnings.push({ severity: "info", message: "Select an RF Frequency Band." });
    if (!state.components.groundStation) warnings.push({ severity: "info", message: "Choose a Ground Station Network." });
    if (!state.launchVehicleId) warnings.push({ severity: "info", message: "Contract a Launch Vehicle to lift your spacecraft." });

    return warnings;
  }

  /**
   * Flight Readiness Review (FRR) Validation
   */
  function validate() {
    const warnings = getWarnings();
    const errors = warnings.filter(w => w.severity === "error");

    const requiredKeys = ["bus", "power", "computer", "attitude", "antenna", "band", "groundStation"];
    const allComponentsSelected = requiredKeys.every(k => state.components[k] !== null);
    const coreReady = !!(state.missionId && state.orbitId && state.launchVehicleId && allComponentsSelected && state.instruments.length > 0);

    const valid = errors.length === 0 && coreReady;

    return {
      valid: valid,
      issues: warnings,
      canLaunch: valid
    };
  }

  /**
   * Initialize and launch the real-time mission simulation
   */
  function startSimulation() {
    const mission = getMissionObj();
    const duration = mission ? mission.duration : 730;

    state.simulation = {
      running: true,
      day: 0,
      totalDays: duration,
      scienceCollected: 0,
      dataCollected: 0,
      eventsOccurred: [],
      instrumentStatus: {},
      powerDegradation: 0,
      healthPercent: 100,
      log: [
        {
          day: 0,
          type: "success",
          message: `🚀 LIFTOFF! Launch vehicle successfully ignited and executed stage separation. Spacecraft deployed to target orbit!`
        },
        {
          day: 1,
          type: "info",
          message: `🛰️ Solar array deployment and ADCS initial 3-axis sun acquisition confirmed nominal.`
        }
      ]
    };

    // Initialize all selected instruments to nominal active status
    state.instruments.forEach(instId => {
      state.simulation.instrumentStatus[instId] = "active";
    });

    state.phase = "simulation";
    return state.simulation;
  }

  /**
   * Advance simulation by one or multiple days
   */
  function advanceDay(stepDays = 1) {
    if (!state.simulation.running) return null;

    const data = window.GameData;
    const orbit = getOrbitObj();
    const mission = getMissionObj();
    const sim = state.simulation;
    const diff = getDifficultyObj();

    let triggeredEvent = null;

    for (let s = 0; s < stepDays; s++) {
      if (sim.day >= sim.totalDays || sim.healthPercent <= 0) {
        sim.running = false;
        break;
      }

      sim.day++;

      // Daily Science Return calculation
      const sciMult = orbit ? orbit.scienceMultiplier : 1.0;
      let activeSciencePoints = 0;
      let dailyDataMb = 0;

      state.instruments.forEach(instId => {
        const inst = findItem(data.instruments, instId);
        const status = sim.instrumentStatus[instId] || "active";
        if (inst && status === "active") {
          activeSciencePoints += inst.scienceValue;
          dailyDataMb += inst.dataRate;
        } else if (inst && status === "degraded") {
          activeSciencePoints += inst.scienceValue * 0.5;
          dailyDataMb += inst.dataRate * 0.5;
        }
      });

      // Factor in power degradation
      const powerEfficiency = Math.max(0.3, 1 - (sim.powerDegradation / 100));
      const dailyScience = (activeSciencePoints * sciMult * powerEfficiency) / 100;
      sim.scienceCollected += dailyScience;

      // Downlink data volume in GB
      const gs = findItem(data.groundStations, state.components.groundStation);
      const hours = gs ? gs.coverage : 6;
      const dailyGb = (dailyDataMb * (hours * 3600) / 8) / 1024;
      sim.dataCollected += dailyGb;

      // Natural space radiation degradation (slower in LEO/L2, faster in MEO/HEO)
      let degradationRate = 0.005;
      if (orbit && orbit.radiationLevel === "high") degradationRate = 0.02;
      sim.powerDegradation = Math.min(60, sim.powerDegradation + degradationRate);

      // Check for milestone logging
      if (sim.day === 30) {
        sim.log.unshift({ day: 30, type: "info", message: "📅 Day 30: Commissioning phase complete. Primary science phase officially commenced." });
      } else if (sim.day === Math.round(sim.totalDays / 2)) {
        sim.log.unshift({ day: sim.day, type: "info", message: `📅 Day ${sim.day}: Halfway through primary mission baseline. Science telemetry streaming steadily.` });
      }

      // Roll for random operational events if none is pending
      if (!triggeredEvent && Math.random() < (diff.eventFrequency * 0.04)) {
        // Find an event not already experienced
        const availableEvents = data.events.filter(ev => !sim.eventsOccurred.includes(ev.id));
        if (availableEvents.length > 0) {
          const picked = availableEvents[Math.floor(Math.random() * availableEvents.length)];
          triggeredEvent = picked;
          sim.eventsOccurred.push(picked.id);
          // Pause simulation while awaiting player resolution
          sim.running = false;
          break;
        }
      }
    }

    const isComplete = sim.day >= sim.totalDays || sim.healthPercent <= 0;
    if (isComplete) {
      sim.running = false;
      sim.log.unshift({
        day: sim.day,
        type: sim.healthPercent > 0 ? "success" : "danger",
        message: sim.healthPercent > 0 
          ? `🏁 MISSION COMPLETE! Spacecraft completed all ${sim.totalDays} days of primary operations.`
          : `💀 MISSION TERMINATED: Spacecraft critical failure resulted in loss of signal.`
      });
    }

    return {
      day: sim.day,
      totalDays: sim.totalDays,
      event: triggeredEvent,
      scienceCollected: Math.round(sim.scienceCollected * 10) / 10,
      dataCollected: Math.round(sim.dataCollected),
      healthPercent: Math.round(sim.healthPercent),
      powerEfficiency: Math.round(100 - sim.powerDegradation),
      status: sim.running ? "running" : (isComplete ? (sim.healthPercent > 0 ? "complete" : "failed") : "paused")
    };
  }

  /**
   * Handle player choice for an operational anomaly or event
   */
  function handleEventChoice(eventId, choiceIndex) {
    const data = window.GameData;
    const event = findItem(data.events, eventId);
    if (!event || !event.choices[choiceIndex]) return null;

    const choice = event.choices[choiceIndex];
    const effects = choice.effects;
    const sim = state.simulation;

    // Apply science alteration
    if (effects.scienceChange) {
      sim.scienceCollected = Math.max(0, sim.scienceCollected + effects.scienceChange);
    }

    // Apply power degradation change
    if (effects.powerChange) {
      sim.powerDegradation = Math.min(90, Math.max(0, sim.powerDegradation - effects.powerChange));
    }

    // Apply lifetime alteration
    if (effects.lifetimeChange) {
      sim.totalDays = Math.max(30, sim.totalDays + effects.lifetimeChange);
    }

    // Apply instrument status change
    if (effects.instrumentFailure) {
      if (effects.instrumentFailure === "random-degrade" || effects.instrumentFailure === "random-chance") {
        if (state.instruments.length > 0 && Math.random() < 0.5) {
          const randInst = state.instruments[Math.floor(Math.random() * state.instruments.length)];
          sim.instrumentStatus[randInst] = "degraded";
          const instObj = findItem(data.instruments, randInst);
          sim.log.unshift({
            day: sim.day,
            type: "warning",
            message: `⚠️ Instrument Alert: ${instObj ? instObj.name : "Sensor"} performance degraded by 50% due to environmental stress.`
          });
        }
      } else if (state.instruments.includes(effects.instrumentFailure)) {
        sim.instrumentStatus[effects.instrumentFailure] = "failed";
      }
    }

    // Log the event resolution
    sim.log.unshift({
      day: sim.day,
      type: effects.scienceChange >= 0 ? "info" : "warning",
      message: `⚡ [${event.title}] Decision: "${choice.text}" -> ${effects.description}`
    });

    // Resume simulation
    sim.running = true;

    return {
      description: effects.description
    };
  }

  function isSimulationComplete() {
    return state.simulation.day >= state.simulation.totalDays || state.simulation.healthPercent <= 0;
  }

  function getSimulationProgress() {
    if (state.simulation.totalDays === 0) return 0;
    return Math.min(100, Math.round((state.simulation.day / state.simulation.totalDays) * 100));
  }

  /**
   * Final NASA Systems Engineering Scoring Algorithm
   * Total 100 points:
   * - Science Return: 40 pts
   * - Systems Engineering & Margins: 25 pts
   * - Fiscal Efficiency: 20 pts
   * - Mission Longevity & Ops: 15 pts
   */
  function calculateScore() {
    const data = window.GameData;
    const sim = state.simulation;
    const mission = getMissionObj();
    const orbit = getOrbitObj();
    const lv = getLaunchVehicleObj();
    const adcs = findItem(data.attitudeControls, state.components.attitude);
    const usage = getResourceUsage();
    const limits = getResourceLimits();

    // 1. Science Return (0 - 40 pts)
    let scienceScore = 0;
    if (mission) {
      let instSum = 0;
      state.instruments.forEach(id => {
        const inst = findItem(data.instruments, id);
        if (inst) instSum += inst.scienceValue;
      });

      // Target science benchmark (~120 points nominal)
      const benchmark = 120 * (orbit ? orbit.scienceMultiplier : 1.0);
      const completionRatio = sim.totalDays > 0 ? (sim.day / sim.totalDays) : 1;
      const scienceRatio = Math.min(1.3, (sim.scienceCollected / (benchmark * completionRatio || 1)));

      // Requirement satisfaction bonus
      let reqBonus = 1.0;
      const selectedCats = state.instruments.map(id => {
        const inst = findItem(data.instruments, id);
        return inst ? inst.category : "";
      });
      const meetsAllCats = mission.requirements.requiredCategories.every(cat => selectedCats.includes(cat));
      if (meetsAllCats) reqBonus += 0.15;
      if (state.instruments.length >= mission.requirements.minInstruments) reqBonus += 0.10;

      scienceScore = Math.min(40, Math.round(scienceRatio * 32 * reqBonus * 10) / 10);
    }

    // 2. Systems Engineering & Design Margins (0 - 25 pts)
    // 5 criteria, 5 points each:
    // a) Mass Margin
    let massPts = 0;
    if (limits.mass > 0 && usage.mass <= limits.mass) {
      const margin = (limits.mass - usage.mass) / limits.mass;
      // Ideal aerospace margin is 10-30%
      if (margin >= 0.10 && margin <= 0.40) massPts = 5;
      else if (margin > 0.40) massPts = 3.5; // Over-engineered rocket
      else massPts = 3.0; // Tight margin (<10%)
    }

    // b) Power Margin
    let powerPts = 0;
    if (limits.power > 0 && usage.power <= limits.power) {
      const margin = (limits.power - usage.power) / limits.power;
      if (margin >= 0.15 && margin <= 0.50) powerPts = 5;
      else if (margin > 0.50) powerPts = 4;
      else powerPts = 2.5;
    }

    // c) Pointing Stability
    let pointingPts = 5;
    if (adcs) {
      const needsPrecise = state.instruments.some(id => {
        const inst = findItem(data.instruments, id);
        return inst && inst.requiredPointing === "precise";
      });
      if (needsPrecise && adcs.pointingAccuracy > 5) pointingPts = 1.5;
      else if (adcs.type === "spin") pointingPts = 2.5;
    }

    // d) Downlink Link Budget Sufficiency
    let commsPts = 0;
    if (limits.dataRate > 0) {
      if (usage.dataRate <= limits.dataRate) commsPts = 5;
      else commsPts = Math.max(1, Math.round((limits.dataRate / usage.dataRate) * 5 * 10) / 10);
    }

    // e) Launch Vehicle Reliability
    const relPts = lv ? Math.round(lv.reliability * 5 * 10) / 10 : 3;

    const engineeringScore = Math.min(25, Math.round((massPts + powerPts + pointingPts + commsPts + relPts) * 10) / 10);

    // 3. Fiscal Efficiency & Budget Management (0 - 20 pts)
    let budgetScore = 0;
    if (usage.budget <= limits.budget) {
      const remainingRatio = (limits.budget - usage.budget) / limits.budget;
      // High score for finishing under budget without extreme penny-pinching
      budgetScore = Math.min(20, Math.round((14 + remainingRatio * 6) * 10) / 10);
    } else {
      budgetScore = Math.max(0, Math.round((20 - ((usage.budget - limits.budget) / limits.budget) * 40) * 10) / 10);
    }

    // 4. Mission Longevity & Operational Execution (0 - 15 pts)
    let lifetimeScore = 0;
    if (sim.totalDays > 0) {
      const dayRatio = sim.day / sim.totalDays;
      const healthFactor = sim.healthPercent / 100;
      lifetimeScore = Math.min(15, Math.round(dayRatio * 15 * healthFactor * 10) / 10);
    }

    const total = Math.min(100, Math.round((scienceScore + engineeringScore + budgetScore + lifetimeScore) * 10) / 10);

    // Grade Determination
    let grade = "F";
    if (total >= 94) grade = "A+";
    else if (total >= 86) grade = "A";
    else if (total >= 78) grade = "B+";
    else if (total >= 70) grade = "B";
    else if (total >= 62) grade = "C+";
    else if (total >= 54) grade = "C";
    else if (total >= 45) grade = "D";

    // Achievements
    const achievements = [];
    if (usage.budget <= limits.budget * 0.65) {
      achievements.push({ icon: "💰", name: "Frugal Pioneer", description: "Completed mission design using under 65% of allocated funding." });
    }
    if (scienceScore >= 36) {
      achievements.push({ icon: "🏆", name: "Discovery of the Decade", description: "Achieved top-tier scientific telemetry yield." });
    }
    if (Object.values(sim.instrumentStatus).every(s => s === "active")) {
      achievements.push({ icon: "🛡️", name: "Flawless Hardware", description: "All scientific instruments survived operational life without failure." });
    }
    if (total >= 92) {
      achievements.push({ icon: "🌟", name: "NASA Exceptional Achievement", description: "Attained total composite score above 92 points." });
    }
    if (["lunar", "heo", "l2"].includes(state.orbitId)) {
      achievements.push({ icon: "🌌", name: "Deep Space Navigator", description: "Successfully placed payload into deep space or halo orbit." });
    }
    if (state.components.bus === "cubesat" && total >= 70) {
      achievements.push({ icon: "📦", name: "Mighty Micro", description: "Delivered serious scientific results on a lightweight CubeSat frame." });
    }

    return {
      total,
      science: scienceScore,
      engineering: engineeringScore,
      budget: budgetScore,
      lifetime: lifetimeScore,
      grade,
      achievements
    };
  }

  /**
   * Generate Comprehensive Post-Flight Systems Engineering Report
   */
  function generateReport() {
    const data = window.GameData;
    const mission = getMissionObj();
    const orbit = getOrbitObj();
    const bus = getBusObj();
    const lv = getLaunchVehicleObj();
    const sim = state.simulation;
    const score = calculateScore();

    const decisions = [
      { category: "Orbit Architecture", choice: orbit ? orbit.name : "None", impact: orbit ? `Multiplier ${orbit.scienceMultiplier}x, Delta-V ${orbit.deltaV} km/s` : "N/A" },
      { category: "Spacecraft Bus", choice: bus ? bus.name : "None", impact: bus ? `Dry mass ${bus.dryMass} kg, Capacity ${bus.maxPayloadMass} kg` : "N/A" },
      { category: "Payload", choice: `${state.instruments.length} Scientific Instruments`, impact: `Mass ${state.instruments.reduce((acc, id) => { const i = findItem(data.instruments, id); return acc + (i ? i.mass : 0); }, 0)} kg` },
      { category: "Launch Vehicle", choice: lv ? lv.name : "None", impact: lv ? `Reliability ${(lv.reliability*100).toFixed(0)}%, Cost $${lv.cost}M` : "N/A" }
    ];

    const recommendations = [];
    if (score.engineering < 20) {
      recommendations.push("Increase subsystem margins: allocate 15-25% mass and power contingencies in early Phase A concept development.");
    }
    if (score.science < 30) {
      recommendations.push("Align instrument suite closer to core mission objectives and select orbits with higher observation multipliers.");
    }
    if (score.budget < 14) {
      recommendations.push("Opt for rideshare launcher opportunities or standardized CubeSat/ESPA bus architectures to conserve fiscal reserves.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Exemplary systems engineering discipline! Design adheres to gold-standard NASA Systems Engineering Handbook guidelines.");
    }

    const realAnalogue = mission && data.realMissions[mission.id] ? data.realMissions[mission.id] : {
      name: "NASA Earth & Planetary Exploration Fleet",
      description: "Comparable to standard NASA Discovery and New Frontiers class missions."
    };

    return {
      missionName: mission ? mission.name : "Custom Space Mission",
      summary: `The mission concluded with an overall performance rating of ${score.grade} (${score.total}/100 pts), collecting ${Math.round(sim.scienceCollected)} scientific research points and transmitting ${Math.round(sim.dataCollected)} GB of telemetry across ${sim.day} days in orbit.`,
      decisions,
      timeline: sim.log.slice(0, 8),
      recommendations,
      similarMissions: [realAnalogue]
    };
  }

  /**
   * User-Friendly Auto-Configuration: Instant 1-Click NASA Optimal Setup
   */
  function autoConfigure(missionId) {
    const data = window.GameData;
    const mission = findItem(data.missions, missionId) || data.missions[0];
    if (!mission) return validate();

    state.missionId = mission.id;
    state.simulation.totalDays = mission.duration;

    if (mission.id === "sentinel-e") {
      state.orbitId = "sso";
      state.instruments = ["hires-cam", "sar"];
      state.components.bus = "medium-sat";
      state.components.power = "medium-solar";
      state.components.thermal = "active";
      state.components.computer = "standard-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "dsn";
      state.launchVehicleId = "workhorse";
    } else if (mission.id === "stormwatch") {
      state.orbitId = "geo";
      state.instruments = ["wide-cam", "ir-spec"];
      state.components.bus = "medium-sat";
      state.components.power = "medium-solar";
      state.components.thermal = "active";
      state.components.computer = "standard-comp";
      state.components.attitude = "3axis";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "network";
      state.launchVehicleId = "titan";
    } else if (mission.id === "artemis-scout") {
      state.orbitId = "lunar";
      state.instruments = ["radar-alt", "mass-spec", "magnetometer"];
      state.components.bus = "medium-sat";
      state.components.power = "medium-solar";
      state.components.thermal = "active";
      state.components.computer = "advanced-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "dsn";
      state.launchVehicleId = "workhorse";
    } else if (mission.id === "red-pioneer") {
      state.orbitId = "heo";
      state.instruments = ["hires-cam", "uv-spec", "magnetometer"];
      state.components.bus = "medium-sat";
      state.components.power = "large-solar";
      state.components.thermal = "active";
      state.components.computer = "standard-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "dsn";
      state.launchVehicleId = "workhorse";
    } else if (mission.id === "asteroid-guard") {
      state.orbitId = "heo";
      state.instruments = ["hires-cam", "sar"];
      state.components.bus = "medium-sat";
      state.components.power = "medium-solar";
      state.components.thermal = "active";
      state.components.computer = "standard-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "dsn";
      state.launchVehicleId = "workhorse";
    } else if (mission.id === "deepview") {
      state.orbitId = "l2";
      state.instruments = ["hires-cam", "ir-spec", "magnetometer"];
      state.components.bus = "medium-sat";
      state.components.power = "small-solar";
      state.components.thermal = "passive";
      state.components.computer = "basic-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "cold-gas";
      state.components.antenna = "omni";
      state.components.band = "s-band";
      state.components.groundStation = "network";
      state.launchVehicleId = "titan";
    } else {
      const preferred = (mission.requirements && mission.requirements.preferredOrbits) ? mission.requirements.preferredOrbits[0] : "leo";
      state.orbitId = preferred;
      state.instruments = ["hires-cam", "sar"];
      state.components.bus = "medium-sat";
      state.components.power = "medium-solar";
      state.components.thermal = "active";
      state.components.computer = "standard-comp";
      state.components.attitude = "precision";
      state.components.propulsion = "chemical";
      state.components.antenna = "hga";
      state.components.band = "ka-band";
      state.components.groundStation = "dsn";
      state.launchVehicleId = "titan";
    }
    return validate();
  }

  return {
    init,
    getState,
    setPhase,
    setPlayers,
    selectMission,
    setCustomMission,
    selectOrbit,
    setComponent,
    toggleInstrument,
    selectLaunchVehicle,
    autoConfigure,
    getResourceUsage,
    getResourceLimits,
    getResourcePercentages,
    getWarnings,
    validate,
    startSimulation,
    advanceDay,
    handleEventChoice,
    isSimulationComplete,
    getSimulationProgress,
    calculateScore,
    generateReport
  };
})();

console.log("[MissionControl] GameEngine loaded");
