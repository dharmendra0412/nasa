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

    // 2. Power Subsystem (Solar Arrays vs RTG)
    let leftWing = null, rightWing = null;
    if (comps.power === "rtg") {
      // Nuclear RTG Cylinder with cooling fins
      const rtgGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 16);
      const rtgMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.7 });
      const rtgMesh = new THREE.Mesh(rtgGeo, rtgMat);
      rtgMesh.position.set(-busW * 0.75, 0, 0);

      // Orange glow core indicator
      const glowGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      rtgMesh.add(glow);
      group.add(rtgMesh);
    } else {
      // Solar Wings (Deployable Photovoltaic Arrays)
      const span = comps.power === "large-solar" ? 6.5 : (comps.power === "small-solar" ? 3.0 : 4.5);
      const solarWingGeo = new THREE.BoxGeometry(span, 0.12, 2.0);

      leftWing = new THREE.Mesh(solarWingGeo, solarMat);
      leftWing.position.set(-(busW / 2 + span / 2 + 0.6), 0, 0);
      leftWing.castShadow = true;
      group.add(leftWing);

      rightWing = new THREE.Mesh(solarWingGeo, solarMat);
      rightWing.position.set(busW / 2 + span / 2 + 0.6, 0, 0);
      rightWing.castShadow = true;
      group.add(rightWing);

      // Structural hinge booms
      const boomGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8);
      const b1 = new THREE.Mesh(boomGeo, metalMat); b1.rotation.z = Math.PI / 2; b1.position.set(-(busW / 2 + 0.4), 0, 0); group.add(b1);
      const b2 = new THREE.Mesh(boomGeo, metalMat); b2.rotation.z = Math.PI / 2; b2.position.set(busW / 2 + 0.4, 0, 0); group.add(b2);
    }

    // 3. Telecommunications Antenna
    let dishMesh = null;
    if (comps.antenna === "hga" || comps.antenna === "parabolic" || !comps.antenna) {
      // High-Gain Parabolic Dish
      const dishRadius = comps.antenna === "hga" ? 1.6 : 1.1;
      const dishGeo = new THREE.SphereGeometry(dishRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide });
      dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = -Math.PI / 2;
      dishMesh.position.set(0, busH * 0.55 + 0.8, 0);

      const hornGeo = new THREE.CylinderGeometry(0.04, 0.1, 0.7);
      const horn = new THREE.Mesh(hornGeo, metalMat);
      horn.position.set(0, 0, 0.4); horn.rotation.x = Math.PI / 2;
      dishMesh.add(horn);
      group.add(dishMesh);
    } else {
      // Patch / Dipole array
      const patchGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
      const patch = new THREE.Mesh(patchGeo, metalMat);
      patch.position.set(0, busH * 0.52, 0);
      group.add(patch);
    }

    // 4. Optical Telescope Camera
    const scopeGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.6, 24);
    const scopeMesh = new THREE.Mesh(scopeGeo, metalMat);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, -busH * 0.2, busL * 0.5 + 0.8);

    const lensGeo = new THREE.CircleGeometry(0.6, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x00e5ff, roughness: 0.05, transmission: 0.9, ior: 1.5 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.81, 0); lens.rotation.x = -Math.PI / 2;
    scopeMesh.add(lens);
    group.add(scopeMesh);

    // 5. Magnetometer Boom Arm if equipped
    if (insts.includes("magnetometer")) {
      const magBoomGeo = new THREE.CylinderGeometry(0.05, 0.05, 5.5);
      const magBoom = new THREE.Mesh(magBoomGeo, metalMat);
      magBoom.rotation.z = Math.PI / 3;
      magBoom.position.set(busW * 0.8, busH * 0.8, -busL * 0.4);

      const sensorSphere = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), goldMat);
      sensorSphere.position.set(0, 2.8, 0);
      magBoom.add(sensorSphere);
      group.add(magBoom);
    }

    // 6. SAR Radar Planar Panel if equipped
    if (insts.includes("sar")) {
      const sarGeo = new THREE.BoxGeometry(5.0, 1.4, 0.15);
      const sarMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.4, metalness: 0.5 });
      const sarMesh = new THREE.Mesh(sarGeo, sarMat);
      sarMesh.position.set(0, -busH * 0.7, 0);
      group.add(sarMesh);
    }

    // 7. Propulsion Thruster Nozzle
    const nozGeo = new THREE.ConeGeometry(0.55, 0.9, 16, 1, true);
    const nozMat = new THREE.MeshStandardMaterial({
      color: comps.propulsion === "ion" ? 0x00e5ff : 0x222222,
      roughness: 0.5,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    const nozzle = new THREE.Mesh(nozGeo, nozMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.set(0, 0, -busL * 0.5 - 0.5);
    group.add(nozzle);

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
    titleSatellite = buildSpacecraft({});
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

  function initDesignCADViewer(canvasElement) {
    if (!canvasElement || typeof THREE === "undefined") return;
    if (cadAnimId) cancelAnimationFrame(cadAnimId);

    const w = canvasElement.clientWidth || 700;
    const h = canvasElement.clientHeight || 240;

    cadRenderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
    cadRenderer.setSize(w, h);
    cadRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    cadScene = new THREE.Scene();
    cadCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 500);
    cadCamera.position.set(0, 3, 14);
    cadCamera.lookAt(0, 0, 0);

    const amb = new THREE.AmbientLight(0x334455, 0.8);
    cadScene.add(amb);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.8);
    light1.position.set(20, 25, 30);
    cadScene.add(light1);

    const light2 = new THREE.DirectionalLight(0x00e5ff, 0.6);
    light2.position.set(-20, -10, -20);
    cadScene.add(light2);

    // Initial default spacecraft
    updateDesignCAD({});

    // Drag to rotate CAD inspector in 360 degrees
    canvasElement.addEventListener("mousedown", (e) => {
      cadIsDragging = true;
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

    // Scroll to zoom
    canvasElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      cadCamera.position.z = Math.max(7, Math.min(25, cadCamera.position.z + e.deltaY * 0.02));
    }, { passive: false });

    function anim() {
      if (!cadRenderer) return;
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
    if (cadSpacecraft) cadScene.remove(cadSpacecraft);

    cadSpacecraft = buildSpacecraft(config);
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
