/**
 * Mission Control: Space Mission Design Game
 * High-Fidelity 3D WebGL Aerospace Simulation Engine (Three.js)
 * Features:
 * - Photorealistic Day/Night Earth Shader with Glowing City Lights on dark side
 * - Interactive 3D Spacecraft CAD / Blueprint Inspector in Design Studio
 * - Cape Canaveral / KSC 3D Launch Pad, LUT Tower & Transonic Mach-1 Vapor Cone
 * - 3D Multi-Stage Rocket Ascent, Particle Plumes, and Volumetric Laser Scans
 */

window.Space3D = (function () {
  "use strict";

  if (typeof THREE === "undefined") {
    console.error("[Space3D] Three.js not loaded!");
    return null;
  }

  // Active 3D Flight Engine State
  let renderer = null;
  let scene = null;
  let camera = null;
  let activeCanvas = null;
  let animId = null;
  let isRunning = false;

  // Scene Objects
  let planetMesh = null;
  let cloudsMesh = null;
  let atmosphereMesh = null;
  let earthDayNightUniforms = null;
  let sunLight = null;
  let ambientLight = null;
  let spacecraftGroup = null;
  let rocketGroup = null;
  let launchPadGroup = null;
  let vaporConeMesh = null;
  let orbitLineMesh = null;
  let starfieldPoints = null;

  // Camera Control state
  let cameraMode = "chase"; // 'chase', 'orbit', 'science', 'pad'
  let camTheta = 0;
  let camPhi = Math.PI / 4;
  let camDist = 35;
  let isPointerDown = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  // Dynamic Elements in 3D
  const particles3D = [];
  let scanConeMesh = null;
  let downlinkBeamMesh = null;

  // =========================================================================
  // TEXTURE FACTORY (PHOTOREALISTIC NASA BLUE/BLACK MARBLE & TEXTURES)
  // =========================================================================
  const TextureFactory = {
    getRealEarthDay() {
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.earthDay) {
        const tex = new THREE.TextureLoader().load(window.PhotorealisticTextures.earthDay);
        tex.anisotropy = 8;
        return tex;
      }
      return this.createFallbackEarthDay();
    },

    getRealEarthClouds() {
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.earthClouds) {
        const tex = new THREE.TextureLoader().load(window.PhotorealisticTextures.earthClouds);
        tex.anisotropy = 8;
        return tex;
      }
      return this.createFallbackClouds();
    },

    getRealEarthSpecular() {
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.earthSpecular) {
        const tex = new THREE.TextureLoader().load(window.PhotorealisticTextures.earthSpecular);
        tex.anisotropy = 8;
        return tex;
      }
      return null;
    },

    getRealEarthLights() {
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.earthLights) {
        const tex = new THREE.TextureLoader().load(window.PhotorealisticTextures.earthLights);
        tex.anisotropy = 8;
        return tex;
      }
      return null;
    },

    getRealMoon() {
      if (window.PhotorealisticTextures && window.PhotorealisticTextures.moon) {
        const tex = new THREE.TextureLoader().load(window.PhotorealisticTextures.moon);
        tex.anisotropy = 8;
        return tex;
      }
      return this.createFallbackMoon();
    },

    // Procedural Fallbacks
    createFallbackEarthDay() {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#012a4a"; ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = "#2d6a4f";
      ctx.beginPath(); ctx.ellipse(550, 220, 180, 100, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(260, 240, 90, 120, -0.2, 0, Math.PI * 2); ctx.fill();
      return new THREE.CanvasTexture(c);
    },

    createFallbackClouds() {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 1024, 512);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 0; i < 35; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 1024, 100 + Math.random() * 312, 50 + Math.random() * 60, 20 + Math.random() * 25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(c);
    },

    createFallbackMoon() {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#8d99ae"; ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "#4a5568";
      ctx.beginPath(); ctx.ellipse(220, 130, 80, 50, 0, 0, Math.PI * 2); ctx.fill();
      return new THREE.CanvasTexture(c);
    },

    createMars() {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#c1440e"; ctx.fillRect(0, 0, 1024, 512);
      ctx.fillStyle = "#7e2d09";
      ctx.beginPath(); ctx.ellipse(450, 260, 180, 80, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 25); ctx.fillRect(0, 487, 1024, 25);
      return new THREE.CanvasTexture(c);
    },

    createSolarPanel() {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0c2340"; ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "rgba(140, 200, 255, 0.6)"; ctx.lineWidth = 1;
      for (let x = 0; x <= 128; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke(); }
      for (let y = 0; y <= 128; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke(); }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 2);
      return tex;
    },

    createGoldFoil() {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#e5b700"; ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "rgba(90, 65, 0, 0.35)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 25; i++) {
        ctx.beginPath(); ctx.moveTo(Math.random() * 128, Math.random() * 128); ctx.lineTo(Math.random() * 128, Math.random() * 128); ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    }
  };

  // =========================================================================
  // DAY / NIGHT TERMINATOR EARTH SHADER (WITH GLOWING CITY LIGHTS)
  // =========================================================================
  function createDayNightEarthMaterial(sunDirVector) {
    const dayTex = TextureFactory.getRealEarthDay();
    const nightTex = TextureFactory.getRealEarthLights() || dayTex;
    const specTex = TextureFactory.getRealEarthSpecular() || dayTex;

    const uniforms = {
      dayTexture: { value: dayTex },
      nightTexture: { value: nightTex },
      specularMap: { value: specTex },
      sunDirection: { value: sunDirVector || new THREE.Vector3(1, 0.4, 0.8).normalize() }
    };

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D specularMap;
      uniform vec3 sunDirection;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 sunDir = normalize(sunDirection);
        float sunDot = dot(normal, sunDir);

        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);

        // Smooth day/night blend across twilight terminator
        float dayWeight = smoothstep(-0.15, 0.22, sunDot);
        float nightWeight = 1.0 - dayWeight;

        // Specular water glint for oceans
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 reflectDir = reflect(-sunDir, normal);
        float specAmount = pow(max(dot(viewDir, reflectDir), 0.0), 22.0);
        float isWater = texture2D(specularMap, vUv).r;
        vec3 specularColor = vec3(0.7, 0.85, 1.0) * specAmount * isWater * dayWeight * 1.5;

        // Combine daytime surface + glowing night city lights
        vec3 finalColor = (dayColor.rgb * (dayWeight * 0.95 + 0.05) + nightColor.rgb * nightWeight * 2.2) + specularColor;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });
    mat.userData = { uniforms };
    return mat;
  }

  // ATMOSPHERE RAYLEIGH SCATTERING SHADER
  function createAtmosphereShader(radius) {
    const vertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.70 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(0.0, 0.72, 1.0, 1.0) * intensity * 0.75;
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 48, 48), mat);
  }

  // =========================================================================
  // 3D MODEL BUILDER: CONFIGURABLE NASA SPACECRAFT
  // =========================================================================
  function buildSpacecraft(config = {}) {
    const group = new THREE.Group();
    const comps = config.components || {};
    const insts = config.instruments || [];

    // Title Demo mode fallback (for small background earth satellite)
    if (config.defaultDemo) {
      comps.bus = comps.bus || "medium-sat";
      comps.power = comps.power || "medium-solar";
      comps.antenna = comps.antenna || "hga";
      comps.propulsion = comps.propulsion || "chemical";
      if (!insts.length) insts.push("hires-cam");
    }

    // 0. STRICT REQUIREMENT: If user has not selected a bus yet, show empty assembly cradle
    if (!comps.bus) {
      const cradleGroup = new THREE.Group();

      // Hexagonal / circular cleanroom turntable base
      const baseGeo = new THREE.CylinderGeometry(2.8, 3.2, 0.22, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x16202c,
        roughness: 0.65,
        metalness: 0.8
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -2.1;
      cradleGroup.add(baseMesh);

      // Glowing turntable concentric cyan ring
      const ringGeo = new THREE.RingGeometry(2.0, 2.15, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -1.98;
      cradleGroup.add(ringMesh);

      // 4 Corner Docking Stanchions with amber alignment beacons
      const stanchionGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8);
      const stanchionMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5, metalness: 0.8 });
      const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffab00 });

      const corners = [
        [-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]
      ];
      corners.forEach(([cx, cz]) => {
        const st = new THREE.Mesh(stanchionGeo, stanchionMat);
        st.position.set(cx, -0.2, cz);
        cradleGroup.add(st);

        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(cx, 1.75, cz);
        cradleGroup.add(beacon);

        // Clamp arm pointing toward center
        const armGeo = new THREE.BoxGeometry(0.45, 0.08, 0.1);
        const arm = new THREE.Mesh(armGeo, stanchionMat);
        arm.position.set(cx > 0 ? cx - 0.22 : cx + 0.22, 0.4, cz);
        cradleGroup.add(arm);
      });

      // Holographic Unbuilt Wireframe Bounding Chassis
      const holoGeo = new THREE.BoxGeometry(2.5, 2.5, 3.2);
      const holoEdges = new THREE.EdgesGeometry(holoGeo);
      const holoMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.4
      });
      const holoBox = new THREE.LineSegments(holoEdges, holoMat);
      holoBox.position.set(0, 0, 0);
      cradleGroup.add(holoBox);

      // Central Holographic Target Reticle
      const targetGeo = new THREE.RingGeometry(0.5, 0.55, 24);
      const targetMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
      const targetRing = new THREE.Mesh(targetGeo, targetMat);
      targetRing.rotation.x = Math.PI / 2;
      targetRing.position.set(0, 0, 0);
      cradleGroup.add(targetRing);

      group.add(cradleGroup);
      group.userData = { isUnbuilt: true, cradleGroup };
      return group;
    }

    // Material definitions for configured hardware
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      roughness: 0.35,
      metalness: 0.85,
      map: TextureFactory.createGoldFoil()
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.25,
      metalness: 0.9
    });

    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1565c0,
      roughness: 0.2,
      metalness: 0.4,
      map: TextureFactory.createSolarPanel()
    });

    // 1. Bus Core Dimensions based on selected bus
    let busW = 3.0, busH = 3.0, busL = 3.8;
    if (comps.bus === "cubesat") { busW = 1.6; busH = 1.6; busL = 2.4; }
    else if (comps.bus === "small-sat") { busW = 2.4; busH = 2.4; busL = 3.0; }
    else if (comps.bus === "medium-sat") { busW = 3.0; busH = 3.0; busL = 3.8; }
    else if (comps.bus === "large-sat") { busW = 4.2; busH = 4.2; busL = 5.2; }

    const busGeo = new THREE.BoxGeometry(busW, busH, busL);
    const busMesh = new THREE.Mesh(busGeo, goldMat);
    busMesh.castShadow = true;
    busMesh.receiveShadow = true;
    group.add(busMesh);

    // Equipment Deck Ring
    const ringGeo = new THREE.TorusGeometry(busW * 0.55, 0.08, 12, 24);
    const ring = new THREE.Mesh(ringGeo, metalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = busL * 0.25;
    group.add(ring);

    // Cleanroom mounting cradle ring beneath spacecraft bus
    const cradleBaseGeo = new THREE.CylinderGeometry(busW * 0.85, busW * 0.95, 0.15, 16);
    const cradleBaseMat = new THREE.MeshStandardMaterial({ color: 0x1f2a3a, roughness: 0.6, metalness: 0.8 });
    const cradleBase = new THREE.Mesh(cradleBaseGeo, cradleBaseMat);
    cradleBase.position.y = -busH * 0.5 - 0.12;
    group.add(cradleBase);

    // 2. Power Subsystem (Solar Arrays vs RTG) - ONLY rendered if chosen!
    let leftWing = null, rightWing = null;
    if (comps.power === "rtg") {
      // Nuclear RTG Cylinder with cooling fins and radiator
      const rtgGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.2, 16);
      const rtgMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.7 });
      const rtgMesh = new THREE.Mesh(rtgGeo, rtgMat);
      rtgMesh.position.set(-busW * 0.75, 0, 0);

      // Cooling fins
      for (let f = 0; f < 6; f++) {
        const finGeo = new THREE.BoxGeometry(0.04, 2.0, 0.32);
        const fin = new THREE.Mesh(finGeo, metalMat);
        const ang = (f * Math.PI) / 3;
        fin.position.set(Math.cos(ang) * 0.68, 0, Math.sin(ang) * 0.68);
        fin.rotation.y = ang;
        rtgMesh.add(fin);
      }

      // Warm amber/orange nuclear glow core indicator
      const glowGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.9, 12);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      rtgMesh.add(glow);

      // Mounting boom
      const rtgBoomGeo = new THREE.CylinderGeometry(0.08, 0.08, busW * 0.3);
      const rtgBoom = new THREE.Mesh(rtgBoomGeo, metalMat);
      rtgBoom.rotation.z = Math.PI / 2;
      rtgBoom.position.set(-busW * 0.5 - (busW * 0.15), 0, 0);
      group.add(rtgBoom);

      group.add(rtgMesh);
    } else if (comps.power === "small-solar" || comps.power === "medium-solar" || comps.power === "large-solar") {
      // Solar Wings (Deployable Photovoltaic Arrays)
      let span = 4.8;
      if (comps.power === "small-solar") span = 3.2;
      else if (comps.power === "large-solar") span = 7.4;

      const solarWingGeo = new THREE.BoxGeometry(span, 0.1, 1.8);

      leftWing = new THREE.Mesh(solarWingGeo, solarMat);
      leftWing.position.set(-(busW / 2 + span / 2 + 0.5), 0, 0);
      leftWing.castShadow = true;
      group.add(leftWing);

      rightWing = new THREE.Mesh(solarWingGeo, solarMat);
      rightWing.position.set(busW / 2 + span / 2 + 0.5, 0, 0);
      rightWing.castShadow = true;
      group.add(rightWing);

      // Structural hinge booms
      const boomGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.65);
      const b1 = new THREE.Mesh(boomGeo, metalMat);
      b1.rotation.z = Math.PI / 2;
      b1.position.set(-(busW / 2 + 0.3), 0, 0);
      group.add(b1);

      const b2 = new THREE.Mesh(boomGeo, metalMat);
      b2.rotation.z = Math.PI / 2;
      b2.position.set(busW / 2 + 0.3, 0, 0);
      group.add(b2);
    }

    // 3. Telecommunications Antenna - ONLY rendered if chosen!
    let dishMesh = null;
    if (comps.antenna === "hga" || comps.antenna === "parabolic") {
      // High-Gain Parabolic Dish
      const dishRadius = comps.antenna === "hga" ? 1.5 : 1.0;
      const dishGeo = new THREE.SphereGeometry(dishRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
      const dishMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = -Math.PI / 2;
      dishMesh.position.set(0, busH * 0.5 + 0.75, 0);

      const hornGeo = new THREE.CylinderGeometry(0.04, 0.1, 0.6);
      const horn = new THREE.Mesh(hornGeo, metalMat);
      horn.position.set(0, 0, 0.35);
      horn.rotation.x = Math.PI / 2;
      dishMesh.add(horn);

      // Gimbal mast pedestal
      const mastGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7);
      const mast = new THREE.Mesh(mastGeo, metalMat);
      mast.position.set(0, busH * 0.5 + 0.35, 0);
      group.add(mast);

      group.add(dishMesh);
    } else if (comps.antenna === "patch") {
      // Conformal Phased-Array Patch Antenna Plate
      const patchGeo = new THREE.BoxGeometry(0.9, 0.08, 0.9);
      const patch = new THREE.Mesh(patchGeo, metalMat);
      patch.position.set(0, busH * 0.51, 0);
      group.add(patch);
    } else if (comps.antenna === "dipole") {
      // Dual Deployable Whip Antennas
      const whipGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2);
      const whip1 = new THREE.Mesh(whipGeo, metalMat);
      whip1.rotation.z = Math.PI / 4;
      whip1.position.set(busW * 0.45, busH * 0.5 + 0.8, 0);
      group.add(whip1);

      const whip2 = new THREE.Mesh(whipGeo, metalMat);
      whip2.rotation.z = -Math.PI / 4;
      whip2.position.set(-busW * 0.45, busH * 0.5 + 0.8, 0);
      group.add(whip2);
    }

    // 4. Propulsion Thruster Nozzle - ONLY rendered if chosen!
    let nozzle = null;
    if (comps.propulsion && comps.propulsion !== "no-prop") {
      if (comps.propulsion === "ion") {
        // High-Efficiency Xenon Ion Thruster with glowing cyan plasma ring
        const chamberGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.8, 20);
        const chamberMat = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.3, metalness: 0.9 });
        nozzle = new THREE.Mesh(chamberGeo, chamberMat);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(0, 0, -busL * 0.5 - 0.4);

        // Glowing cyan plasma ionization ring
        const plasmaGeo = new THREE.RingGeometry(0.2, 0.45, 24);
        const plasmaMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
        const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
        plasmaMesh.position.set(0, -0.41, 0);
        plasmaMesh.rotation.x = Math.PI / 2;
        nozzle.add(plasmaMesh);

        group.add(nozzle);
      } else if (comps.propulsion === "chemical") {
        // Flared Chemical Rocket Bell Nozzle
        const nozGeo = new THREE.ConeGeometry(0.58, 1.0, 20, 1, true);
        const nozMat = new THREE.MeshStandardMaterial({
          color: 0x212121,
          roughness: 0.4,
          metalness: 0.85,
          side: THREE.DoubleSide
        });
        nozzle = new THREE.Mesh(nozGeo, nozMat);
        nozzle.rotation.x = Math.PI;
        nozzle.position.set(0, 0, -busL * 0.5 - 0.55);

        // Niobium throat ring
        const throatGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 16);
        const throat = new THREE.Mesh(throatGeo, metalMat);
        throat.rotation.x = Math.PI / 2;
        throat.position.set(0, 0, -busL * 0.5 - 0.12);
        group.add(throat);

        group.add(nozzle);
      } else if (comps.propulsion === "cold-gas") {
        // Quad Cold-Gas RCS Clusters
        const corners = [
          [-busW * 0.45, -busH * 0.45],
          [busW * 0.45, -busH * 0.45],
          [-busW * 0.45, busH * 0.45],
          [busW * 0.45, busH * 0.45]
        ];
        corners.forEach(([cx, cy]) => {
          const rcsGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const rcsBlock = new THREE.Mesh(rcsGeo, metalMat);
          rcsBlock.position.set(cx, cy, -busL * 0.5 - 0.1);
          group.add(rcsBlock);
        });
      }
    }

    // 5. Avionics & Attitude Subsystem (Star Trackers)
    if (comps.attitude || comps.computer) {
      const trackerGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.4, 12);
      const trackerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
      
      const st1 = new THREE.Mesh(trackerGeo, trackerMat);
      st1.rotation.x = Math.PI / 4;
      st1.position.set(busW * 0.4, busH * 0.48, busL * 0.3);
      group.add(st1);

      const st2 = new THREE.Mesh(trackerGeo, trackerMat);
      st2.rotation.x = -Math.PI / 4;
      st2.position.set(-busW * 0.4, busH * 0.48, busL * 0.3);
      group.add(st2);
    }

    // 6. Scientific Instruments - ONLY rendered if selected!
    // 6.1. Optical Telescopes / Cameras (wide-cam, hires-cam, hyper-img)
    if (insts.some(i => i.includes("cam") || i.includes("img"))) {
      const scopeRadius = insts.includes("hires-cam") ? 0.72 : 0.52;
      const scopeLen = insts.includes("hires-cam") ? 1.8 : 1.3;
      const scopeGeo = new THREE.CylinderGeometry(scopeRadius, scopeRadius * 0.9, scopeLen, 24);
      const scopeMesh = new THREE.Mesh(scopeGeo, metalMat);
      scopeMesh.rotation.x = Math.PI / 2;
      scopeMesh.position.set(0, -busH * 0.15, busL * 0.5 + scopeLen * 0.5);

      // Cyan glossy glass entrance aperture
      const lensGeo = new THREE.CircleGeometry(scopeRadius * 0.88, 24);
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0x00e5ff,
        roughness: 0.05,
        transmission: 0.9,
        ior: 1.5
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, scopeLen * 0.5 + 0.01, 0);
      lens.rotation.x = -Math.PI / 2;
      scopeMesh.add(lens);

      group.add(scopeMesh);
    }

    // 6.2. Synthetic Aperture Radar / Radar Altimeter (sar, radar-alt)
    if (insts.includes("sar") || insts.includes("radar-alt")) {
      const sarGeo = new THREE.BoxGeometry(busW * 1.6, 1.4, 0.12);
      const sarMat = new THREE.MeshStandardMaterial({
        color: 0xdcdcdc,
        roughness: 0.4,
        metalness: 0.6
      });
      const sarMesh = new THREE.Mesh(sarGeo, sarMat);
      sarMesh.position.set(0, -busH * 0.65, 0);
      group.add(sarMesh);
    }

    // 6.3. Magnetometer Boom Arm (magnetometer)
    if (insts.includes("magnetometer")) {
      const magBoomGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.2);
      const magBoom = new THREE.Mesh(magBoomGeo, metalMat);
      magBoom.rotation.z = Math.PI / 3;
      magBoom.position.set(busW * 0.75, busH * 0.75, -busL * 0.35);

      const sensorSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), goldMat);
      sensorSphere.position.set(0, 2.65, 0);
      magBoom.add(sensorSphere);
      group.add(magBoom);
    }

    // 6.4. Spectrometer Instruments (uv-spec, ir-spec, mass-spec)
    if (insts.some(i => i.includes("spec"))) {
      const specBoxGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
      const specBoxMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.3, metalness: 0.8 });
      const specBox = new THREE.Mesh(specBoxGeo, specBoxMat);
      specBox.position.set(busW * 0.48, -busH * 0.2, busL * 0.2);

      // Gold cryogenic sensor window
      const winGeo = new THREE.CircleGeometry(0.2, 16);
      const win = new THREE.Mesh(winGeo, goldMat);
      win.rotation.y = Math.PI / 2;
      win.position.set(0.46, 0, 0);
      specBox.add(win);

      group.add(specBox);
    }

    // 6.5. Plasma / Cosmic Ray Sensors (plasma, cosmic-ray)
    if (insts.includes("plasma") || insts.includes("cosmic-ray")) {
      const cupGeo = new THREE.CylinderGeometry(0.25, 0.15, 0.5, 16);
      const cupMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.3, metalness: 0.9 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.rotation.z = -Math.PI / 2;
      cup.position.set(-busW * 0.52, busH * 0.2, -busL * 0.1);
      group.add(cup);
    }

    group.userData = { leftWing, rightWing, dishMesh, nozzle };
    return group;
  }

  // =========================================================================
  // 3D MODEL BUILDER: KENNEDY SPACE CENTER LAUNCH PAD & TOWER
  // =========================================================================
  function buildLaunchPad3D() {
    const group = new THREE.Group();

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.9, metalness: 0.1 });
    const steelRedMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.4, metalness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.4, metalness: 0.7 });

    // 1. Concrete Pad Mount
    const mountGeo = new THREE.BoxGeometry(22, 4, 22);
    const mountMesh = new THREE.Mesh(mountGeo, concreteMat);
    mountMesh.position.y = -15;
    group.add(mountMesh);

    // Flame Trench Duct Cutout
    const trenchGeo = new THREE.BoxGeometry(6, 6, 24);
    const trenchMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const trenchMesh = new THREE.Mesh(trenchGeo, trenchMat);
    trenchMesh.position.set(0, -15, 0);
    group.add(trenchMesh);

    // 2. Launch Umbilical Tower (LUT Red Steel Truss)
    const towerGeo = new THREE.BoxGeometry(3.5, 30, 3.5);
    const towerMesh = new THREE.Mesh(towerGeo, steelRedMat);
    towerMesh.position.set(-6, 0, 0);
    group.add(towerMesh);

    // Crane Arm at top of tower
    const craneGeo = new THREE.BoxGeometry(8, 1, 1.2);
    const craneMesh = new THREE.Mesh(craneGeo, steelRedMat);
    craneMesh.position.set(-4, 15.5, 0);
    group.add(craneMesh);

    // Crew Access Arm / Swing Arm
    const armGeo = new THREE.BoxGeometry(5.5, 0.8, 1.0);
    const armMesh = new THREE.Mesh(armGeo, steelRedMat);
    armMesh.position.set(-3.5, 6, 0);
    group.add(armMesh);

    // 3. Sound Suppression Water Nozzle Manifolds
    for (let i = -1; i <= 1; i += 2) {
      const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 4);
      const pipe = new THREE.Mesh(pipeGeo, metalMat);
      pipe.position.set(i * 3.5, -13, 0);
      group.add(pipe);
    }

    return group;
  }

  // TRANSONIC MACH-1 CONDENSATION VAPOR SHOCK CONE
  function createVaporCone3D() {
    const coneGeo = new THREE.ConeGeometry(2.8, 2.5, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.rotation.x = Math.PI;
    mesh.position.y = 8.5;
    mesh.visible = false;
    return mesh;
  }

  // =========================================================================
  // 3D MODEL BUILDER: NASA ROCKET
  // =========================================================================
  function buildRocket(config) {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4, metalness: 0.6 });

    // Stage 1 Booster
    const stage1Geo = new THREE.CylinderGeometry(1.4, 1.4, 14, 24);
    const stage1Mesh = new THREE.Mesh(stage1Geo, whiteMat);
    stage1Mesh.position.y = -7;
    group.add(stage1Mesh);

    // Engine Nozzles
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const nozGeo = new THREE.ConeGeometry(0.35, 0.9, 16, 1, true);
      const noz = new THREE.Mesh(nozGeo, darkMat);
      noz.position.set(Math.cos(a) * 0.7, -14.4, Math.sin(a) * 0.7);
      noz.rotation.x = Math.PI;
      group.add(noz);
    }

    // Interstage Ring
    const interGeo = new THREE.CylinderGeometry(1.42, 1.42, 1.2, 24);
    const interMesh = new THREE.Mesh(interGeo, darkMat);
    interMesh.position.y = 0.6;
    group.add(interMesh);

    // Stage 2 Upper Stage
    const stage2Geo = new THREE.CylinderGeometry(1.4, 1.4, 6, 24);
    const stage2Mesh = new THREE.Mesh(stage2Geo, whiteMat);
    stage2Mesh.position.y = 4.2;
    group.add(stage2Mesh);

    // Fairing Base & Cone
    const fairingBaseGeo = new THREE.CylinderGeometry(1.6, 1.4, 2, 24);
    const fairingBase = new THREE.Mesh(fairingBaseGeo, whiteMat);
    fairingBase.position.y = 8.2;
    group.add(fairingBase);

    const fairingConeGeo = new THREE.ConeGeometry(1.6, 4.5, 24);
    const fairingCone = new THREE.Mesh(fairingConeGeo, whiteMat);
    fairingCone.position.y = 11.45;
    group.add(fairingCone);

    // Mach-1 Transonic Vapor Shock Cone
    vaporConeMesh = createVaporCone3D();
    group.add(vaporConeMesh);

    group.userData = { stage1Mesh, stage2Mesh, fairingCone, fairingBase, vaporConeMesh };
    return group;
  }

  // =========================================================================
  // INITIALIZE 3D SCENE & RENDERER FOR FLIGHT
  // =========================================================================
  function init(canvasElement) {
    if (!canvasElement) return false;
    activeCanvas = canvasElement;

    const width = canvasElement.clientWidth || 960;
    const height = canvasElement.clientHeight || 540;

    renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2500);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    ambientLight = new THREE.AmbientLight(0x1a2634, 0.65);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfff8ee, 1.7);
    sunLight.position.set(80, 30, 90);
    sunLight.castShadow = true;
    scene.add(sunLight);

    buildStarfield();
    setupPointerControls(canvasElement);

    return true;
  }

  function buildStarfield() {
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorVal = 0.8 + Math.random() * 0.2;
      colors[i * 3] = colorVal;
      colors[i * 3 + 1] = colorVal;
      colors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.85 });
    starfieldPoints = new THREE.Points(starGeo, starMat);
    scene.add(starfieldPoints);
  }

  // =========================================================================
  // SETUP CELESTIAL ENVIRONMENT (EARTH / MOON / MARS)
  // =========================================================================
  function setupCelestialBody(orbitType) {
    if (planetMesh) scene.remove(planetMesh);
    if (cloudsMesh) scene.remove(cloudsMesh);
    if (atmosphereMesh) scene.remove(atmosphereMesh);

    const planetRadius = 40;

    if (orbitType === "lunar") {
      const moonMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.getRealMoon(),
        roughness: 0.85,
        metalness: 0.1
      });
      planetMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 48, 48), moonMat);
      planetMesh.position.set(0, -planetRadius - 15, 0);
      planetMesh.receiveShadow = true;
      scene.add(planetMesh);

    } else if (orbitType === "mars" || orbitType === "red-pioneer") {
      const marsMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.createMars(),
        roughness: 0.8,
        metalness: 0.15
      });
      planetMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 48, 48), marsMat);
      planetMesh.position.set(0, -planetRadius - 15, 0);
      planetMesh.receiveShadow = true;
      scene.add(planetMesh);

      atmosphereMesh = createAtmosphereShader(planetRadius);
      atmosphereMesh.position.copy(planetMesh.position);
      scene.add(atmosphereMesh);

    } else {
      // REAL EARTH WITH DAY/NIGHT TERMINATOR & CITY LIGHTS
      const sunDir = sunLight ? sunLight.position.clone().normalize() : new THREE.Vector3(1, 0.4, 0.8).normalize();
      const earthMat = createDayNightEarthMaterial(sunDir);
      earthDayNightUniforms = earthMat.userData.uniforms;

      planetMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 64, 64), earthMat);
      planetMesh.position.set(0, -planetRadius - 15, 0);
      planetMesh.receiveShadow = true;
      scene.add(planetMesh);

      // Clouds Layer
      const cloudMat = new THREE.MeshPhongMaterial({
        map: TextureFactory.getRealEarthClouds(),
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius + 0.35, 48, 48), cloudMat);
      cloudsMesh.position.copy(planetMesh.position);
      scene.add(cloudsMesh);

      // Atmosphere Glow
      atmosphereMesh = createAtmosphereShader(planetRadius);
      atmosphereMesh.position.copy(planetMesh.position);
      scene.add(atmosphereMesh);
    }
  }

  function setupOrbitLine(radiusX = 55, radiusZ = 55) {
    if (orbitLineMesh) scene.remove(orbitLineMesh);
    const points = [];
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radiusX, 0, Math.sin(theta) * radiusZ));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.45 });
    orbitLineMesh = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLineMesh);
  }

  let reentryPlasmaMesh = null;

  function updateOrbitGeometry(radiusA, radiusP, inc = 28.5) {
    if (!scene) return;
    if (orbitLineMesh) scene.remove(orbitLineMesh);
    const points = [];
    const segments = 128;
    const a = (radiusA + radiusP) / 2;
    const b = Math.sqrt(Math.max(1, radiusA * radiusP));
    const c = a - radiusP;
    const incRad = (inc * Math.PI) / 180;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const px = Math.cos(theta) * a - c;
      const pz = Math.sin(theta) * b;
      const py = Math.sin(theta) * b * Math.sin(incRad);
      points.push(new THREE.Vector3(px, py, pz));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const isReentryWarning = radiusP < 46;
    const orbitMat = new THREE.LineBasicMaterial({
      color: isReentryWarning ? 0xff3d00 : 0x00e5ff,
      transparent: true,
      opacity: isReentryWarning ? 0.75 : 0.45
    });
    orbitLineMesh = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLineMesh);
  }

  function setReentryPlasma(visible) {
    if (!spacecraftGroup) return;
    if (visible) {
      if (!reentryPlasmaMesh) {
        const coneGeo = new THREE.ConeGeometry(2.4, 5.0, 16, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
          color: 0xff3d00,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide
        });
        reentryPlasmaMesh = new THREE.Mesh(coneGeo, coneMat);
        reentryPlasmaMesh.rotation.x = Math.PI / 2;
        reentryPlasmaMesh.position.set(0, 0, -1.8);
        spacecraftGroup.add(reentryPlasmaMesh);
      }
      reentryPlasmaMesh.visible = true;
      reentryPlasmaMesh.material.opacity = 0.5 + Math.random() * 0.4;
      const s = 1.0 + (Math.random() - 0.5) * 0.25;
      reentryPlasmaMesh.scale.set(s, s, s);
    } else {
      if (reentryPlasmaMesh) reentryPlasmaMesh.visible = false;
    }
  }

  // =========================================================================
  // LASER SCAN CONES & DOWNLINK BEAMS
  // =========================================================================
  function showScanCone(originPos, targetPos) {
    if (scanConeMesh) scene.remove(scanConeMesh);
    const dist = originPos.distanceTo(targetPos);
    const coneGeo = new THREE.ConeGeometry(7, dist, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    scanConeMesh = new THREE.Mesh(coneGeo, coneMat);
    scanConeMesh.position.copy(originPos).lerp(targetPos, 0.5);
    scanConeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPos.clone().sub(originPos).normalize());
    scene.add(scanConeMesh);
    setTimeout(() => { if (scanConeMesh) scene.remove(scanConeMesh); }, 600);
  }

  function showDownlinkBeam(satPos, gsPos) {
    if (downlinkBeamMesh) scene.remove(downlinkBeamMesh);
    const curve = new THREE.LineCurve3(satPos, gsPos);
    const beamGeo = new THREE.TubeGeometry(curve, 10, 0.25, 8, false);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.75 });
    downlinkBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    scene.add(downlinkBeamMesh);
    setTimeout(() => { if (downlinkBeamMesh) scene.remove(downlinkBeamMesh); }, 400);
  }

  // =========================================================================
  // 3D PARTICLES (FIRE, SMOKE & WATER SOUND SUPPRESSION STEAM)
  // =========================================================================
  function addRocketExhaust(pos, dir, count = 4, isSteam = false) {
    for (let i = 0; i < count; i++) {
      const spread = isSteam ? 1.2 : 0.4;
      const vx = dir.x * (isSteam ? 1.2 : 2.5) + (Math.random() - 0.5) * spread;
      const vy = dir.y * (isSteam ? 0.8 : 2.5) + (Math.random() - 0.5) * spread;
      const vz = dir.z * (isSteam ? 1.2 : 2.5) + (Math.random() - 0.5) * spread;

      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(isSteam ? 1.2 : (0.35 + Math.random() * 0.3), 8, 8),
        new THREE.MeshBasicMaterial({
          color: isSteam ? 0xeeeeee : (Math.random() < 0.6 ? 0xff5722 : 0xffc107),
          transparent: true,
          opacity: isSteam ? 0.7 : 0.9
        })
      );
      pMesh.position.copy(pos);
      scene.add(pMesh);

      particles3D.push({
        mesh: pMesh,
        vel: new THREE.Vector3(vx, vy, vz),
        life: isSteam ? 40 : 25,
        maxLife: isSteam ? 40 : 25
      });
    }
  }

  function updateParticles3D() {
    for (let i = particles3D.length - 1; i >= 0; i--) {
      const p = particles3D[i];
      p.mesh.position.add(p.vel);
      p.life--;
      p.mesh.scale.multiplyScalar(1.04);
      p.mesh.material.opacity = p.life / p.maxLife;

      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles3D.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // MOUSE DRAG & ZOOM CONTROLS
  // =========================================================================
  function setupPointerControls(canvas) {
    const onDown = (x, y) => { isPointerDown = true; prevMouseX = x; prevMouseY = y; };
    const onMove = (x, y) => {
      if (!isPointerDown) return;
      const dx = x - prevMouseX;
      const dy = y - prevMouseY;
      camTheta -= dx * 0.008;
      camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi - dy * 0.008));
      prevMouseX = x; prevMouseY = y;
    };
    const onUp = () => { isPointerDown = false; };

    const hud = typeof document !== "undefined" ? document.getElementById("game-canvas-hud") : null;
    const targets = hud ? [canvas, hud] : [canvas];

    targets.forEach(t => {
      if (!t || !t.addEventListener) return;
      t.addEventListener("mousedown", e => onDown(e.clientX, e.clientY));
      t.addEventListener("touchstart", e => {
        if (e.touches && e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      t.addEventListener("wheel", e => {
        if (e.preventDefault) e.preventDefault();
        camDist = Math.max(12, Math.min(160, camDist + e.deltaY * 0.05));
      }, { passive: false });
    });

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("mousemove", e => onMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", e => {
        if (e.touches && e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener("touchend", onUp);
    }
  }

  function setCameraMode(mode) {
    cameraMode = mode;
    if (mode === "chase") { camDist = 28; camTheta = 0; camPhi = Math.PI / 2.7; }
    else if (mode === "science") { camDist = 20; camTheta = 0; camPhi = 0.08; }
    else if (mode === "orbit") { camDist = 110; camTheta = Math.PI / 3.5; camPhi = Math.PI / 3.8; }
    else if (mode === "fpv") { camDist = 7; camTheta = Math.PI; camPhi = Math.PI / 2; }
    else if (mode === "earth") { camDist = 150; camTheta = Math.PI / 2; camPhi = Math.PI / 2.2; }
    else if (mode === "autorotate") { camDist = 45; camPhi = Math.PI / 3; }
  }

  // =========================================================================
  // TITLE SCREEN INTERACTIVE 3D EARTH (PHOTOREALISTIC BLUE/BLACK MARBLE)
  // =========================================================================
  let titleRenderer = null;
  let titleScene = null;
  let titleCamera = null;
  let titleEarth = null;
  let titleClouds = null;
  let titleSatellite = null;
  let titleAnimId = null;
  let mouseParallaxX = 0;
  let mouseParallaxY = 0;

  function initTitleGlobe(canvasElement) {
    if (!canvasElement || typeof THREE === "undefined") return;
    if (titleAnimId) cancelAnimationFrame(titleAnimId);

    const w = canvasElement.clientWidth || 480;
    const h = canvasElement.clientHeight || 280;

    titleRenderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
    titleRenderer.setSize(w, h);
    titleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    titleScene = new THREE.Scene();
    titleCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    titleCamera.position.set(0, 4, 46);

    const amb = new THREE.AmbientLight(0x223344, 0.65);
    titleScene.add(amb);

    const sunDir = new THREE.Vector3(1, 0.35, 0.8).normalize();
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.45);
    sun.position.copy(sunDir).multiplyScalar(60);
    titleScene.add(sun);

    // Real Earth with Day/Night City Lights
    const earthMat = createDayNightEarthMaterial(sunDir);
    titleEarth = new THREE.Mesh(new THREE.SphereGeometry(18, 64, 64), earthMat);
    titleScene.add(titleEarth);

    // Clouds
    const cloudMat = new THREE.MeshPhongMaterial({
      map: TextureFactory.getRealEarthClouds(),
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    titleClouds = new THREE.Mesh(new THREE.SphereGeometry(18.25, 48, 48), cloudMat);
    titleScene.add(titleClouds);

    // Thin Atmosphere Rayleigh Glow
    const atmo = createAtmosphereShader(18);
    titleScene.add(atmo);

    // Orbiting Satellite
    titleSatellite = buildSpacecraft({ defaultDemo: true });
    titleSatellite.scale.set(0.42, 0.42, 0.42);
    titleScene.add(titleSatellite);

    // Interactive Drag to Spin Earth & Mouse Wheel Zoom
    let globeIsDragging = false;
    let prevGlobeX = 0;
    let prevGlobeY = 0;
    let globeDist = 46;

    canvasElement.style.cursor = "grab";
    canvasElement.addEventListener("mousedown", (e) => {
      globeIsDragging = true;
      prevGlobeX = e.clientX;
      prevGlobeY = e.clientY;
      canvasElement.style.cursor = "grabbing";
    });

    canvasElement.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length === 1) {
        globeIsDragging = true;
        prevGlobeX = e.touches[0].clientX;
        prevGlobeY = e.touches[0].clientY;
      }
    }, { passive: true });

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("mousemove", (e) => {
        if (!globeIsDragging) {
          mouseParallaxX = (e.clientX / window.innerWidth - 0.5) * 8;
          mouseParallaxY = (e.clientY / window.innerHeight - 0.5) * 5;
          return;
        }
        const dx = e.clientX - prevGlobeX;
        const dy = e.clientY - prevGlobeY;
        titleEarth.rotation.y += dx * 0.012;
        titleClouds.rotation.y += dx * 0.014;
        titleEarth.rotation.x = Math.max(-0.6, Math.min(0.6, titleEarth.rotation.x + dy * 0.008));
        prevGlobeX = e.clientX;
        prevGlobeY = e.clientY;
      });

      window.addEventListener("touchmove", (e) => {
        if (!globeIsDragging || !e.touches || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - prevGlobeX;
        const dy = e.touches[0].clientY - prevGlobeY;
        titleEarth.rotation.y += dx * 0.012;
        titleClouds.rotation.y += dx * 0.014;
        prevGlobeX = e.touches[0].clientX;
        prevGlobeY = e.touches[0].clientY;
      }, { passive: true });

      window.addEventListener("mouseup", () => {
        globeIsDragging = false;
        if (canvasElement) canvasElement.style.cursor = "grab";
      });
      window.addEventListener("touchend", () => {
        globeIsDragging = false;
      });
    }

    canvasElement.addEventListener("wheel", (e) => {
      if (e.preventDefault) e.preventDefault();
      globeDist = Math.max(26, Math.min(75, globeDist + e.deltaY * 0.04));
    }, { passive: false });

    let satAngle = 0;
    function anim() {
      if (!titleRenderer) return;
      if (!globeIsDragging) {
        titleEarth.rotation.y += 0.003;
        titleClouds.rotation.y += 0.0042;
      }

      satAngle += 0.018;
      const r = 26;
      titleSatellite.position.set(Math.cos(satAngle) * r, Math.sin(satAngle * 0.7) * 5, Math.sin(satAngle) * r);
      titleSatellite.rotation.y = satAngle + Math.PI / 2;

      titleCamera.position.x += (mouseParallaxX - titleCamera.position.x) * 0.05;
      titleCamera.position.y += (4 - mouseParallaxY - titleCamera.position.y) * 0.05;
      titleCamera.position.z += (globeDist - titleCamera.position.z) * 0.08;
      titleCamera.lookAt(0, 0, 0);

      titleRenderer.render(titleScene, titleCamera);
      titleAnimId = requestAnimationFrame(anim);
    }
    anim();
  }

  // =========================================================================
  // INTERACTIVE 3D SPACECRAFT CAD / BLUEPRINT INSPECTOR (DESIGN STUDIO)
  // =========================================================================
  let cadRenderer = null;
  let cadScene = null;
  let cadCamera = null;
  let cadSpacecraft = null;
  let cadAnimId = null;
  let cadIsWireframe = false;
  let cadRotX = 0;
  let cadRotY = 0;
  let cadIsDragging = false;
  let cadPrevX = 0, cadPrevY = 0;
  let cadCanvasElement = null;

  function checkCADResize() {
    if (!cadRenderer || !cadCamera || !cadCanvasElement) return;
    const rect = cadCanvasElement.getBoundingClientRect();
    const rw = Math.floor(rect.width);
    const rh = Math.floor(rect.height);
    if (rw > 20 && rh > 20) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.floor(rw * dpr);
      const targetH = Math.floor(rh * dpr);
      if (Math.abs(cadCanvasElement.width - targetW) > 2 || Math.abs(cadCanvasElement.height - targetH) > 2) {
        cadRenderer.setSize(rw, rh, false);
        cadCamera.aspect = rw / rh;
        cadCamera.updateProjectionMatrix();
      }
    }
  }

  function initDesignCADViewer(canvasElement) {
    if (!canvasElement || typeof THREE === "undefined") return;
    cadCanvasElement = canvasElement;
    if (cadAnimId) cancelAnimationFrame(cadAnimId);

    const w = canvasElement.clientWidth > 0 ? canvasElement.clientWidth : (canvasElement.parentElement ? canvasElement.parentElement.clientWidth : 800) || 800;
    const h = canvasElement.clientHeight > 0 ? canvasElement.clientHeight : 220;

    cadRenderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
    cadRenderer.setSize(w, h, false);
    cadRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    cadScene = new THREE.Scene();
    cadCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 500);
    cadCamera.position.set(0, 3, 14);
    cadCamera.lookAt(0, 0, 0);

    const amb = new THREE.AmbientLight(0x334455, 0.9);
    cadScene.add(amb);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.8);
    light1.position.set(20, 25, 30);
    cadScene.add(light1);

    const light2 = new THREE.DirectionalLight(0x00e5ff, 0.7);
    light2.position.set(-20, -10, -20);
    cadScene.add(light2);

    // Initial spacecraft strictly reflects current engine state
    const curState = (window.GameEngine && typeof window.GameEngine.getState === "function") 
      ? window.GameEngine.getState() 
      : {};
    updateDesignCAD(curState);

    // Drag to rotate CAD inspector in 360 degrees (Mouse)
    canvasElement.addEventListener("mousedown", (e) => {
      cadIsDragging = true;
      if (cadSpacecraft) {
        cadRotY = cadSpacecraft.rotation.y;
        cadRotX = cadSpacecraft.rotation.x;
      }
      cadPrevX = e.clientX;
      cadPrevY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!cadIsDragging) return;
      const dx = e.clientX - cadPrevX;
      const dy = e.clientY - cadPrevY;
      cadRotY += dx * 0.01;
      cadRotX += dy * 0.01;
      cadPrevX = e.clientX;
      cadPrevY = e.clientY;
    });

    window.addEventListener("mouseup", () => { cadIsDragging = false; });

    // Touch controls for tablets / mobile
    canvasElement.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        cadIsDragging = true;
        if (cadSpacecraft) {
          cadRotY = cadSpacecraft.rotation.y;
          cadRotX = cadSpacecraft.rotation.x;
        }
        cadPrevX = e.touches[0].clientX;
        cadPrevY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!cadIsDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - cadPrevX;
      const dy = e.touches[0].clientY - cadPrevY;
      cadRotY += dx * 0.01;
      cadRotX += dy * 0.01;
      cadPrevX = e.touches[0].clientX;
      cadPrevY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchend", () => { cadIsDragging = false; });

    // Scroll to zoom
    canvasElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      cadCamera.position.z = Math.max(7, Math.min(25, cadCamera.position.z + e.deltaY * 0.02));
    }, { passive: false });

    window.addEventListener("resize", checkCADResize);

    function anim() {
      if (!cadRenderer) return;
      checkCADResize();
      if (!cadIsDragging && cadSpacecraft) {
        cadSpacecraft.rotation.y += 0.005; // Slow gentle rotation
      } else if (cadSpacecraft) {
        cadSpacecraft.rotation.y = cadRotY;
        cadSpacecraft.rotation.x = cadRotX;
      }
      cadRenderer.render(cadScene, cadCamera);
      cadAnimId = requestAnimationFrame(anim);
    }
    anim();
  }

  function updateDesignCAD(config) {
    if (!cadScene) return;
    checkCADResize();
    if (cadSpacecraft) cadScene.remove(cadSpacecraft);

    cadSpacecraft = buildSpacecraft(config || {});
    if (cadIsWireframe) applyWireframeMode(cadSpacecraft);
    cadScene.add(cadSpacecraft);
  }

  function toggleCADWireframe() {
    cadIsWireframe = !cadIsWireframe;
    if (cadSpacecraft) {
      if (cadIsWireframe) applyWireframeMode(cadSpacecraft);
      else {
        // Rebuild solid
        const state = window.GameEngine ? window.GameEngine.getState() : {};
        updateDesignCAD(state);
      }
    }
    return cadIsWireframe;
  }

  function applyWireframeMode(group) {
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
    group.traverse(child => {
      if (child.isMesh) child.material = wireMat;
    });
  }

  // =========================================================================
  // RENDER FRAME (MAIN SIMULATION / FLIGHT)
  // =========================================================================
  function renderFrame(craftState) {
    if (!renderer || !scene || !camera) return;

    if (planetMesh) planetMesh.rotation.y += 0.0008;
    if (cloudsMesh) cloudsMesh.rotation.y += 0.0012;

    updateParticles3D();

    // Dynamic Solar Eclipse & Thermal Lighting
    if (craftState && craftState.eclipseFactor !== undefined) {
      if (sunLight) {
        if (craftState.isSunrise) {
          sunLight.intensity = 2.4; // Radiant sunrise surge
        } else {
          sunLight.intensity = Math.max(0.08, 1.7 * craftState.eclipseFactor);
        }
      }
      if (ambientLight) {
        ambientLight.intensity = Math.max(0.32, 0.65 * craftState.eclipseFactor);
      }
    }

    let targetObj = spacecraftGroup;
    if (craftState && craftState.phase === "launch" && rocketGroup) {
      targetObj = rocketGroup;
    }

    if (targetObj) {
      if (craftState && craftState.attitudeAngle !== undefined && spacecraftGroup) {
        spacecraftGroup.rotation.y = craftState.attitudeAngle;
      }

      if (cameraMode === "autorotate") {
        camTheta += 0.005;
      }

      const targetPos = targetObj.position;
      const cx = targetPos.x + camDist * Math.sin(camPhi) * Math.sin(camTheta);
      const cy = targetPos.y + camDist * Math.cos(camPhi);
      const cz = targetPos.z + camDist * Math.sin(camPhi) * Math.cos(camTheta);

      camera.position.set(cx, cy, cz);
      camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    }

    renderer.render(scene, camera);
  }

  function handleResize() {
    if (!renderer || !camera || !activeCanvas) return;
    const width = activeCanvas.clientWidth || 960;
    const height = activeCanvas.clientHeight || 540;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", handleResize);

  return {
    init,
    initTitleGlobe,
    initDesignCADViewer,
    updateDesignCAD,
    toggleCADWireframe,
    setupCelestialBody,
    setupOrbitLine,
    updateOrbitGeometry,
    setReentryPlasma,
    buildSpacecraft,
    buildRocket,
    buildLaunchPad3D,
    createVaporCone3D,
    showScanCone,
    showDownlinkBeam,
    addRocketExhaust,
    setCameraMode,
    renderFrame,
    handleResize,
    getScene: () => scene,
    getRenderer: () => renderer,
    getCamera: () => camera,
    setSpacecraftGroup: (grp) => { spacecraftGroup = grp; },
    setRocketGroup: (grp) => { rocketGroup = grp; }
  };
})();

console.log("[MissionControl] Space3D WebGL Engine loaded");
