# 🛰️ Mission Control: Space Mission Design Game

An interactive, educational space mission engineering simulator inspired by the **NASA Systems Engineering Handbook**, **GMAT (General Mission Analysis Tool)**, and real-world aerospace trade studies.

---

## 🚀 Overview

Designing a space mission requires managing deeply interconnected trade-offs: scientific return, structural mass, electrical power, telemetry link budgets, orbital mechanics, launch vehicle lift capacities, and finite financial budgets. 

**Mission Control** bridges the gap between theoretical aerospace concepts and hands-on mission design. Players can play solo or collaborate in teams of up to 4 discipline leads, designing and flying a complete space mission from Phase A concept definition through launch and multi-year orbital operations.

---

## 🌟 Key Features

### 0. NASA Mission Control Flight Operations Center (Starting Screen)
- **🌍 Photorealistic 3D Earth Globe (NASA Blue Marble & Black Marble):** Rotating authentic photographic 3D Earth with atmospheric blue Rayleigh scattering glow, semi-transparent real cloud layers, dynamic night-side electric city lights (NASA Black Marble), and specular ocean water glint. Features smooth mouse-tracking parallax tilt!
- **📡 Real-Time Flight Operations Status Ticker:**
  - Live UTC Greenwich Mean Time clock updating every second.
  - Active Deep Space Network (DSN) status: Goldstone 34M [AOS], Madrid 70M [Tracking], Canberra [Standby].
  - Real-time Space Weather conditions: Solar Flux Index 138, Geomagnetic Kp-index 2.0 (Quiet), Solar Wind 420 km/s.
- **🔊 Authentic NASA Apollo / Artemis Quindar Telemetry Tones:** Synthesized 2525 Hz radio squelch comms bursts on mission initialization!

### 1. Interactive 3D Spacecraft CAD / Blueprint Inspector (Design Studio)
- **🛰️ Live 3D Spacecraft CAD Inspector:** View your spacecraft assembling dynamically in real-time right in the Design Studio! As you select buses (CubeSat to Flagship), solar panels, RTG nuclear units, propulsion thrusters, antennas, and scientific payload instruments, the 3D model immediately updates.
- **📐 Holographic Wireframe Blueprint Mode:** Toggle with one click between realistic PBR materials (gold Kapton foil, solar arrays, thruster nozzles) and glowing cyan holographic engineering wireframe blueprints.
- **🖱️ 360° Free Orbit & Zoom:** Drag to inspect every subsystem deck in full 360 degrees, or scroll to zoom in close on instruments and antennas.

### 2. Kennedy Space Center 3D Launch Pad & Mach 1.0 Transonic Ascent
- **🏗️ LC-39A Launch Complex & Umbilical Tower:** Detailed 3D launch pad featuring the flame trench duct, steel truss Launch Umbilical Tower (LUT), crane, and swing arm.
- **⏱️ T-Minus 10s Countdown with Real NASA Voice:** Digitized countdown with audio pips and speech synthesis ("T-minus 10... sound suppression active... ignition start... 3, 2, 1, Liftoff!").
- **💨 Water Deluge Sound Suppression:** Massive white steam vapor clouds billowing from the launch pad trench before ignition.
- **⚡ Mach 1.0 Transonic Vapor Shock Cone:** Physical condensation Prandtl-Glauert shock collar appearing dynamically around the payload fairing as the rocket punches through the sound barrier at ~340 m/s!

### 3. NASA Houston MCC 2D Ground Track Orbit Map (AOS / LOS Stations)
- **🗺️ Real-Time Mercator Satellite Ground Track:** Live sinusoidal orbit trajectory plotted across the photographic NASA Earth map, tracking westward nodal regression (~22.5° per orbit) and orbital inclination.
- **📡 Global Tracking Stations & LOS Footprints:** Plots 5 real-world tracking stations:
  - **Goldstone 34M (USA)**, **Madrid 70M (Spain)**, and **Canberra 34M (Australia)** (NASA Deep Space Network).
  - **Svalbard Satellite Station (Norway)** (Polar tracking facility).
  - **Wallops Flight Facility (USA)** (Near-Earth network).
- **📶 Dynamic AOS / LOS Acquisition Logic:** Carrier lock indicator turns glowing green during AOS (Acquisition of Signal) with boosted downlink rates (+2.2 GB/s) and connects a 3D laser downlink beam; displays live countdown timers to the next ground pass during LOS (Loss of Signal).

### 4. Orbital Solar Eclipse (Umbra/Penumbra) & Deep Freezing Thermal Shock
- **🌑 Physical 3D Earth Shadow Cone (Umbra & Penumbra):** Real-time ray-cylinder intersection checks detect when the satellite passes behind Earth into deep shadow.
- **⚡ Solar Generation Plunge & Battery Shift:** Solar panels drop to **0.0 Watts** in Umbra, forcing the spacecraft onto internal battery reserves.
- **❄️ Thermal Shock Dynamics (-138°C to +115°C):** Spacecraft core temperature plunges from +115°C down into deep freezing vacuum conditions.
- **🔥 Automated Survival Electric Heaters:** Heaters automatically engage when temperature falls below 0°C to protect critical avionics and propellant lines from cold-soak freezing.
- **🌅 Radiant Orbital Sunrise:** Blinding horizon dawn bloom sweeps across the screen as the spacecraft emerges into sunlight, accompanied by mission control audio announcements.

### 5. Industry-Grade Flight Operations & Advanced Aerospace Systems
- **🖥️ Master Flight Operations View Switcher:**
  - One-click seamless switching between 5 dedicated mission control console views:
    1. **🖥️ Split Console (Default):** Dual-column mission control dashboard showing the 3D Flight Window, 2D Houston MCC Ground Track, and MOC Oscilloscope together on one screen without scrolling!
    2. **🚀 3D Simulator:** Maximized immersive WebGL aerospace flight viewport with Navball, Telemetry HUD, and PIP RocketCam.
    3. **🗺️ Ground Track [M]:** Expanded Houston MCC 2D World Map with tracking station footprints and sub-satellite coordinates.
    4. **📈 Oscilloscope:** Enlarged 4-channel real-time telemetry oscilloscope strip chart.
    5. **📹 RocketCam Optical:** Full high-resolution onboard optical camera downlink feed.
- **🎥 6 Instant 3D Camera Angles & Free Mouse Orbit:**
  - **`[1]` Chase Cam:** Direct rear chase view along the flight corridor.
  - **`[2]` Wide Orbit:** Grand panoramic overview of Earth, spacecraft, and full Keplerian orbit ellipse.
  - **`[3]` Science Nadir:** Telescopic camera pointing straight down to Earth continents and cyclone targets.
  - **`[4]` Cockpit / FPV:** Pilot forward view along the velocity vector.
  - **`[5]` Earth Panoramic:** Deep-space view capturing the full illuminated Earth globe.
  - **`[6]` 360° Auto-Orbit:** Hands-free cinematic slow rotation orbiting around the spacecraft.
- **🛡️ Safe Exploration Mode & Fail-Safe Recovery:**
  - Integrated **Safe View Mode (`ON` by default)**: Protects battery and health from depletion, letting players peacefully study and enjoy every single camera view, ground station, and telemetry channel without abrupt death or failures.
  - **Instant Revival:** If an anomaly or de-orbit event occurs, players can immediately revive (`[R]` or click) or restart (`[SPACE]`) without ever getting locked out.
- **🌌 Real-Time Keplerian Orbital Mechanics & Delta-V Maneuvers:**
  - Execute genuine orbital maneuvers: **`[W]` Prograde Burn** consumes $\Delta V$ to raise Apoapsis ($A_p$); **`[S]` Retrograde Burn** consumes $\Delta V$ to lower Periapsis ($P_e$).
  - **Dynamic 3D Keplerian Ellipse Morphing:** The 3D orbit wireframe and spacecraft trajectory dynamically reshape in real-time based on calculated semi-major axis $a$, semi-minor axis $b$, and focal offset $c$.
  - **🔥 Hypersonic Atmospheric Re-entry:** Lowering Periapsis below 100 km (Kármán line) triggers hypersonic shock physics, fiery 3D plasma cone envelopment, aerodynamic ablation heating, and RF radio blackout!
- **🧭 Authentic Flight Navball (8-Ball Attitude Director Indicator / ADI):**
  - High-precision aerospace ADI instrument rendered on the HUD displaying spacecraft pitch ladder rungs, roll tilt, artificial horizon, and celestial hemisphere division (deep aerospace cyan sky vs. terra-cotta brown Earth).
  - Dynamic **Prograde** ($\mathbf{v}$), **Retrograde** ($-\mathbf{v}$), and **Nadir** reticle markers tracking the spacecraft's instantaneous flight vector.
- **📹 Onboard "RocketCam / SpacecraftCam" Picture-in-Picture (PIP) Monitor:**
  - Live optical feed in the upper-right HUD with real-time video scanlines, recording indicator, and FOV 65° framing.
  - Displays dynamic rocket engine fire plume during ascent, and Earth limb curvature, solar array wings, and fiery plasma sheath during orbital re-entry.
- **🚨 NASA Red-Team In-Flight Emergency Anomaly System:**
  - Unscheduled high-risk anomalies occur requiring emergency operator intervention under intense countdown timers:
    - *Reaction Wheel Saturation:* Execute RCS momentum dump (`[R]`).
    - *Single-Event Upset (Cosmic Ray):* Reboot central avionics computer (`[R]`).
    - *Solar Array Gimbal Stall:* Reset drive actuator current (`[R]`).
    - *Ammonia Heat Pipe Overpressure:* Redirect active thermal loop (`[R]`).
  - Features audible master caution alarms and digitized NASA Capcom voice warnings.
- **📈 Houston MOC Multi-Channel Rolling Telemetry Strip Chart:**
  - Real-time 4-channel oscilloscope rolling strip chart tracking **CH-1 Battery** (Cyan), **CH-2 Core Temperature** (Magenta), **CH-3 RF Downlink Throughput** (Green), and **CH-4 Delta-V Reserve** (Orange).

### 5. Six Scientifically Grounded NASA Mission Scenarios
- **🌍 Sentinel-Earth Climate Monitor (LEO/SSO):** High-cadence polar monitoring of ice sheets, deforestation, and sea surface height.
- **🌀 StormWatch Geostationary Sentinel (GEO):** 24/7 hemispheric surveillance of severe cyclogenesis and hurricane eyewall dynamics from 35,786 km.
- **🌕 Artemis Lunar Resource Prospector (Lunar Polar):** Cold-trap water ice prospecting in permanently shadowed craters (PSRs) at the lunar South Pole.
- **🪐 Red Pioneer: Mars Reconnaissance & Water Hunt (Mars Orbit):** Deep interplanetary expedition searching for subsurface brine aquifers and atmospheric trace methane.
- **☄️ Aegis Asteroid Early Warning Interceptor (HEO/Deep Space):** Thermal infrared surveillance hunting hazardous Near-Earth Asteroids (NEOs) in the solar glare zone.
- **🔭 DeepView Cosmic Dawn Space Observatory (Sun-Earth L2):** Flagship cryogenic infrared telescope situated 1.5 million km away at the second Lagrange point.

### 6. Multi-Player Collaborative Stations (1–4 Players)
Enables collaborative team gameplay with distinct aerospace engineering responsibilities:
- **👨‍✈️ Mission Director / Systems Lead:** Overall mission strategy, budget management, launch vehicle procurement, and high-risk anomaly decision-making.
- **🔧 Chief Spacecraft Engineer:** Spacecraft bus structure, mass margins, electrical power balance, and propulsion delta-V.
- **🔬 Principal Science Investigator:** Scientific payload selection, instrument objective alignment, and telemetry return.
- **📡 Communications & Avionics Officer:** Attitude pointing stability (ADCS), link budget analysis, radio frequency bands, and ground station scheduling.

### 7. Deep Systems Engineering Trade Studies
- **Orbital Regimes:** LEO (400 km), SSO (600 km), MEO (2,000 km), GEO (35,786 km), HEO Molniya, Lunar Polar (100 km), Sun-Earth L2.
- **Spacecraft Buses:** CubeSat 12U, SmallSat ESPA-Class, Medium Observatory, and Flagship Heavy.
- **Payload Instruments (12 Sensors):** Wide-Field Cameras, Hi-Res Optical Telescopes, Hyperspectral Imagers, UV/IR/Mass Spectrometers, SAR Radar, Radar Altimeters, Magnetometers, and Particle Detectors.
- **Subsystems:** Power (GaAs Solar Arrays & RTGs), Thermal (MLI, Active fluid loops, Cryocoolers), C&DH Computers, ADCS (Spin, 3-Axis reaction wheels, Fine star trackers), Propulsion (Cold gas, Hydrazine, Ion engines), Antennas, RF Bands (UHF, S, X, Ka), and Ground Networks (Single station, Global network, NASA DSN).
- **Launchers:** Scout Small-lift, Pathfinder Medium, Workhorse Heavy, Titan Deep-Space, and Colossus Super-Heavy.

### 8. Real-Time Systems Margins & Diagnostics Engine
Tracks four vital systems engineering budgets in real-time:
- **💰 Fiscal Budget Margin:** Remaining budget vs. mission cost ceiling.
- **⚖️ Mass Lift Margin:** Spacecraft wet mass vs. launcher lift capacity to target orbital delta-V.
- **⚡ Electrical Power Balance:** Continuous generation vs. subsystem consumption (accounting for distance attenuation at Mars).
- **📡 Telemetry Link Budget:** Daily data generated vs. downlink throughput factoring ground pass duration.
- **⚠️ Diagnostic Alerts:** Detects pointing jitter mismatches, thermal hazards, payload limit breaches, and orbital energy deficits.

### 9. High-Fidelity 3D WebGL Flight & Mission Operations (Three.js)
The interactive flight mode renders a full **3D aerospace environment**:
- **🌍 Procedural 3D Celestial Bodies:**
  - **Earth:** High-res day textures with oceans and continents, dynamic night-side city lights, rotating semi-transparent cloud layers, and blue Rayleigh scattering atmospheric glow shaders.
  - **Moon:** Lunar mare basalt plains, highlands, and crater displacement rings.
  - **Mars:** Rust-orange regolith, Valles Marineris canyon, Olympus Mons, and dusty atmospheric haze.
  - **Sun-Earth L2:** Deep-space halo orbit with distant solar lighting and stars.
- **🚀 Procedural 3D Multi-Stage Rocket:**
  - Multi-stage cylindrical rocket with interstage rings, gimbal engine nozzles, and grid fins.
  - Billowing 3D particle fire exhaust plumes with dynamic lighting.
  - Physical 3D staging: Stage 1 decouples and falls away, fairing clamshell halves separate in vacuum to reveal the satellite!
- **🛰️ Procedural 3D NASA Spacecraft Model:**
  - Gold Kapton / MLI thermal foil bus with metallic equipment decks.
  - Photovoltaic silicon solar wings with sun-tracking gimbal rotation.
  - Parabolic high-gain antenna dish with feed horn pointing at ground stations.
  - Optical telescope with physical glass lens transmission and star trackers.
  - Volumetric 3D cyan laser scanning cone projecting down onto planetary targets.
  - Vibrant green 3D laser telemetry downlink tubes connecting directly to ground stations.
- **🎥 3D Camera Controls:**
  - **Orbit / Free-Look Controls:** Drag with mouse/touch to freely orbit 360° around the 3D spacecraft and planet; scroll to zoom in/out!
  - **Quick Camera Presets:** `[1]` Chase Cam, `[2]` Orbit Overview, `[3]` Science Telescope View.

### 6. Analytical Autopilot Simulation Mode
- Automated day-by-day telemetry engine for fast systems engineering evaluation.
- Variable simulation speeds: 1x Normal, 5x Fast, 20x Warp, and Step-by-Day.

### 7. NASA Post-Flight Evaluation & Debriefing
- **Composite Scoring (100 Pts):**
  - 🔬 **Science Return (40 Pts):** Objective fulfillment, sensor synergy, and data return.
  - ⚙️ **Systems Engineering & Margins (25 Pts):** Mass margins, power margins, pointing accuracy, and comms sufficiency.
  - 💰 **Fiscal Efficiency (20 Pts):** Budget compliance and cost control.
  - ⏳ **Operational Longevity (15 Pts):** Spacecraft survival, health degradation, and mission lifetime.
- **Letter Grades (A+ to F)** and **Mission Commendation Badges**.
- **Official NASA Mission Report:** Architecture review, recommendations, and comparison to real NASA missions (Landsat, GOES, LRO, MRO, JWST).
- **Export / Print:** One-click download of the complete mission debrief log.

---

## 🎮 How to Run

1. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
2. No build tools or package managers required — pure zero-dependency HTML5, CSS3, and JavaScript!
3. To serve locally over HTTP (optional):
   ```powershell
   # In PowerShell inside "d:\nasa 2":
   python -m http.server 8080
   # Then visit http://localhost:8080
   ```

---

## 📚 NASA Educational References
- **NASA Systems Engineering Handbook (SP-2016-6105)**
- **General Mission Analysis Tool (GMAT)** - NASA Goddard Space Flight Center
- **CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers**
- **Concept Maturity Levels (CML 1–4)** - NASA Jet Propulsion Laboratory (JPL)
