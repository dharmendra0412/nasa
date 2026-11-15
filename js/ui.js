/**
 * Mission Control: Space Mission Design Game
 * Interactive UI Controller, Canvas Visualizer & Application Logic
 */

window.GameUI = (function () {
  "use strict";

  // UI State
  let currentScreen = "screen-title";
  let previousScreen = "screen-title";
  let selectedPlayerCount = 1;
  let selectedDifficulty = "engineer";
  let simInterval = null;
  let simSpeed = 1; // 1 = 1x, 5 = 5x, 20 = 20x
  let currentEventId = null;
  let currentTab = "orbit";

  // Canvas visualizer animation
  let canvas = null;
  let ctx = null;
  let animId = null;
  let orbitAngle = 0;

  // DOM Elements cache
  const el = {};

  function initDOMElements() {
    el.headerBadge = document.getElementById("header-mission-badge");
    el.badgeMissionName = document.getElementById("badge-mission-name");
    el.badgeMissionOrbit = document.getElementById("badge-mission-orbit");
    el.btnSoundToggle = document.getElementById("btn-sound-toggle");
    el.btnHeaderHelp = document.getElementById("btn-header-help");

    // Title Screen
    el.playerCountBtns = document.querySelectorAll(".player-count-btn");
    el.difficultyBtns = document.querySelectorAll(".difficulty-btn");
    el.btnNewGame = document.getElementById("btn-new-game");
    el.btnTutorial = document.getElementById("btn-tutorial");

    // Team Setup
    el.teamContainer = document.getElementById("team-setup-container");
    el.btnStartTeam = document.getElementById("btn-start-team");
    el.btnBackTeam = document.getElementById("btn-back-team");

    // Mission Select
    el.missionCards = document.getElementById("mission-cards");
    el.missionDetail = document.getElementById("mission-detail");
    el.btnAcceptMission = document.getElementById("btn-accept-mission");
    el.btnBackMission = document.getElementById("btn-back-mission");

    // Design Studio
    el.resBudgetText = document.getElementById("res-budget-text");
    el.resBudgetFill = document.getElementById("res-budget-fill");
    el.resMassText = document.getElementById("res-mass-text");
    el.resMassFill = document.getElementById("res-mass-fill");
    el.resPowerText = document.getElementById("res-power-text");
    el.resPowerFill = document.getElementById("res-power-fill");
    el.resDataText = document.getElementById("res-data-text");
    el.resDataFill = document.getElementById("res-data-fill");
    el.warningsCount = document.getElementById("warnings-count");
    el.warningsPanel = document.getElementById("warnings-panel");
    el.tabBtns = document.querySelectorAll(".tab-btn");
    el.designPanels = document.querySelectorAll(".design-panel");
    el.btnReview = document.getElementById("btn-review");
    el.btnBackDesign = document.getElementById("btn-back-design");

    // Review
    el.reviewSummary = document.getElementById("review-summary");
    el.validationResults = document.getElementById("validation-results");
    el.launchStatus = document.getElementById("launch-readiness-status");
    el.btnPlayInteractive = document.getElementById("btn-play-interactive");
    el.btnLaunchMission = document.getElementById("btn-launch-mission");
    el.btnBackReview = document.getElementById("btn-back-review");

    // Arcade Flight Mode
    el.btnCompleteFlight = document.getElementById("btn-complete-flight");
    el.gameCanvas = document.getElementById("game-canvas-3d") || document.getElementById("game-canvas");

    // Simulation
    el.simDay = document.getElementById("sim-day-display");
    el.simScience = document.getElementById("sim-science-display");
    el.simData = document.getElementById("sim-data-display");
    el.simPower = document.getElementById("sim-power-display");
    el.simHealth = document.getElementById("sim-health-display");
    el.simStatus = document.getElementById("sim-status");
    el.simProgressFill = document.querySelector("#sim-progress-bar .progress-fill");
    el.simLog = document.getElementById("sim-log");
    el.btnSimPlay = document.getElementById("btn-sim-play");
    el.btnSimFast = document.getElementById("btn-sim-fast");
    el.btnSimStep = document.getElementById("btn-sim-step");
    el.btnSimAbort = document.getElementById("btn-sim-abort");
    canvas = document.getElementById("sim-canvas");
    if (canvas) ctx = canvas.getContext("2d");

    // Results
    el.resultGrade = document.getElementById("result-grade");
    el.resultScore = document.getElementById("result-score-number");
    el.resultScience = document.getElementById("result-science");
    el.resultEngineering = document.getElementById("result-engineering");
    el.resultBudget = document.getElementById("result-budget");
    el.resultLifetime = document.getElementById("result-lifetime");
    el.scoreBarScience = document.getElementById("score-bar-science");
    el.scoreBarEngineering = document.getElementById("score-bar-engineering");
    el.scoreBarBudget = document.getElementById("score-bar-budget");
    el.scoreBarLifetime = document.getElementById("score-bar-lifetime");
    el.resultAchievements = document.getElementById("result-achievements");
    el.resultReport = document.getElementById("result-report");
    el.btnRetry = document.getElementById("btn-retry");
    el.btnNewMission = document.getElementById("btn-new-mission");
    el.btnExportReport = document.getElementById("btn-export-report");

    // Tutorial
    el.btnBackTutorial = document.getElementById("btn-back-tutorial");

    // Modal
    el.modalOverlay = document.getElementById("modal-overlay");
    el.modalTitle = document.getElementById("modal-title");
    el.modalBody = document.getElementById("modal-body");
    el.modalChoices = document.getElementById("modal-choices");
  }

  // NAVIGATION & SCREEN SWITCHING
  function showScreen(screenId) {
    if (currentScreen !== screenId) {
      previousScreen = currentScreen;
    }
    currentScreen = screenId;

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
    }

    if (screenId === "screen-design") {
      renderDesignStudio();
    }

    updateHeaderBadge();
    if (window.SoundFX) window.SoundFX.playBeep(700, 0.05);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateHeaderBadge() {
    const state = window.GameEngine.getState();
    const mission = window.GameData.missions.find(m => m.id === state.missionId);
    const orbit = window.GameData.orbits.find(o => o.id === state.orbitId);

    if (mission && el.headerBadge) {
      el.headerBadge.classList.remove("hidden");
      if (el.badgeMissionName) el.badgeMissionName.textContent = mission.name;
      if (el.badgeMissionOrbit) el.badgeMissionOrbit.textContent = orbit ? orbit.name : "Orbit Unselected";
    } else if (el.headerBadge) {
      el.headerBadge.classList.add("hidden");
    }
  }

  // SCREEN 1: TITLE & CONFIG
  function setupTitleScreen() {
    // 1. Initialize Interactive 3D Earth Globe & Orbiting Satellite
    const initGlobe = () => {
      const globeCanvas = document.getElementById("title-earth-canvas");
      if (globeCanvas && window.Space3D && typeof window.Space3D.initTitleGlobe === "function") {
        window.Space3D.initTitleGlobe(globeCanvas);
      }
    };
    initGlobe();
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("load", initGlobe);
      setTimeout(initGlobe, 200);
    }

    // 2. Real-time Live NASA Mission Control UTC Clock
    const updateUTCClock = () => {
      const clockEl = document.getElementById("live-utc-clock");
      if (clockEl) {
        const now = new Date();
        const pad = n => String(n).padStart(2, "0");
        clockEl.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;
      }
    };
    updateUTCClock();
    setInterval(updateUTCClock, 1000);

    el.playerCountBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        el.playerCountBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPlayerCount = parseInt(btn.dataset.count, 10);
        if (window.SoundFX) window.SoundFX.playBeep(800, 0.04);
      });
    });

    el.difficultyBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        el.difficultyBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedDifficulty = btn.dataset.difficulty;
        if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
      });
    });

    el.btnNewGame.addEventListener("click", () => {
      if (window.SoundFX && typeof window.SoundFX.playQuindarTone === "function") {
        window.SoundFX.playQuindarTone();
      }
      window.GameEngine.init(selectedDifficulty);
      if (selectedPlayerCount > 1) {
        renderTeamRoster();
        showScreen("screen-team");
      } else {
        window.GameEngine.setPlayers([{ name: "Lead Systems Engineer", roleId: "director" }]);
        renderMissionSelection();
        showScreen("screen-mission");
      }
    });

    el.btnTutorial.addEventListener("click", () => {
      showScreen("screen-tutorial");
    });

    // --- USER-FRIENDLY FEATURE: 1-CLICK INSTANT 3D FLIGHT SIMULATOR ---
    let selectedQuickMissionId = "sentinel-e";
    const quickChips = document.querySelectorAll(".quick-chip");
    quickChips.forEach(chip => {
      chip.addEventListener("click", () => {
        quickChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedQuickMissionId = chip.dataset.missionId;
        if (window.SoundFX) window.SoundFX.playBeep(920, 0.04);
      });
    });

    const launchInstantFlight = () => {
      if (window.SoundFX && typeof window.SoundFX.playLaunch === "function") {
        window.SoundFX.playLaunch();
      }
      window.GameEngine.init(selectedDifficulty || "cadet");
      window.GameEngine.setPlayers([{ name: "Lead Flight Controller", roleId: "director" }]);
      window.GameEngine.autoConfigure(selectedQuickMissionId);
      window.GameEngine.startSimulation();
      showScreen("screen-arcade");

      const titleEl = document.getElementById("arcade-mission-title");
      const state = window.GameEngine.getState();
      const m = window.GameData.missions.find(x => x.id === state.missionId);
      if (titleEl && m) titleEl.textContent = `🎮 ${m.name.toUpperCase()} - FLIGHT OPERATIONS`;

      if (window.SpaceFlightGame && el.gameCanvas) {
        window.SpaceFlightGame.start(el.gameCanvas, () => {
          renderResultsScreen();
          showScreen("screen-results");
        });
      }
    };

    const btnQuickLaunch = document.getElementById("btn-quick-launch");
    if (btnQuickLaunch) {
      btnQuickLaunch.addEventListener("click", launchInstantFlight);
    }

    // [ENTER] Key on title screen triggers Instant Launch immediately
    window.addEventListener("keydown", (e) => {
      if (currentScreen === "screen-title" && e.key === "Enter") {
        launchInstantFlight();
      }
    });

    // In-Game How to Play & Controls Modal
    const modalHowToPlay = document.getElementById("modal-how-to-play");
    const btnHowToPlay = document.getElementById("btn-how-to-play");
    const btnCloseHowToPlay = document.getElementById("btn-close-how-to-play");
    const btnStartFromGuide = document.getElementById("btn-start-from-guide");

    const openGuide = () => {
      if (modalHowToPlay) modalHowToPlay.classList.remove("hidden");
      if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
    };
    const closeGuide = () => {
      if (modalHowToPlay) modalHowToPlay.classList.add("hidden");
    };

    if (btnHowToPlay) btnHowToPlay.addEventListener("click", openGuide);
    if (btnCloseHowToPlay) btnCloseHowToPlay.addEventListener("click", closeGuide);
    if (btnStartFromGuide) {
      btnStartFromGuide.addEventListener("click", () => {
        closeGuide();
        launchInstantFlight();
      });
    }

    // --- NASA APP CHALLENGE PORTAL & FLIGHT OPERATIONS CONTROLS ---
    function updateProgressTracker() {
      let solvedList = [];
      let totalPts = 0;
      try {
        solvedList = JSON.parse(localStorage.getItem("nasa_solved_challenges") || "[]");
        totalPts = parseInt(localStorage.getItem("nasa_total_points") || "0", 10);
      } catch (e) {
        solvedList = [];
      }

      const count = solvedList.length;
      const percent = Math.min(100, Math.round((count / 6) * 100));

      const percentEl = document.getElementById("progress-percent-val");
      const solvedEl = document.getElementById("stat-solved-count");
      const pointsEl = document.getElementById("stat-points-count");
      const circleFill = document.getElementById("progress-circle-fill");
      const profileSolved = document.getElementById("profile-solved-count");
      const profilePoints = document.getElementById("profile-points-count");

      if (percentEl) percentEl.textContent = `${percent}%`;
      if (solvedEl) solvedEl.textContent = count;
      if (pointsEl) pointsEl.textContent = totalPts;
      if (profileSolved) profileSolved.textContent = `${count} / 6`;
      if (profilePoints) profilePoints.textContent = `${totalPts} PTS`;

      if (circleFill) {
        // Circumference: 2 * PI * 62 ~= 390
        const offset = 390 - (390 * percent) / 100;
        circleFill.style.strokeDashoffset = offset;
      }
    }

    function recordChallengeCompletion(missionId) {
      try {
        let solvedList = JSON.parse(localStorage.getItem("nasa_solved_challenges") || "[]");
        if (!solvedList.includes(missionId)) {
          solvedList.push(missionId);
          localStorage.setItem("nasa_solved_challenges", JSON.stringify(solvedList));
        }
        let totalPts = parseInt(localStorage.getItem("nasa_total_points") || "0", 10) + 1250;
        localStorage.setItem("nasa_total_points", totalPts.toString());
        updateProgressTracker();
      } catch (e) {}
    }

    updateProgressTracker();

    // Mission Operations Briefing Modal Handler
    const modalChallengeBrief = document.getElementById("modal-challenge-brief");
    const btnCloseBrief = document.getElementById("btn-close-challenge-brief");
    const btnBriefLaunchFlight = document.getElementById("btn-brief-launch-flight");
    const btnBriefEnterStudio = document.getElementById("btn-brief-enter-studio");

    const openChallengeBrief = (mid) => {
      selectedQuickMissionId = mid || "sentinel-e";
      const mission = (window.GameData && window.GameData.missions) ? 
        window.GameData.missions.find(m => m.id === selectedQuickMissionId) || window.GameData.missions[0] : null;

      if (!mission) {
        launchInstantFlight();
        return;
      }

      const iconEl = document.getElementById("brief-mission-icon");
      const nameEl = document.getElementById("brief-mission-name");
      const categoryEl = document.getElementById("brief-mission-category");
      const destEl = document.getElementById("brief-destination");
      const diffEl = document.getElementById("brief-difficulty");
      const starsEl = document.getElementById("brief-stars");
      const durEl = document.getElementById("brief-duration");
      const craftEl = document.getElementById("brief-spacecraft-img");
      const artEl = document.getElementById("brief-artwork-img");
      const objectivesList = document.getElementById("brief-objectives-list");
      const milestonesGrid = document.getElementById("brief-milestones-grid");

      if (iconEl) iconEl.textContent = mission.icon || "🚀";
      if (nameEl) nameEl.textContent = mission.name || "NASA Mission Challenge";
      if (categoryEl) categoryEl.textContent = mission.categoryTag || `${(mission.type || "NASA Spaceflight").toUpperCase()} · CLASS-B`;
      if (destEl) destEl.textContent = mission.destination || "Planetary Orbit";
      if (diffEl) {
        const d = mission.difficulty || 1;
        diffEl.textContent = `${d} / 5`;
      }
      if (starsEl) {
        const d = mission.difficulty || 1;
        starsEl.textContent = "⭐".repeat(Math.min(5, Math.max(1, d)));
      }
      if (durEl) durEl.textContent = `~${mission.duration || 365} Days`;
      if (craftEl) {
        craftEl.src = mission.craftImg || "assets/brief/sentinel-e_craft_trans.png";
        craftEl.alt = `${mission.name} Spacecraft`;
      }
      if (artEl) {
        artEl.src = mission.artImg || "assets/brief/sentinel-e_art.jpg";
        artEl.alt = `${mission.name} Artwork`;
      }

      if (objectivesList) {
        objectivesList.innerHTML = "";
        const bullets = mission.objectiveBullets || (mission.objectives ? mission.objectives.map(o => ({ verb: o.name.split(" ")[0], text: o.description })) : []);
        bullets.forEach(b => {
          const row = document.createElement("div");
          row.className = "brief-bullet-row";
          row.innerHTML = `
            <span class="brief-bullet-check">✔</span>
            <div class="brief-bullet-text">
              <strong class="bullet-verb">${b.verb}</strong> — <span class="bullet-desc">${b.text}</span>
            </div>
          `;
          objectivesList.appendChild(row);
        });
      }

      if (milestonesGrid) {
        milestonesGrid.innerHTML = "";
        const milestones = mission.milestoneCards || [];
        milestones.forEach(m => {
          const card = document.createElement("div");
          card.className = `brief-milestone-card theme-${m.theme || "blue"}`;
          card.innerHTML = `
            <div class="milestone-card-top">
              <span class="milestone-icon-wrap">${m.icon}</span>
              <span class="milestone-title">${m.title}</span>
            </div>
            <div class="milestone-tags-row">
              ${(m.tags || []).map(t => `<span class="milestone-tag-pill">${t}</span>`).join("")}
            </div>
          `;
          milestonesGrid.appendChild(card);
        });
      }

      if (modalChallengeBrief) {
        modalChallengeBrief.classList.remove("hidden");
      }
      if (window.SoundFX && typeof window.SoundFX.playBeep === "function") {
        window.SoundFX.playBeep(880, 0.05);
      }
    };

    const closeChallengeBrief = () => {
      if (modalChallengeBrief) modalChallengeBrief.classList.add("hidden");
    };

    if (btnCloseBrief) btnCloseBrief.addEventListener("click", closeChallengeBrief);
    if (modalChallengeBrief) {
      modalChallengeBrief.addEventListener("click", (e) => {
        if (e.target === modalChallengeBrief) closeChallengeBrief();
      });
    }

    if (btnBriefLaunchFlight) {
      btnBriefLaunchFlight.addEventListener("click", () => {
        closeChallengeBrief();
        launchInstantFlight();
      });
    }

    if (btnBriefEnterStudio) {
      btnBriefEnterStudio.addEventListener("click", () => {
        closeChallengeBrief();
        window.GameEngine.init(selectedDifficulty || "engineer");
        window.GameEngine.selectMission(selectedQuickMissionId);
        renderDesignStudio();
        showScreen("screen-design");
      });
    }

    // Challenge Cards Start buttons
    document.querySelectorAll("[data-mission]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const mid = btn.dataset.mission || "sentinel-e";
        openChallengeBrief(mid);
      });
    });

    // Challenge Card container click
    document.querySelectorAll(".challenge-card").forEach(card => {
      card.addEventListener("click", () => {
        const mid = card.dataset.missionId || "sentinel-e";
        openChallengeBrief(mid);
      });
    });

    // Hero CTA Buttons
    const btnHeroStart = document.getElementById("btn-hero-start");
    if (btnHeroStart) {
      btnHeroStart.addEventListener("click", () => {
        openChallengeBrief("sentinel-e");
      });
    }

    const btnHeroCoop = document.getElementById("btn-hero-coop");
    if (btnHeroCoop) {
      btnHeroCoop.addEventListener("click", () => {
        showScreen("screen-multiplayer");
      });
    }

    // Portal Navbar Tabs
    const navTabs = document.querySelectorAll(".portal-nav-pill .nav-tab");
    navTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const tabTarget = tab.dataset.tab;
        navTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        if (window.SoundFX) window.SoundFX.playBeep(900, 0.03);

        if (tabTarget === "home") {
          showScreen("screen-title");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tabTarget === "challenges") {
          showScreen("screen-title");
          const target = document.getElementById("section-challenges");
          if (target) target.scrollIntoView({ behavior: "smooth" });
        } else if (tabTarget === "coop") {
          showScreen("screen-multiplayer");
        } else if (tabTarget === "leaderboard") {
          const m = document.getElementById("modal-leaderboard");
          if (m) m.classList.remove("hidden");
        } else if (tabTarget === "profile") {
          const m = document.getElementById("modal-profile");
          if (m) m.classList.remove("hidden");
        }
      });
    });

    // Notifications & Profile avatar buttons
    const btnNotifs = document.getElementById("btn-notifications");
    if (btnNotifs) {
      btnNotifs.addEventListener("click", () => {
        const m = document.getElementById("modal-notifications");
        if (m) m.classList.remove("hidden");
        if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
      });
    }

    const btnAvatar = document.getElementById("btn-avatar");
    if (btnAvatar) {
      btnAvatar.addEventListener("click", () => {
        const m = document.getElementById("modal-profile");
        if (m) m.classList.remove("hidden");
        if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
      });
    }

    // Quick links buttons
    const btnQuickHelp = document.getElementById("btn-quick-help");
    if (btnQuickHelp) {
      btnQuickHelp.addEventListener("click", openGuide);
    }

    const btnQuickAbout = document.getElementById("btn-quick-about");
    if (btnQuickAbout) {
      btnQuickAbout.addEventListener("click", () => {
        const m = document.getElementById("modal-about-challenge");
        if (m) m.classList.remove("hidden");
        if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
      });
    }

    const btnViewAll = document.getElementById("btn-view-all");
    if (btnViewAll) {
      btnViewAll.addEventListener("click", () => {
        const target = document.getElementById("section-challenges");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }

    // Generic Modal Close Buttons
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.dataset.closeModal;
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("hidden");
      });
    });
  }

  // SCREEN 2: TEAM SETUP
  function renderTeamRoster() {
    if (!el.teamContainer) return;
    el.teamContainer.innerHTML = "";

    const roles = window.GameData.roles;
    for (let i = 0; i < selectedPlayerCount; i++) {
      const assignedRole = roles[i % roles.length];
      const card = document.createElement("div");
      card.className = "roster-card";
      card.style.setProperty("--role-color", assignedRole.color);

      card.innerHTML = `
        <div class="roster-header">
          <span class="roster-role-icon">${assignedRole.icon}</span>
          <div>
            <div class="roster-role-title">Station 0${i + 1}: ${assignedRole.name}</div>
          </div>
        </div>
        <div class="roster-input-group">
          <label>Engineer Call-sign / Name</label>
          <input type="text" class="roster-input player-name-input" data-index="${i}" value="Engineer ${i + 1}">
        </div>
        <div class="roster-input-group">
          <label>Discipline Assignment</label>
          <select class="roster-select player-role-select" data-index="${i}">
            ${roles.map(r => `<option value="${r.id}" ${r.id === assignedRole.id ? "selected" : ""}>${r.icon} ${r.name}</option>`).join("")}
          </select>
        </div>
        <ul class="roster-duties-list">
          ${assignedRole.responsibilities.map(resp => `<li>${resp}</li>`).join("")}
        </ul>
      `;

      el.teamContainer.appendChild(card);
    }
  }

  function setupTeamScreen() {
    if (el.btnStartTeam) {
      el.btnStartTeam.addEventListener("click", () => {
        const nameInputs = document.querySelectorAll(".player-name-input");
        const roleSelects = document.querySelectorAll(".player-role-select");
        const roster = [];

        nameInputs.forEach((inp, idx) => {
          roster.push({
            name: inp.value.trim() || `Engineer ${idx + 1}`,
            roleId: roleSelects[idx] ? roleSelects[idx].value : "director"
          });
        });

        window.GameEngine.setPlayers(roster);
        renderMissionSelection();
        showScreen("screen-mission");
      });
    }

    if (el.btnBackTeam) {
      el.btnBackTeam.addEventListener("click", () => showScreen("screen-title"));
    }
  }

  // SCREEN 3: MISSION SELECTION
  function renderMissionSelection() {
    if (!el.missionCards) return;
    el.missionCards.innerHTML = "";

    const missions = window.GameData.missions;
    missions.forEach(m => {
      const card = document.createElement("div");
      card.className = "mission-item-card";
      card.dataset.id = m.id;

      card.innerHTML = `
        <div class="mission-card-top">
          <span class="mission-card-icon">${m.icon}</span>
          <div>
            <div class="mission-card-title">${m.name}</div>
            <div class="mission-card-dest">🎯 ${m.destination}</div>
          </div>
        </div>
        <div class="mission-card-brief">${m.briefing.substring(0, 110)}...</div>
        <div class="mission-card-badges">
          <span class="badge-tag">${m.type}</span>
          <span class="badge-tag badge-cyan">⏳ ${m.duration} Days</span>
          <span class="badge-tag">Difficulty: ${"⭐".repeat(m.difficulty)}</span>
        </div>
      `;

      card.addEventListener("click", () => selectMissionCard(m.id));
      el.missionCards.appendChild(card);
    });

    if (el.missionDetail) el.missionDetail.classList.add("hidden");
    if (el.btnAcceptMission) el.btnAcceptMission.disabled = true;
  }

  function selectMissionCard(missionId) {
    document.querySelectorAll(".mission-item-card").forEach(c => {
      c.classList.toggle("card-selected", c.dataset.id === missionId);
    });

    const mission = window.GameData.missions.find(m => m.id === missionId);
    if (!mission || !el.missionDetail) return;

    document.getElementById("detail-icon").textContent = mission.icon;
    document.getElementById("detail-name").textContent = mission.name;
    document.getElementById("detail-type").textContent = mission.type;
    document.getElementById("detail-destination").textContent = mission.destination;
    document.getElementById("detail-briefing").textContent = mission.briefing;

    const objList = document.getElementById("detail-objectives");
    objList.innerHTML = mission.objectives.map(o => `
      <li>
        <strong>${o.name} (${Math.round(o.scienceWeight * 100)}%):</strong> ${o.description}
      </li>
    `).join("");

    const reqContainer = document.getElementById("detail-requirements");
    reqContainer.innerHTML = `
      <span class="badge-tag">Min. Instruments: ${mission.requirements.minInstruments}</span>
      <span class="badge-tag badge-cyan">Required: ${mission.requirements.requiredCategories.join(", ").toUpperCase()}</span>
      <span class="badge-tag">Preferred: ${mission.requirements.preferredOrbits.join("/").toUpperCase()}</span>
    `;

    el.missionDetail.classList.remove("hidden");
    if (el.btnAcceptMission) {
      el.btnAcceptMission.disabled = false;
      el.btnAcceptMission.onclick = () => {
        window.GameEngine.selectMission(mission.id);
        renderDesignStudio();
        showScreen("screen-design");
      };
    }

    if (window.SoundFX) window.SoundFX.playBeep(900, 0.05);
  }

  // SCREEN 4: SPACECRAFT DESIGN STUDIO
  function renderDesignStudio() {
    renderTabContent();

    const designTitleEl = document.getElementById("design-header-mission-title");
    const st = window.GameEngine.getState();
    const curMission = (window.GameData && window.GameData.missions) ? window.GameData.missions.find(m => m.id === st.missionId) : null;
    if (designTitleEl && curMission) {
      designTitleEl.textContent = `${curMission.name.toUpperCase()} — DESIGN STUDIO`;
    }

    // Ensure currently selected or first tab is active
    const activeTabBtn = document.querySelector(".design-tabs-nav .tab-btn.active") || document.querySelector(".design-tabs-nav .tab-btn");
    if (activeTabBtn) {
      const tabName = activeTabBtn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".design-panel").forEach(p => p.classList.remove("active"));
      activeTabBtn.classList.add("active");
      const activePanel = document.getElementById(`panel-${tabName}`);
      if (activePanel) activePanel.classList.add("active");
    }

    // Initialize Live 3D Spacecraft CAD / Blueprint Inspector
    const cadCanvas = document.getElementById("design-cad-canvas");
    if (cadCanvas && window.Space3D && window.Space3D.initDesignCADViewer && !cadCanvas.dataset.cadInit) {
      cadCanvas.dataset.cadInit = "true";
      window.Space3D.initDesignCADViewer(cadCanvas);
    } else if (cadCanvas && window.Space3D && window.Space3D.updateDesignCAD) {
      window.Space3D.updateDesignCAD(st);
    }

    // Wire Blueprint Wireframe Toggle Button
    const btnWire = document.getElementById("btn-cad-wireframe");
    if (btnWire && !btnWire.dataset.wired) {
      btnWire.dataset.wired = "true";
      btnWire.addEventListener("click", () => {
        if (window.Space3D && window.Space3D.toggleCADWireframe) {
          const isWire = window.Space3D.toggleCADWireframe();
          btnWire.classList.toggle("active", isWire);
          btnWire.innerHTML = isWire ? '<span class="icon">📦</span> Solid Model' : '<span class="icon">📐</span> Wireframe CAD';
        }
      });
    }

    updateDesignState();
  }

  function renderTabContent() {
    const data = window.GameData;
    const state = window.GameEngine.getState();

    // 1. Orbit Cards
    renderHardwareGrid("orbit-cards", data.orbits, state.orbitId, (id) => {
      window.GameEngine.selectOrbit(state.orbitId === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip chip-deltav">ΔV: +${item.deltaV} km/s</div>
      <div class="stat-chip chip-science">Sci Mult: ${item.scienceMultiplier}x</div>
      <div class="stat-chip chip-radiation">Rad: ${(item.radiationLevel || "Low").toUpperCase()}</div>
      <div class="stat-chip chip-coverage">Coverage: ${Math.round((item.commsCoverage || 0.5) * 100)}%</div>
    `);

    // 2. Bus & Propulsion
    renderHardwareGrid("bus-cards", data.busSizes, state.components.bus, (id) => {
      window.GameEngine.setComponent("bus", state.components.bus === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip mass">Dry Mass: ${item.dryMass} kg</div>
      <div class="stat-chip science">Payload Max: ${item.maxPayloadMass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip power">Capacity: ${item.powerCapacity} W</div>
    `);

    renderHardwareGrid("propulsion-cards", data.propulsionSystems, state.components.propulsion, (id) => {
      window.GameEngine.setComponent("propulsion", state.components.propulsion === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">ΔV: ${item.deltaV} m/s</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip power">Power: ${item.power} W</div>
    `);

    // 3. Avionics & Power
    renderHardwareGrid("power-cards", data.powerSystems, state.components.power, (id) => {
      window.GameEngine.setComponent("power", state.components.power === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip power">Output: +${item.power} W</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip science">Type: ${(item.type || "Solar").toUpperCase()}</div>
    `);

    renderHardwareGrid("attitude-cards", data.attitudeControls, state.components.attitude, (id) => {
      window.GameEngine.setComponent("attitude", state.components.attitude === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">Precision: ±${item.pointingAccuracy}"</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip power">Power: ${item.power} W</div>
    `);

    renderHardwareGrid("computer-cards", data.computers, state.components.computer, (id) => {
      window.GameEngine.setComponent("computer", state.components.computer === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">Storage: ${item.dataStorage} GB</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip power">Power: ${item.power} W</div>
    `);

    renderHardwareGrid("thermal-cards", data.thermalSystems, state.components.thermal, (id) => {
      window.GameEngine.setComponent("thermal", state.components.thermal === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
    `);

    // 4. Comms & Ground
    renderHardwareGrid("antenna-cards", data.antennas, state.components.antenna, (id) => {
      window.GameEngine.setComponent("antenna", state.components.antenna === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">Data: ${item.dataRate} Mbps</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip power">Gain: ${item.gain} dBi</div>
    `);

    renderHardwareGrid("band-cards", data.frequencyBands, state.components.band, (id) => {
      window.GameEngine.setComponent("band", state.components.band === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">Max Rate: ${item.maxDataRate} Mbps</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
    `);

    renderHardwareGrid("groundstation-cards", data.groundStations, state.components.groundStation, (id) => {
      window.GameEngine.setComponent("groundStation", state.components.groundStation === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">Passes: ${item.coverage} hrs/day</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
    `);

    // 5. Scientific Instruments (Multi-Select)
    renderHardwareGrid("instrument-cards", data.instruments, state.instruments, (id) => {
      window.GameEngine.toggleInstrument(id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip science">🔬 Sci: +${item.scienceValue}</div>
      <div class="stat-chip mass">Mass: ${item.mass} kg</div>
      <div class="stat-chip power">Power: ${item.power} W</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip science">Data: ${item.dataRate} Mbps</div>
      <div class="stat-chip">Pointing: ${item.requiredPointing}</div>
    `, true);

    // 6. Launch Vehicles
    renderHardwareGrid("vehicle-cards", data.launchVehicles, state.launchVehicleId, (id) => {
      window.GameEngine.selectLaunchVehicle(state.launchVehicleId === id ? null : id);
      updateDesignState();
    }, (item) => `
      <div class="stat-chip mass">LEO Cap: ${item.payloadLEO} kg</div>
      <div class="stat-chip mass">GTO Cap: ${item.payloadGTO} kg</div>
      <div class="stat-chip cost">Cost: $${item.cost}M</div>
      <div class="stat-chip science">Reliability: ${(item.reliability * 100).toFixed(0)}%</div>
      <div class="stat-chip power">Orbits: ${(item.maxOrbitTypes || []).join("/")}</div>
    `);
  }

  function renderHardwareGrid(containerId, items, selectedState, onSelect, badgeRenderer, isMulti = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "hw-card";
      card.dataset.id = item.id;

      const isSelected = isMulti 
        ? Array.isArray(selectedState) && selectedState.includes(item.id)
        : selectedState === item.id;

      if (isSelected) card.classList.add("card-selected");

      if (item.id === "l2") {
        card.classList.add("hw-card-l2");
        card.innerHTML = `
          <div class="hw-card-l2-img">
            <img src="${item.image || 'assets/orbits/orbit_l2_exact.jpg'}" alt="${item.name}" />
          </div>
          <div class="hw-card-l2-content">
            <div class="hw-card-top">
              <span class="hw-card-icon">${item.icon || "🌀"}</span>
              <div class="hw-card-name">${item.name}</div>
              <span class="hw-card-check">✓</span>
            </div>
            <div class="hw-card-desc">${item.description}</div>
            <div class="hw-stats-badges l2-badges">
              ${badgeRenderer(item)}
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="hw-card-top">
            <span class="hw-card-icon">${item.icon || "⚙️"}</span>
            <div class="hw-card-name">${item.name}</div>
            <span class="hw-card-check">✓</span>
          </div>
          ${item.image ? `<div class="hw-card-img-wrap"><img src="${item.image}" alt="${item.name}" class="hw-card-img" /></div>` : ''}
          <div class="hw-card-desc">${item.description}</div>
          <div class="hw-stats-badges">
            ${badgeRenderer(item)}
          </div>
        `;
      }

      card.addEventListener("click", () => {
        onSelect(item.id);
        if (window.SoundFX) window.SoundFX.playBeep(950, 0.04);
      });

      container.appendChild(card);
    });
  }

  function updateDesignState() {
    const usage = window.GameEngine.getResourceUsage();
    const limits = window.GameEngine.getResourceLimits();
    const pcts = window.GameEngine.getResourcePercentages();
    const warnings = window.GameEngine.getWarnings();

    // 1. Update Gauge Bars & Values
    const updateBar = (fillEl, textEl, used, limit, pct, unit, prefix = "") => {
      if (!fillEl || !textEl) return;
      textEl.textContent = `${prefix}${used} / ${prefix}${limit > 90000 ? "N/A" : limit} ${unit}`;
      fillEl.style.width = `${Math.min(100, pct)}%`;
      fillEl.className = "resource-fill";
      if (pct > 100) fillEl.classList.add("fill-red");
      else if (pct > 75) fillEl.classList.add("fill-yellow");
      else fillEl.classList.add("fill-green");
    };

    updateBar(el.resBudgetFill, el.resBudgetText, usage.budget, limits.budget, pcts.budget, "M", "$");
    updateBar(el.resMassFill, el.resMassText, usage.mass, limits.mass, pcts.mass, "kg");
    updateBar(el.resPowerFill, el.resPowerText, usage.power, limits.power, pcts.power, "W");
    updateBar(el.resDataFill, el.resDataText, usage.dataRate, limits.dataRate, pcts.dataRate, "Mbps");

    // 2. Update Warnings Panel
    if (el.warningsCount) el.warningsCount.textContent = warnings.length;
    if (el.warningsPanel) {
      el.warningsPanel.innerHTML = warnings.map(w => `
        <div class="warning-item ${w.severity}">
          ${w.severity === "error" ? "❌" : (w.severity === "warning" ? "⚠️" : "ℹ️")} ${w.message}
        </div>
      `).join("");
    }

    // Refresh selected styles on cards without redrawing
    const state = window.GameEngine.getState();
    document.querySelectorAll(".hw-card").forEach(c => {
      const id = c.dataset.id;
      let selected = false;
      if (c.parentElement.id === "orbit-cards") selected = (state.orbitId === id);
      else if (c.parentElement.id === "bus-cards") selected = (state.components.bus === id);
      else if (c.parentElement.id === "propulsion-cards") selected = (state.components.propulsion === id);
      else if (c.parentElement.id === "power-cards") selected = (state.components.power === id);
      else if (c.parentElement.id === "attitude-cards") selected = (state.components.attitude === id);
      else if (c.parentElement.id === "computer-cards") selected = (state.components.computer === id);
      else if (c.parentElement.id === "thermal-cards") selected = (state.components.thermal === id);
      else if (c.parentElement.id === "antenna-cards") selected = (state.components.antenna === id);
      else if (c.parentElement.id === "band-cards") selected = (state.components.band === id);
      else if (c.parentElement.id === "groundstation-cards") selected = (state.components.groundStation === id);
      else if (c.parentElement.id === "vehicle-cards") selected = (state.launchVehicleId === id);
      else if (c.parentElement.id === "instrument-cards") selected = state.instruments.includes(id);

      c.classList.toggle("card-selected", selected);
    });

    updateHeaderBadge();

    // Update Live 3D Spacecraft CAD Model & Subsystem Badges
    if (window.Space3D && window.Space3D.updateDesignCAD) {
      window.Space3D.updateDesignCAD(state);
    }
    const cadBusBadge = document.getElementById("cad-bus-badge");
    const cadPowerBadge = document.getElementById("cad-power-badge");
    const cadPayloadBadge = document.getElementById("cad-instruments-badge");
    if (cadBusBadge) cadBusBadge.innerHTML = `<span class="badge-icon">⛁</span> BUS: ` + (state.components.bus ? state.components.bus.replace("-", " ").toUpperCase() : "NONE");
    if (cadPowerBadge) cadPowerBadge.innerHTML = `<span class="badge-icon">⚡</span> PWR: ` + (state.components.power ? state.components.power.replace("-", " ").toUpperCase() : "NONE");
    if (cadPayloadBadge) cadPayloadBadge.innerHTML = `<span class="badge-icon">📦</span> PAYLOAD: ` + (state.instruments ? state.instruments.length : 0) + " UNITS";

    const statusLine = document.getElementById("cad-status-line");
    if (statusLine) {
      if (!state.components.bus) {
        statusLine.textContent = "AWAITING HARDWARE INTEGRATION — SELECT BUS & SUBSYSTEMS BELOW";
      } else {
        let count = 1;
        if (state.components.power) count++;
        if (state.components.propulsion && state.components.propulsion !== "no-prop") count++;
        if (state.components.antenna) count++;
        if (state.components.attitude || state.components.computer) count++;
        if (state.instruments) count += state.instruments.length;
        statusLine.textContent = `LIVE CAD TELEMETRY · ${count} SUBSYSTEMS / INSTRUMENTS INTEGRATED`;
      }
    }
  }

  function setupDesignTabs() {
    el.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        el.tabBtns.forEach(b => b.classList.remove("active"));
        el.designPanels.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        currentTab = btn.dataset.tab;
        const panel = document.getElementById(`panel-${currentTab}`);
        if (panel) panel.classList.add("active");

        if (window.SoundFX) window.SoundFX.playBeep(750, 0.04);
      });
    });

    const btnAutoConfig = document.getElementById("btn-auto-configure");
    if (btnAutoConfig) {
      btnAutoConfig.addEventListener("click", () => {
        const state = window.GameEngine.getState();
        window.GameEngine.autoConfigure(state.missionId);
        renderTabContent();
        updateDesignState();
        if (window.SoundFX) window.SoundFX.playBeep(1200, 0.15);
      });
    }

    if (el.btnReview) {
      el.btnReview.addEventListener("click", () => {
        renderReviewScreen();
        showScreen("screen-review");
      });
    }

    if (el.btnBackDesign) {
      el.btnBackDesign.addEventListener("click", () => {
        renderMissionSelection();
        const st = window.GameEngine.getState();
        if (st.missionId) {
          selectMissionCard(st.missionId);
        }
        showScreen("screen-mission");
      });
    }

    if (el.btnBackMission) {
      el.btnBackMission.addEventListener("click", () => {
        showScreen("screen-design");
      });
    }

    const btnBackDesignToHub = document.getElementById("btn-back-design-to-hub");
    if (btnBackDesignToHub) {
      btnBackDesignToHub.addEventListener("click", () => {
        showScreen("screen-title");
      });
    }

    const btnQuickLaunchFromDesign = document.getElementById("btn-quick-launch-from-design");
    if (btnQuickLaunchFromDesign) {
      btnQuickLaunchFromDesign.addEventListener("click", () => {
        const state = window.GameEngine.getState();
        if (state.missionId) {
          selectedQuickMissionId = state.missionId;
        }
        launchInstantFlight();
      });
    }
  }

  // SCREEN 5: FLIGHT READINESS REVIEW (FRR)
  function renderReviewScreen() {
    const data = window.GameData;
    const state = window.GameEngine.getState();
    const usage = window.GameEngine.getResourceUsage();
    const limits = window.GameEngine.getResourceLimits();
    const mission = data.missions.find(m => m.id === state.missionId);
    const orbit = data.orbits.find(o => o.id === state.orbitId);
    const bus = data.busSizes.find(b => b.id === state.components.bus);
    const lv = data.launchVehicles.find(l => l.id === state.launchVehicleId);
    const pwr = data.powerSystems.find(p => p.id === state.components.power);
    const adcs = data.attitudeControls.find(a => a.id === state.components.attitude);
    const ant = data.antennas.find(a => a.id === state.components.antenna);

    // Populate Spec Grid
    if (el.reviewSummary) {
      el.reviewSummary.innerHTML = `
        <div class="spec-item"><span class="spec-label">Target Directive:</span><span class="spec-val">${mission ? mission.name : "None"}</span></div>
        <div class="spec-item"><span class="spec-label">Orbital Regime:</span><span class="spec-val">${orbit ? orbit.name : "None"}</span></div>
        <div class="spec-item"><span class="spec-label">Bus Architecture:</span><span class="spec-val">${bus ? bus.name : "None"}</span></div>
        <div class="spec-item"><span class="spec-label">Total Wet Mass:</span><span class="spec-val">${usage.mass} kg (Limit: ${limits.mass} kg)</span></div>
        <div class="spec-item"><span class="spec-label">Power Output:</span><span class="spec-val">${limits.power} W (Demand: ${usage.power} W)</span></div>
        <div class="spec-item"><span class="spec-label">Pointing Stability:</span><span class="spec-val">${adcs ? `±${adcs.pointingAccuracy} arcsec` : "None"}</span></div>
        <div class="spec-item"><span class="spec-label">Telemetry Link:</span><span class="spec-val">${limits.dataRate} Mbps (Gen: ${usage.dataRate} Mbps)</span></div>
        <div class="spec-item"><span class="spec-label">Launch Vehicle:</span><span class="spec-val">${lv ? `${lv.name} (${(lv.reliability*100).toFixed(0)}% Rel)` : "None"}</span></div>
        <div class="spec-item"><span class="spec-label">Science Payload:</span><span class="spec-val">${state.instruments.length} Instruments</span></div>
        <div class="spec-item"><span class="spec-label">Project Cost:</span><span class="spec-val">$${usage.budget}M (Cap: $${limits.budget}M)</span></div>
      `;
    }

    // Validation & GO / NO-GO checklist
    const val = window.GameEngine.validate();
    const warnings = window.GameEngine.getWarnings();
    const errors = warnings.filter(w => w.severity === "error");

    const checks = [
      { name: "Fiscal Budget Envelope", pass: usage.budget <= limits.budget, msg: usage.budget <= limits.budget ? "Compliant within budget ceiling" : "Budget overrun violation" },
      { name: "Mass Lift Margin", pass: lv && usage.mass <= limits.mass, msg: lv && usage.mass <= limits.mass ? "Positive launch lift margin" : "Wet mass exceeds rocket payload limit" },
      { name: "Electrical Power Balance", pass: limits.power >= usage.power, msg: limits.power >= usage.power ? "Continuous positive power margin" : "Power deficit: brownout risk" },
      { name: "Orbital Launcher Compatibility", pass: lv && orbit && lv.maxOrbitTypes.includes(orbit.type), msg: lv && orbit && lv.maxOrbitTypes.includes(orbit.type) ? "Upper stage energy verified" : "Rocket cannot inject into selected orbit" },
      { name: "Science Payload Readiness", pass: mission && state.instruments.length >= mission.requirements.minInstruments, msg: mission && state.instruments.length >= mission.requirements.minInstruments ? "Objective payload baseline fulfilled" : "Payload count below minimum specification" },
      { name: "Spacecraft Hardware Complete", pass: val.valid, msg: val.valid ? "All critical avionics & bus subsystems integrated" : "Unassigned subsystems or unresolved errors" }
    ];

    if (el.validationResults) {
      el.validationResults.innerHTML = checks.map(c => `
        <div class="checklist-row ${c.pass ? "pass" : "fail"}">
          <span class="check-icon">${c.pass ? "✔" : "✖"}</span>
          <div>
            <strong>${c.name}:</strong> <span class="text-muted">${c.msg}</span>
          </div>
        </div>
      `).join("");
    }

    // Launch readiness banner
    if (el.launchStatus) {
      if (val.canLaunch) {
        el.launchStatus.className = "readiness-banner go";
        el.launchStatus.textContent = "🟢 FLIGHT READINESS REVIEW: ALL SYSTEMS GO FOR LAUNCH";
        if (el.btnPlayInteractive) el.btnPlayInteractive.disabled = false;
        if (el.btnLaunchMission) el.btnLaunchMission.disabled = false;
      } else {
        el.launchStatus.className = "readiness-banner nogo";
        el.launchStatus.textContent = `🔴 NO-GO FOR LAUNCH: ${errors.length > 0 ? errors[0].message : "Complete subsystem configuration"}`;
        if (el.btnPlayInteractive) el.btnPlayInteractive.disabled = true;
        if (el.btnLaunchMission) el.btnLaunchMission.disabled = true;
      }
    }
  }

  function setupReviewScreen() {
    if (el.btnPlayInteractive) {
      el.btnPlayInteractive.addEventListener("click", () => {
        if (window.SoundFX) window.SoundFX.playLaunch();
        window.GameEngine.startSimulation();
        showScreen("screen-arcade");

        const titleEl = document.getElementById("arcade-mission-title");
        const state = window.GameEngine.getState();
        const m = window.GameData.missions.find(x => x.id === state.missionId);
        if (titleEl && m) titleEl.textContent = `🎮 ${m.name.toUpperCase()} - FLIGHT OPERATIONS`;

        if (window.SpaceFlightGame && el.gameCanvas) {
          window.SpaceFlightGame.start(el.gameCanvas, () => {
            renderResultsScreen();
            showScreen("screen-results");
          });
        }
      });
    }

    if (el.btnLaunchMission) {
      el.btnLaunchMission.addEventListener("click", () => {
        if (window.SoundFX) window.SoundFX.playLaunch();
        window.GameEngine.startSimulation();
        initSimulationView();
        showScreen("screen-simulation");
      });
    }

    if (el.btnBackReview) {
      el.btnBackReview.addEventListener("click", () => showScreen("screen-design"));
    }
  }

  function setupArcadeScreen() {
    const hookTouch = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const startFn = (e) => {
        e.preventDefault();
        if (window.SpaceFlightGame) window.SpaceFlightGame.setInput(key, true);
      };
      const endFn = (e) => {
        e.preventDefault();
        if (window.SpaceFlightGame) window.SpaceFlightGame.setInput(key, false);
      };
      btn.addEventListener("mousedown", startFn);
      btn.addEventListener("mouseup", endFn);
      btn.addEventListener("mouseleave", endFn);
      btn.addEventListener("touchstart", startFn, { passive: false });
      btn.addEventListener("touchend", endFn, { passive: false });
    };

    hookTouch("ctrl-left", "left");
    hookTouch("ctrl-right", "right");
    hookTouch("ctrl-up", "up");
    hookTouch("ctrl-down", "down");
    hookTouch("ctrl-action", "action");

    const btnCtrlAnomaly = document.getElementById("ctrl-anomaly");
    if (btnCtrlAnomaly) {
      btnCtrlAnomaly.addEventListener("click", () => {
        if (window.SpaceFlightGame && window.SpaceFlightGame.resolveAnomaly) {
          window.SpaceFlightGame.resolveAnomaly();
        }
      });
    }

    if (el.btnCompleteFlight) {
      el.btnCompleteFlight.addEventListener("click", () => {
        if (window.SpaceFlightGame) {
          window.SpaceFlightGame.stop();
          const scoreData = window.SpaceFlightGame.getScoreData();
          const sim = window.GameEngine.getState().simulation;
          sim.scienceCollected = Math.max(sim.scienceCollected, scoreData.science / 10);
          sim.dataCollected = Math.max(sim.dataCollected, scoreData.data);
          sim.healthPercent = scoreData.health;
          sim.day = sim.totalDays; // Mark as complete
        }
        renderResultsScreen();
        showScreen("screen-results");
      });
    }

    const btnBackToHub = document.getElementById("btn-back-to-hub");
    if (btnBackToHub) {
      btnBackToHub.addEventListener("click", () => {
        if (window.SpaceFlightGame) {
          window.SpaceFlightGame.stop();
        }
        showScreen("screen-title");
      });
    }
  }

  // SCREEN 6: SIMULATION & CANVAS VISUALIZER
  function initSimulationView() {
    simSpeed = 1;
    if (el.btnSimPlay) el.btnSimPlay.textContent = "⏸ Pause";
    if (el.btnSimFast) el.btnSimFast.textContent = "⏩ 5x Speed";
    if (el.simLog) el.simLog.innerHTML = "";

    startSimTimer();
    startCanvasAnimation();
    updateSimTelemetry();
  }

  function startSimTimer() {
    stopSimTimer();
    const intervalMs = simSpeed === 20 ? 30 : (simSpeed === 5 ? 120 : 500);
    simInterval = setInterval(() => {
      const step = simSpeed === 20 ? 4 : 1;
      const result = window.GameEngine.advanceDay(step);
      if (!result) return;

      updateSimTelemetry(result);

      if (result.event) {
        stopSimTimer();
        triggerEventModal(result.event);
      }

      if (result.status === "complete" || result.status === "failed") {
        stopSimTimer();
        setTimeout(() => {
          renderResultsScreen();
          showScreen("screen-results");
        }, 1800);
      }
    }, intervalMs);
  }

  function stopSimTimer() {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
  }

  function updateSimTelemetry(res) {
    const sim = window.GameEngine.getState().simulation;

    if (el.simDay) el.simDay.textContent = `Day ${sim.day} / ${sim.totalDays}`;
    if (el.simScience) el.simScience.textContent = `${Math.round(sim.scienceCollected * 10) / 10} pts`;
    if (el.simData) el.simData.textContent = `${Math.round(sim.dataCollected)} GB`;
    if (el.simPower) el.simPower.textContent = `${Math.round(100 - sim.powerDegradation)}%`;
    if (el.simHealth) el.simHealth.textContent = `${Math.round(sim.healthPercent)}%`;

    const pct = window.GameEngine.getSimulationProgress();
    if (el.simProgressFill) el.simProgressFill.style.width = `${pct}%`;

    // Render streaming log
    if (el.simLog && sim.log) {
      el.simLog.innerHTML = sim.log.slice(0, 15).map(item => `
        <div class="log-entry ${item.type}">
          <span>[T+${item.day}d]</span>
          <span>${item.message}</span>
        </div>
      `).join("");
    }
  }

  function triggerEventModal(event) {
    if (window.SoundFX) window.SoundFX.playAlarm();
    currentEventId = event.id;

    if (el.modalTitle) el.modalTitle.textContent = event.title;
    if (el.modalBody) el.modalBody.textContent = event.description;
    if (el.modalChoices) {
      el.modalChoices.innerHTML = event.choices.map((choice, idx) => `
        <button class="modal-choice-btn" data-choice="${idx}">
          <strong>Option ${idx + 1}:</strong> ${choice.text}
        </button>
      `).join("");

      el.modalChoices.querySelectorAll(".modal-choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const choiceIdx = parseInt(btn.dataset.choice, 10);
          window.GameEngine.handleEventChoice(currentEventId, choiceIdx);
          el.modalOverlay.classList.add("hidden");
          if (window.SoundFX) window.SoundFX.playBeep(900, 0.08);
          updateSimTelemetry();
          if (!window.GameEngine.isSimulationComplete()) {
            startSimTimer();
          }
        });
      });
    }

    if (el.modalOverlay) el.modalOverlay.classList.remove("hidden");
  }

  // 2D CANVAS ORBITAL VISUALIZER
  function startCanvasAnimation() {
    if (animId) cancelAnimationFrame(animId);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const state = window.GameEngine.getState();
      const orbitId = state.orbitId || "leo";

      // Background starry space grid
      ctx.fillStyle = "#04060c";
      ctx.fillRect(0, 0, w, h);

      // Central Body
      if (orbitId === "lunar") {
        // Moon
        const moonGrad = ctx.createRadialGradient(cx - 15, cy - 15, 10, cx, cy, 60);
        moonGrad.addColorStop(0, "#e0e0e0");
        moonGrad.addColorStop(0.8, "#9e9e9e");
        moonGrad.addColorStop(1, "#616161");
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();

        // Moon Craters
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        [[cx - 20, cy - 10, 12], [cx + 25, cy + 15, 18], [cx - 10, cy + 30, 8]].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (orbitId === "l2") {
        // Sun on the left edge, Earth in middle, L2 on right
        ctx.fillStyle = "#ffd600";
        ctx.beginPath();
        ctx.arc(40, cy, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00b0ff";
        ctx.beginPath();
        ctx.arc(cx - 80, cy, 24, 0, Math.PI * 2);
        ctx.fill();

        // L2 marker
        ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx + 120, cy, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Earth
        const earthGrad = ctx.createRadialGradient(cx - 20, cy - 20, 15, cx, cy, 80);
        earthGrad.addColorStop(0, "#4fc3f7");
        earthGrad.addColorStop(0.4, "#0288d1");
        earthGrad.addColorStop(0.8, "#01579b");
        earthGrad.addColorStop(1, "#002f6c");
        ctx.fillStyle = earthGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fill();

        // Atmosphere glow
        ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 83, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbit Path
      let rx = 180;
      let ry = 100;
      let orbitCenter = cx;
      if (orbitId === "geo") { rx = 220; ry = 120; }
      else if (orbitId === "heo") { rx = 240; ry = 70; }
      else if (orbitId === "l2") { rx = 40; ry = 40; orbitCenter = cx + 120; }

      ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(orbitCenter, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Spacecraft Position along orbit
      orbitAngle += (simSpeed === 20 ? 0.06 : (simSpeed === 5 ? 0.025 : 0.01));
      const satX = orbitCenter + rx * Math.cos(orbitAngle);
      const satY = cy + ry * Math.sin(orbitAngle);

      // Downlink Beam (active when on front side of orbit)
      if (Math.sin(orbitAngle) > 0 && orbitId !== "l2") {
        ctx.strokeStyle = "rgba(0, 230, 118, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Satellite
      ctx.save();
      ctx.translate(satX, satY);
      ctx.rotate(orbitAngle + Math.PI / 2);

      // Solar Wings
      ctx.fillStyle = "#1e88e5";
      ctx.strokeStyle = "#90caf9";
      ctx.lineWidth = 1;
      ctx.fillRect(-18, -4, 8, 8);
      ctx.strokeRect(-18, -4, 8, 8);
      ctx.fillRect(10, -4, 8, 8);
      ctx.strokeRect(10, -4, 8, 8);

      // Bus Core
      ctx.fillStyle = "#ffd54f"; // Gold MLI
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(-6, -6, 12, 12);

      // Antenna Dish
      ctx.strokeStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(0, -8, 4, 0, Math.PI);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    draw();
  }

  function setupSimControls() {
    if (el.btnSimPlay) {
      el.btnSimPlay.addEventListener("click", () => {
        const sim = window.GameEngine.getState().simulation;
        if (simInterval) {
          stopSimTimer();
          el.btnSimPlay.textContent = "▶ Resume";
          if (el.simStatus) el.simStatus.textContent = "SIMULATION PAUSED";
        } else {
          startSimTimer();
          el.btnSimPlay.textContent = "⏸ Pause";
          if (el.simStatus) el.simStatus.textContent = "NOMINAL FLIGHT OPERATIONS";
        }
      });
    }

    if (el.btnSimFast) {
      el.btnSimFast.addEventListener("click", () => {
        if (simSpeed === 1) {
          simSpeed = 5;
          el.btnSimFast.textContent = "⏩ 5x Speed";
        } else if (simSpeed === 5) {
          simSpeed = 20;
          el.btnSimFast.textContent = "⚡ 20x Warp";
        } else {
          simSpeed = 1;
          el.btnSimFast.textContent = "▶ 1x Normal";
        }
        if (simInterval) startSimTimer();
      });
    }

    if (el.btnSimStep) {
      el.btnSimStep.addEventListener("click", () => {
        stopSimTimer();
        const res = window.GameEngine.advanceDay(1);
        if (res) updateSimTelemetry(res);
      });
    }

    if (el.btnSimAbort) {
      el.btnSimAbort.addEventListener("click", () => {
        if (confirm("Terminate mission simulation immediately and proceed to final evaluation?")) {
          stopSimTimer();
          renderResultsScreen();
          showScreen("screen-results");
        }
      });
    }
  }

  // SCREEN 7: POST-FLIGHT EVALUATION & REPORT
  function renderResultsScreen() {
    const score = window.GameEngine.calculateScore();
    const report = window.GameEngine.generateReport();

    // Grade and Total Score
    if (el.resultGrade) el.resultGrade.textContent = score.grade;
    if (el.resultScore) el.resultScore.textContent = score.total;

    // Pillar Scores
    if (el.resultScience) el.resultScience.textContent = `${score.science} / 40`;
    if (el.resultEngineering) el.resultEngineering.textContent = `${score.engineering} / 25`;
    if (el.resultBudget) el.resultBudget.textContent = `${score.budget} / 20`;
    if (el.resultLifetime) el.resultLifetime.textContent = `${score.lifetime} / 15`;

    // Pillar Progress Bars
    if (el.scoreBarScience) el.scoreBarScience.style.width = `${(score.science / 40) * 100}%`;
    if (el.scoreBarEngineering) el.scoreBarEngineering.style.width = `${(score.engineering / 25) * 100}%`;
    if (el.scoreBarBudget) el.scoreBarBudget.style.width = `${(score.budget / 20) * 100}%`;
    if (el.scoreBarLifetime) el.scoreBarLifetime.style.width = `${(score.lifetime / 15) * 100}%`;

    // Achievements Badges
    if (el.resultAchievements) {
      if (score.achievements.length > 0) {
        el.resultAchievements.innerHTML = score.achievements.map(ach => `
          <div class="achievement-badge">
            <span class="achieve-icon">${ach.icon}</span>
            <div>
              <span class="achieve-name">${ach.name}</span>
              <span class="achieve-desc">${ach.description}</span>
            </div>
          </div>
        `).join("");
      } else {
        el.resultAchievements.innerHTML = `<div class="text-muted">Standard flight parameters maintained. No special badges awarded.</div>`;
      }
    }

    // Comprehensive NASA Report
    if (el.resultReport) {
      el.resultReport.innerHTML = `
        <div class="report-summary-text">
          <strong>Mission Performance Summary:</strong><br>${report.summary}
        </div>

        <div class="report-section">
          <h4>Architecture Decisions & Trade-off Impacts</h4>
          <table class="report-table">
            <thead><tr><th>Discipline</th><th>Design Selection</th><th>Trade-off Impact</th></tr></thead>
            <tbody>
              ${report.decisions.map(d => `<tr><td>${d.category}</td><td><strong>${d.choice}</strong></td><td>${d.impact}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h4>Systems Engineering Recommendations</h4>
          <ul class="objectives-list">
            ${report.recommendations.map(r => `<li>${r}</li>`).join("")}
          </ul>
        </div>

        <div class="report-section">
          <h4>Real-World NASA Mission Analogue</h4>
          ${report.similarMissions.map(m => `
            <div class="subsystem-box">
              <strong>${m.name}</strong>
              <p>${m.description}</p>
            </div>
          `).join("")}
        </div>
      `;
    }
  }

  function setupResultsScreen() {
    if (el.btnRetry) {
      el.btnRetry.addEventListener("click", () => {
        showScreen("screen-design");
      });
    }

    if (el.btnNewMission) {
      el.btnNewMission.addEventListener("click", () => {
        window.GameEngine.init(selectedDifficulty);
        renderMissionSelection();
        showScreen("screen-mission");
      });
    }

    if (el.btnExportReport) {
      el.btnExportReport.addEventListener("click", () => {
        const score = window.GameEngine.calculateScore();
        const report = window.GameEngine.generateReport();
        const exportText = `=====================================================
NASA MISSION CONTROL - POST-FLIGHT SYSTEMS REPORT
=====================================================
Mission: ${report.missionName}
Composite Score: ${score.total}/100 (Grade: ${score.grade})
- Science Return: ${score.science}/40
- Systems Engineering: ${score.engineering}/25
- Fiscal Efficiency: ${score.budget}/20
- Operational Longevity: ${score.lifetime}/15

Summary:
${report.summary}

Key Systems Engineering Decisions:
${report.decisions.map(d => `- ${d.category}: ${d.choice} (${d.impact})`).join("\n")}

Engineering Recommendations:
${report.recommendations.map(r => `- ${r}`).join("\n")}
=====================================================`;

        const blob = new Blob([exportText], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `MissionControl_Report_${Date.now()}.txt`;
        a.click();
      });
    }
  }

  function setupTutorialScreen() {
    if (el.btnBackTutorial) {
      el.btnBackTutorial.addEventListener("click", () => {
        showScreen(previousScreen || "screen-title");
      });
    }

    if (el.btnHeaderHelp) {
      el.btnHeaderHelp.addEventListener("click", () => {
        const modal = document.getElementById("modal-how-to-play");
        if (modal) modal.classList.remove("hidden");
        else showScreen("screen-tutorial");
      });
    }

    if (el.btnSoundToggle) {
      el.btnSoundToggle.addEventListener("click", () => {
        if (window.SoundFX) {
          const isEnabled = window.SoundFX.toggle();
          el.btnSoundToggle.textContent = isEnabled ? "🔊" : "🔇";
        }
      });
    }
  }

  // MULTIPLAYER CO-OP UI & LOBBY MANAGEMENT
  function setupMultiplayerUI() {
    const btnOpenMp = document.getElementById("btn-open-multiplayer");
    const btnHeaderMp = document.getElementById("btn-header-multiplayer");
    const btnBackMp = document.getElementById("btn-back-multiplayer");
    const btnMpCreate = document.getElementById("btn-mp-create");
    const btnMpJoin = document.getElementById("btn-mp-join");
    const btnMpCopy = document.getElementById("btn-mp-copy-link");
    const btnMpReady = document.getElementById("btn-mp-ready");
    const btnMpLaunch = document.getElementById("btn-mp-launch");
    const btnMpLeave = document.getElementById("btn-mp-leave");

    const setupContainer = document.getElementById("mp-setup-container");
    const lobbyContainer = document.getElementById("mp-lobby-container");
    const codeDisplay = document.getElementById("mp-room-code-display");
    const missionTag = document.getElementById("mp-lobby-mission-tag");
    const diffTag = document.getElementById("mp-lobby-diff-tag");
    const pingTag = document.getElementById("mp-lobby-ping");
    const wifiHint = document.getElementById("mp-wifi-link-hint");

    // Dynamic Wi-Fi link hint in setup card
    if (wifiHint && typeof window !== "undefined" && window.location) {
      wifiHint.textContent = `${window.location.protocol}//${window.location.host}/`;
    }

    function openMultiplayerScreen() {
      showScreen("screen-multiplayer");
      if (window.MultiplayerClient && window.MultiplayerClient.isInRoom()) {
        if (setupContainer) setupContainer.style.display = "none";
        if (lobbyContainer) lobbyContainer.style.display = "flex";
      } else {
        if (setupContainer) setupContainer.style.display = "grid";
        if (lobbyContainer) lobbyContainer.style.display = "none";
      }
    }

    if (btnOpenMp) btnOpenMp.addEventListener("click", openMultiplayerScreen);
    if (btnHeaderMp) btnHeaderMp.addEventListener("click", openMultiplayerScreen);

    if (btnBackMp) {
      btnBackMp.addEventListener("click", () => {
        showScreen("screen-title");
      });
    }

    const mpBrand = document.querySelector(".mp-nav-brand");
    if (mpBrand) {
      mpBrand.addEventListener("click", () => {
        showScreen("screen-title");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Top navbar navigation links inside screen-multiplayer
    document.querySelectorAll(".mp-nav-link").forEach(link => {
      link.addEventListener("click", () => {
        const tab = link.dataset.tab;
        if (tab === "dashboard") {
          showScreen("screen-title");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "missions") {
          showScreen("screen-title");
          const target = document.getElementById("section-challenges");
          if (target) target.scrollIntoView({ behavior: "smooth" });
        } else if (tab === "multiplayer") {
          showScreen("screen-multiplayer");
        } else if (tab === "design") {
          showScreen("screen-design");
        } else if (tab === "resources") {
          const modal = document.getElementById("modal-about-challenge");
          if (modal) modal.classList.remove("hidden");
        } else if (tab === "guide") {
          const mpModal = document.getElementById("modal-mp-guide");
          if (mpModal) mpModal.classList.remove("hidden");
          else {
            const modal = document.getElementById("modal-how-to-play");
            if (modal) modal.classList.remove("hidden");
          }
        }
      });
    });

    // MULTIPLAYER FLIGHT GUIDE MODAL CONTROLS
    const modalMpGuide = document.getElementById("modal-mp-guide");
    const btnMpGuidePill = document.getElementById("btn-mp-guide-pill");
    const btnOpenFullGuide = document.getElementById("btn-open-full-guide");
    const btnMpLobbyGuide = document.getElementById("btn-mp-lobby-guide");
    const btnCloseMpGuide = document.getElementById("btn-close-mp-guide");
    const btnStartFromMpGuide = document.getElementById("btn-start-from-mp-guide");

    const openMpGuide = () => {
      if (modalMpGuide) modalMpGuide.classList.remove("hidden");
      if (window.SoundFX) window.SoundFX.playBeep(850, 0.04);
    };

    const closeMpGuide = () => {
      if (modalMpGuide) modalMpGuide.classList.add("hidden");
    };

    if (btnMpGuidePill) btnMpGuidePill.addEventListener("click", openMpGuide);
    if (btnOpenFullGuide) btnOpenFullGuide.addEventListener("click", openMpGuide);
    if (btnMpLobbyGuide) btnMpLobbyGuide.addEventListener("click", openMpGuide);
    if (btnCloseMpGuide) btnCloseMpGuide.addEventListener("click", closeMpGuide);
    if (btnStartFromMpGuide) btnStartFromMpGuide.addEventListener("click", closeMpGuide);

    if (modalMpGuide) {
      modalMpGuide.addEventListener("click", (e) => {
        if (e.target === modalMpGuide) closeMpGuide();
      });
    }

    // CREATE ROOM
    if (btnMpCreate) {
      btnMpCreate.addEventListener("click", () => {
        const nameInput = document.getElementById("mp-host-name");
        const playersSelect = document.getElementById("mp-host-players");
        const missionSelect = document.getElementById("mp-host-mission");
        const diffSelect = document.getElementById("mp-host-difficulty");
        const codeInput = document.getElementById("mp-host-code");

        const name = (nameInput?.value || "Commander").trim();
        const maxPlayers = parseInt(playersSelect?.value || "4", 10);
        const missionId = missionSelect?.value || "sentinel-e";
        const difficulty = diffSelect?.value || "engineer";
        const customCode = (codeInput?.value || "").trim().toUpperCase();

        if (window.MultiplayerClient) {
          window.MultiplayerClient.createRoom(name, missionId, difficulty, maxPlayers, customCode);
        }
      });
    }

    // JOIN ROOM
    if (btnMpJoin) {
      btnMpJoin.addEventListener("click", () => {
        const codeInput = document.getElementById("mp-join-code");
        const nameInput = document.getElementById("mp-join-name");

        const code = (codeInput?.value || "").trim().toUpperCase();
        const name = (nameInput?.value || "Specialist").trim();

        if (!code) {
          alert("Please enter a valid Room Code (e.g. APOLLO)!");
          if (codeInput) codeInput.focus();
          return;
        }

        if (window.MultiplayerClient) {
          window.MultiplayerClient.joinRoom(code, name);
        }
      });
    }

    // COPY INVITE LINK
    if (btnMpCopy) {
      btnMpCopy.addEventListener("click", () => {
        if (!window.MultiplayerClient) return;
        const shareUrl = window.MultiplayerClient.getShareUrl();
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            const toast = document.getElementById("mp-copy-toast");
            if (toast) {
              toast.style.display = "inline-block";
              setTimeout(() => { toast.style.display = "none"; }, 2500);
            }
          }).catch(() => {
            prompt("Copy this invite link for your friends:", shareUrl);
          });
        } else {
          prompt("Copy this invite link for your friends:", shareUrl);
        }
      });
    }

    // CLAIM ROLE BUTTONS
    document.querySelectorAll(".btn-claim-role").forEach(btn => {
      btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        if (role && window.MultiplayerClient) {
          window.MultiplayerClient.selectRole(role);
          if (window.SoundFX) window.SoundFX.playClaim();
        }
      });
    });

    // TOGGLE READY
    if (btnMpReady) {
      btnMpReady.addEventListener("click", () => {
        if (!window.MultiplayerClient) return;
        const local = window.MultiplayerClient.getLocalPlayer();
        const currentReady = local ? local.ready : false;
        window.MultiplayerClient.toggleReady(!currentReady);
        if (window.SoundFX) window.SoundFX.playReady();
      });
    }

    // LAUNCH FLIGHT (HOST ONLY)
    if (btnMpLaunch) {
      btnMpLaunch.addEventListener("click", () => {
        if (!window.MultiplayerClient) return;
        window.MultiplayerClient.startGame();
      });
    }

    // LEAVE ROOM
    if (btnMpLeave) {
      btnMpLeave.addEventListener("click", () => {
        if (window.MultiplayerClient) {
          window.MultiplayerClient.leaveRoom();
        }
        if (setupContainer) setupContainer.style.display = "grid";
        if (lobbyContainer) lobbyContainer.style.display = "none";
      });
    }

    // COMMS CHAT FORM (LOBBY)
    const chatForm = document.getElementById("mp-chat-form");
    const chatInput = document.getElementById("mp-chat-input");
    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text && window.MultiplayerClient) {
          window.MultiplayerClient.sendChat(text);
          chatInput.value = "";
        }
      });
    }

    // QUICK RADIO CALLOUTS
    document.querySelectorAll(".btn-callout").forEach(btn => {
      btn.addEventListener("click", () => {
        const callout = btn.dataset.callout;
        const text = btn.textContent.replace(/"/g, "").trim();
        if (window.MultiplayerClient) {
          window.MultiplayerClient.sendChat(text, callout);
        }
      });
    });

    // IN-FLIGHT COMMS TOGGLE & DRAWER
    const btnToggleFlightComms = document.getElementById("btn-toggle-flight-comms");
    const btnCloseFlightComms = document.getElementById("btn-close-flight-comms");
    const flightDrawerForm = document.getElementById("flight-drawer-form");
    const flightDrawerInput = document.getElementById("flight-drawer-input");

    if (btnToggleFlightComms) {
      btnToggleFlightComms.addEventListener("click", () => {
        if (window.SpaceFlightGame && window.SpaceFlightGame.toggleFlightCommsDrawer) {
          window.SpaceFlightGame.toggleFlightCommsDrawer();
        }
      });
    }
    if (btnCloseFlightComms) {
      btnCloseFlightComms.addEventListener("click", () => {
        const drawer = document.getElementById("flight-comms-drawer");
        if (drawer) drawer.style.display = "none";
      });
    }
    if (flightDrawerForm && flightDrawerInput) {
      flightDrawerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = flightDrawerInput.value.trim();
        if (text && window.MultiplayerClient) {
          window.MultiplayerClient.sendChat(text);
          flightDrawerInput.value = "";
        }
      });
    }

    // MULTIPLAYER CLIENT EVENTS
    if (window.MultiplayerClient) {
      window.MultiplayerClient.on("roomJoined", (data) => {
        if (setupContainer) setupContainer.style.display = "none";
        if (lobbyContainer) lobbyContainer.style.display = "flex";

        if (codeDisplay) codeDisplay.textContent = data.room.code;
        const missionNames = {
          "sentinel-e": "Earth Sentinel (LEO 400 km)",
          "stormwatch": "StormWatch (GEO 35,786 km)",
          "artemis-scout": "Artemis Scout (Lunar Polar)",
          "red-pioneer": "Red Pioneer (Mars Exploration)",
          "asteroid-guard": "Asteroid Sentinel (Planetary Defense)",
          "deepview": "DeepView-1 (Sun-Earth L2)"
        };
        if (missionTag) missionTag.textContent = missionNames[data.room.missionId] || data.room.missionId;
        if (diffTag) diffTag.textContent = `${data.room.difficulty.toUpperCase()} DIFFICULTY`;

        const playersTag = document.getElementById("mp-lobby-players-tag");
        if (playersTag) {
          const max = data.room.maxPlayers || 4;
          const count = data.players.length;
          playersTag.textContent = `CREW: ${count} / ${max}${count >= max ? " (FULL)" : ""}`;
        }

        renderRolesAndOccupants(data.players);
        renderChatMessages(data.chat);
        updateHostControls();
      });

      window.MultiplayerClient.on("roomUpdated", (data) => {
        if (data.leftPlayer) {
          showLiveAlert("leave", data.leftPlayer);
        } else if (data.newPlayer) {
          showLiveAlert("join", data.newPlayer);
        }

        const playersTag = document.getElementById("mp-lobby-players-tag");
        if (playersTag && data.room) {
          const max = data.room.maxPlayers || 4;
          const count = data.players.length;
          playersTag.textContent = `CREW: ${count} / ${max}${count >= max ? " (FULL)" : ""}`;
        }

        renderRolesAndOccupants(data.players);
        updateHostControls();
      });

      window.MultiplayerClient.on("playerLeft", (leftPlayer) => {
        showLiveAlert("leave", leftPlayer);
      });

      window.MultiplayerClient.on("playerJoined", (newPlayer) => {
        showLiveAlert("join", newPlayer);
      });

      window.MultiplayerClient.on("gameStart", (payload) => {
        if (window.GameEngine) {
          window.GameEngine.autoConfigure(payload.missionId || "sentinel-e");
        }
        showScreen("screen-arcade");
        if (window.SpaceFlightGame) {
          window.SpaceFlightGame.start();
        }
      });

      window.MultiplayerClient.on("chatMessage", (msg) => {
        appendChatMessage(msg);
        if (window.SoundFX) window.SoundFX.playQuindarTone();
      });

      window.MultiplayerClient.on("ping", (data) => {
        if (pingTag) pingTag.textContent = `PING: ${data.pingMs}ms`;
      });

      window.MultiplayerClient.on("error", (err) => {
        alert(err.message || "Multiplayer error occurred.");
      });
    }

    function renderRolesAndOccupants(players = []) {
      const roles = ["flight_director", "systems_engineer", "science_officer", "comms_officer"];
      const local = window.MultiplayerClient?.getLocalPlayer();

      roles.forEach(roleKey => {
        const occupantEl = document.getElementById(`occupant-${roleKey}`);
        const cardEl = document.getElementById(`role-card-${getRoleCardSuffix(roleKey)}`);
        const claimBtn = cardEl ? cardEl.querySelector(".btn-claim-role") : null;

        const playerInRole = players.find(p => p.role === roleKey);

        if (cardEl) {
          cardEl.classList.toggle("claimed", Boolean(playerInRole));
          cardEl.classList.toggle("is-you", Boolean(local && playerInRole && playerInRole.id === local.id));
        }

        if (occupantEl) {
          if (playerInRole) {
            const isYou = local && playerInRole.id === local.id;
            occupantEl.innerHTML = `
              <div class="occupant-info">
                <span>${playerInRole.name}</span>
                ${isYou ? '<span class="occupant-badge-you">YOU</span>' : ''}
              </div>
              <div class="occupant-ready-tag ${playerInRole.ready ? 'ready' : 'waiting'}">
                ${playerInRole.ready ? '✔ READY' : '⏳ SETTING UP'}
              </div>
            `;
          } else {
            occupantEl.innerHTML = `<span class="occupant-status empty">Empty Console - Click to Claim</span>`;
          }
        }

        if (claimBtn) {
          const isYou = local && playerInRole && playerInRole.id === local.id;
          claimBtn.textContent = isYou ? "Your Active Console ✔" : (playerInRole ? "Take Over Console" : "Claim Console");
          claimBtn.disabled = isYou;
        }
      });

      // Update Ready Button
      if (btnMpReady && local) {
        btnMpReady.textContent = local.ready ? "✔ READY (CLICK TO UNREADY)" : "⚡ MARK READY FOR LAUNCH";
        btnMpReady.className = local.ready ? "btn btn-primary" : "btn btn-secondary";
      }
    }

    function getRoleCardSuffix(role) {
      if (role === "flight_director") return "flight";
      if (role === "systems_engineer") return "prop";
      if (role === "science_officer") return "science";
      if (role === "comms_officer") return "comms";
      return "flight";
    }

    function updateHostControls() {
      const room = window.MultiplayerClient?.getRoom();
      const players = window.MultiplayerClient?.getPlayers() || [];
      if (!btnMpLaunch) return;

      if (room && room.isHost) {
        btnMpLaunch.style.display = "inline-flex";
        const allReady = players.length > 0 && players.every(p => p.ready);
        btnMpLaunch.disabled = !allReady;
        btnMpLaunch.title = allReady ? "Authorize Flight Launch Sequence" : "All crew members must mark READY first";
      } else {
        btnMpLaunch.style.display = "none";
      }
    }

    function showLiveAlert(type, player) {
      if (!player) return;
      const banner = document.getElementById("mp-live-alert-banner");
      const roleMap = {
        flight_director: "Flight Director (FLIGHT)",
        systems_engineer: "Propulsion & Systems (PROP)",
        science_officer: "Lead Science Officer (SCIENCE)",
        comms_officer: "Flight Dynamics & Comms (FDO)",
        crew_specialist: "Crew Specialist"
      };
      const roleName = roleMap[player.role] || player.role || "Crew Member";

      if (type === "leave") {
        if (window.SoundFX) {
          window.SoundFX.playLeave();
          window.SoundFX.speak(`${player.name} has left the room. Console is open.`);
        }
        if (banner) {
          banner.className = "mp-live-alert-banner alert-leave";
          banner.innerHTML = `<span>⚠️</span> <span><strong>${player.name}</strong> left the mission room. The <em>${roleName}</em> console is now vacant!</span>`;
          banner.style.display = "flex";
        }

        // Pulse the vacated console with red-amber highlight
        const cardSuffix = getRoleCardSuffix(player.role);
        const cardEl = document.getElementById(`role-card-${cardSuffix}`);
        if (cardEl) {
          cardEl.classList.add("role-vacated-flash");
          setTimeout(() => cardEl.classList.remove("role-vacated-flash"), 2500);
        }
      } else if (type === "join") {
        if (window.SoundFX) {
          window.SoundFX.playJoin();
          window.SoundFX.speak(`${player.name} has connected to mission control.`);
        }
        if (banner) {
          banner.className = "mp-live-alert-banner alert-join";
          banner.innerHTML = `<span>🛰️</span> <span><strong>${player.name}</strong> connected to flight loop as <em>${roleName}</em>!</span>`;
          banner.style.display = "flex";
        }
      }

      if (banner) {
        clearTimeout(banner._hideTimer);
        banner._hideTimer = setTimeout(() => {
          banner.style.display = "none";
        }, 6000);
      }
    }

    function renderChatMessages(messages = []) {
      const lobbyChat = document.getElementById("mp-chat-messages");
      const drawerChat = document.getElementById("flight-drawer-messages");
      if (lobbyChat) lobbyChat.innerHTML = "";
      if (drawerChat) drawerChat.innerHTML = "";

      messages.forEach(msg => appendChatMessage(msg, false));
      if (lobbyChat) lobbyChat.scrollTop = lobbyChat.scrollHeight;
      if (drawerChat) drawerChat.scrollTop = drawerChat.scrollHeight;
    }

    function appendChatMessage(msg, scroll = true) {
      const lobbyChat = document.getElementById("mp-chat-messages");
      const drawerChat = document.getElementById("flight-drawer-messages");

      const rowHtml = `
        <div class="chat-row">
          <span class="chat-time">[${msg.time || ""}]</span>
          <span class="chat-sender ${msg.role || "crew"}">${msg.sender}:</span>
          <span class="chat-text">${msg.text}</span>
        </div>
      `;

      if (lobbyChat) {
        lobbyChat.insertAdjacentHTML("beforeend", rowHtml);
        if (scroll) lobbyChat.scrollTop = lobbyChat.scrollHeight;
      }
      if (drawerChat) {
        drawerChat.insertAdjacentHTML("beforeend", rowHtml);
        if (scroll) drawerChat.scrollTop = drawerChat.scrollHeight;
      }
    }

    // Auto-detect ?room= URL parameter on load
    try {
      if (typeof window !== "undefined" && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const roomQuery = urlParams.get("room");
        if (roomQuery) {
          showScreen("screen-multiplayer");
          const joinInput = document.getElementById("mp-join-code");
          if (joinInput) {
            joinInput.value = roomQuery.trim().toUpperCase();
          }
        }
      }
    } catch (e) {}
  }

  // PUBLIC INITIALIZATION
  function init() {
    initDOMElements();
    setupTitleScreen();
    setupTeamScreen();
    setupDesignTabs();
    setupReviewScreen();
    setupArcadeScreen();
    setupSimControls();
    setupResultsScreen();
    setupTutorialScreen();
    setupMultiplayerUI();

    // Default screen
    showScreen("screen-title");
    console.log("[MissionControl] GameUI initialized successfully");
  }

  return {
    init,
    showScreen,
    updateDesignState
  };
})();

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", function () {
  window.GameUI.init();
});
