/**
 * Mission Control: Space Mission Design Game
 * Game Data Definition (NASA Systems Engineering Inspired)
 */

window.GameData = {
  // Mission Scenarios
  missions: [
    {
      id: "sentinel-e",
      name: "Sentinel-Earth Climate Monitor",
      icon: "🌍",
      difficulty: 1,
      destination: "Earth (Polar / Low Earth Orbit)",
      type: "Earth Observation",
      categoryTag: "EARTH OBSERVATION • CLASS-B",
      duration: 730, // 2 years in days
      craftImg: "assets/brief/sentinel-e_craft_trans.png",
      artImg: "assets/brief/sentinel-e_art.jpg",
      briefing: "Rising sea surface temperatures, polar ice sheet melt, and rapid deforestation demand high-cadence multispectral surveillance. Your team must design an Earth-observing satellite in a Sun-Synchronous Orbit (SSO) capable of returning optical and radar telemetry daily. High data throughput and consistent solar power during sunlit orbital passes are critical.",
      objectiveBullets: [
        { verb: "Monitor", text: "Sea surface temperature" },
        { verb: "Track", text: "Polar ice sheet melt" },
        { verb: "Analyze", text: "Deforestation changes" },
        { verb: "Use", text: "Multispectral data" },
        { verb: "Ensure", text: "Continuous solar power" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "🏔️", title: "Polar Ice Cap Mapping", tags: ["Ice extent", "Arctic & Antarctic", "Sub-50m"] },
        { theme: "green", icon: "🍃", title: "Global Canopy & Deforestation", tags: ["Canopy change", "Carbon index"] },
        { theme: "purple", icon: "🌊", title: "Sea Level & Altimetry", tags: ["Ocean topography", "Thermal swell"] }
      ],
      objectives: [
        { id: "obj-ice", name: "Polar Ice Cap Mapping", description: "Map changes in arctic and antarctic ice extent at sub-50m resolution.", scienceWeight: 0.35 },
        { id: "obj-forest", name: "Global Canopy & Deforestation", description: "Track tropical canopy changes and carbon sequestration index.", scienceWeight: 0.35 },
        { id: "obj-sea", name: "Sea Level & Altimetry", description: "Monitor oceanic topography and thermal swell patterns.", scienceWeight: 0.30 }
      ],
      requirements: {
        minInstruments: 2,
        requiredCategories: ["imaging"],
        preferredOrbits: ["sso", "leo"]
      },
      recommendedRoles: ["Earth Systems Scientist", "Orbit Specialist"]
    },
    {
      id: "stormwatch",
      name: "StormWatch Geostationary Sentinel",
      icon: "🌀",
      difficulty: 1,
      destination: "Earth (Geostationary Orbit)",
      type: "Weather & Atmospheric",
      categoryTag: "WEATHER & ATMOSPHERIC • CLASS-B",
      duration: 1095, // 3 years in days
      craftImg: "assets/brief/stormwatch_craft_trans.png",
      artImg: "assets/brief/stormwatch_art.jpg",
      briefing: "Severe storms, hurricanes, and rapid cyclogenesis require continuous, stationary observation of an entire planetary hemisphere. Operating in Geostationary Orbit (GEO at ~35,786 km), your spacecraft will maintain a fixed vantage point. GEO requires substantial launch propulsion to reach high altitude, but delivers 24/7 continuous direct-to-ground downlink.",
      objectiveBullets: [
        { verb: "Monitor", text: "Severe storms & hurricanes" },
        { verb: "Observe", text: "Whole planetary hemisphere" },
        { verb: "Maintain", text: "Fixed GEO vantage (~35,786 km)" },
        { verb: "Ensure", text: "24/7 data downlink" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "🌀", title: "Severe Hurricane Tracking", tags: ["Real-time", "15-min refresh", "Eye wall"] },
        { theme: "green", icon: "💧", title: "Atmospheric Water Vapor Profiling", tags: ["Infrared", "Vertical profiles", "Humidity/Wind"] },
        { theme: "purple", icon: "⚡", title: "Lightning Flash Mapping", tags: ["Detect flashes", "Forecast storms", "Intensity"] }
      ],
      objectives: [
        { id: "obj-cyclone", name: "Severe Hurricane Tracking", description: "Provide real-time 15-minute refresh loops of storm eye wall dynamics.", scienceWeight: 0.40 },
        { id: "obj-atmos", name: "Atmospheric Water Vapor Profiling", description: "Sample infrared vertical sounding columns for humidity and wind shear.", scienceWeight: 0.35 },
        { id: "obj-lightning", name: "Lightning Flash Mapping", description: "Detect optical flashes to forecast severe thunderstorm intensification.", scienceWeight: 0.25 }
      ],
      requirements: {
        minInstruments: 2,
        requiredCategories: ["imaging", "spectrometer"],
        preferredOrbits: ["geo"]
      },
      recommendedRoles: ["Atmospheric Physicist", "Power Systems Lead"]
    },
    {
      id: "artemis-scout",
      name: "Artemis Lunar Resource Prospector",
      icon: "🌕",
      difficulty: 2,
      destination: "Moon (Low Lunar Polar Orbit)",
      type: "Lunar Science & ISRU",
      categoryTag: "LUNAR SCIENCE & ISRU • CLASS-B",
      duration: 365, // 1 year
      craftImg: "assets/brief/artemis-scout_craft_trans.png",
      artImg: "assets/brief/artemis-scout_art.jpg",
      briefing: "NASA's Artemis program requires high-resolution volatile prospecting before landing crews at the South Pole. Permanently Shadowed Regions (PSRs) in craters like Shackleton hide water ice essential for rocket propellant and life support. Your probe must orbit at just 100 km altitude, surviving harsh thermal swings and mascon gravitational perturbations while peering into pitch-black craters with active radar and spectrometry.",
      objectiveBullets: [
        { verb: "Prospect", text: "Volatiles (water ice, hydrogen)" },
        { verb: "Map", text: "Permanently Shadowed Regions (PSRs)" },
        { verb: "Assess", text: "Landing zone hazards" },
        { verb: "Analyze", text: "Rare-earth & ilmenite deposits" },
        { verb: "Support", text: "Future crewed landings" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "💎", title: "Volatile & Water Ice Mapping", tags: ["Water ice", "Hydrogen", "PSRs"] },
        { theme: "green", icon: "📡", title: "Landing Zone Hazard Assessment", tags: ["Terrain", "Slope", "Elevation"] },
        { theme: "purple", icon: "🪨", title: "Rare-Earth & Ilmenite Assay", tags: ["Titanium", "Ilmenite", "Resource use"] }
      ],
      objectives: [
        { id: "obj-ice-find", name: "Volatile & Water Ice Mapping", description: "Locate subsurface hydrogen deposits in permanently shadowed craters.", scienceWeight: 0.45 },
        { id: "obj-topo", name: "Landing Zone Hazard Assessment", description: "Produce sub-meter digital elevation models for future crewed landers.", scienceWeight: 0.30 },
        { id: "obj-mineral", name: "Rare-Earth & Ilmenite Assay", description: "Identify titanium and ilmenite ore beds for in-situ resource utilization.", scienceWeight: 0.25 }
      ],
      requirements: {
        minInstruments: 3,
        requiredCategories: ["radar", "spectrometer"],
        preferredOrbits: ["lunar"]
      },
      recommendedRoles: ["Planetary Geologist", "Propulsion Engineer"]
    },
    {
      id: "red-pioneer",
      name: "Red Pioneer: Mars Reconnaissance & Water Hunt",
      icon: "🪐",
      difficulty: 3,
      destination: "Mars (Low Mars Orbit)",
      type: "Planetary Exploration",
      categoryTag: "PLANETARY EXPLORATION • CLASS-B",
      duration: 1095, // 3 years
      craftImg: "assets/brief/red-pioneer_craft_trans.png",
      artImg: "assets/brief/red-pioneer_art.jpg",
      briefing: "Embark on an interplanetary voyage across 225 million kilometers. Red Pioneer will search for ancient biosignatures, subsurface aquifers, and monitor the dynamic Martian CO2 cycle. Sunlight intensity at Mars is less than half of Earth's (~590 W/m² vs 1361 W/m²), so solar arrays must be oversized or an RTG employed. Signal propagation delays (up to 20 minutes each way) demand high onboard autonomy.",
      objectiveBullets: [
        { verb: "Explore", text: "225 million km interplanetary journey" },
        { verb: "Search", text: "Biosignatures & subsurface aquifers" },
        { verb: "Monitor", text: "Martian CO2 cycle" },
        { verb: "Measure", text: "Low sunlight & solar array design" },
        { verb: "Ensure", text: "High onboard autonomy (≤ 20 min delay)" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "📶", title: "Subsurface Radar Aquifer Sounding", tags: ["≤ 2 km depth", "Brine lenses", "Water ice"] },
        { theme: "green", icon: "🧪", title: "Atmospheric Methane & Organics", tags: ["Trace gases", "CH4 detection", "Biological hints"] },
        { theme: "purple", icon: "🖼️", title: "Future Human Landing Site Imagery", tags: ["High-res imaging", "Jezero", "Valles Marineris"] }
      ],
      objectives: [
        { id: "obj-mars-water", name: "Subsurface Radar Aquifer Sounding", description: "Penetrate up to 2 km below the Martian regolith to detect liquid brine lenses.", scienceWeight: 0.40 },
        { id: "obj-methane", name: "Atmospheric Methane & Organics", description: "Sniff trace atmospheric emissions for potential subsurface biological activity.", scienceWeight: 0.35 },
        { id: "obj-recon", name: "Future Human Landing Site Imagery", description: "High-resolution orbital stereo passes of Jezero and Valles Marineris.", scienceWeight: 0.25 }
      ],
      requirements: {
        minInstruments: 3,
        requiredCategories: ["imaging", "spectrometer"],
        preferredOrbits: ["heo", "lunar"] // HEO / high deltaV transfer
      },
      recommendedRoles: ["Astrobiologist", "Autonomous Systems Lead"]
    },
    {
      id: "asteroid-guard",
      name: "Aegis Asteroid Early Warning Interceptor",
      icon: "☄️",
      difficulty: 2,
      destination: "Deep Space / Highly Elliptical Orbit",
      type: "Planetary Defense",
      categoryTag: "PLANETARY DEFENSE • CLASS-B",
      duration: 1460, // 4 years
      craftImg: "assets/brief/asteroid-guard_craft_trans.png",
      artImg: "assets/brief/asteroid-guard_art.jpg",
      briefing: "Planetary Defense requires detecting dark Near-Earth Objects (NEOs) before they pose an impact threat. Ground telescopes are blind to asteroids approaching from the direction of the Sun. Operating in an eccentric orbit with thermal infrared sensors, Aegis will survey the inner solar system, cataloging chondritic and metallic impactors months to years in advance.",
      objectiveBullets: [
        { verb: "Detect", text: "Dark Near-Earth Objects (NEOs)" },
        { verb: "Survey", text: "Inner solar system" },
        { verb: "Catalog", text: "Chondritic & metallic impactors" },
        { verb: "Assess", text: "Impact risk & probability" },
        { verb: "Enable", text: "Early warning & interceptor planning" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "📡", title: "Dark Asteroid Thermal Detection", tags: [">140 m", "Thermal IR", "Solar glare"] },
        { theme: "green", icon: "⚛️", title: "Precision Orbit Determination", tags: ["Orbit modeling", "Risk window", "High-risk"] },
        { theme: "purple", icon: "📚", title: "Spectral Classification (C/S/M Types)", tags: ["Mineralogy", "Composition", "Kinetic study"] }
      ],
      objectives: [
        { id: "obj-neo-detect", name: "Dark Asteroid Thermal Detection", description: "Detect >140m diameter hazardous asteroids in the solar glare zone.", scienceWeight: 0.50 },
        { id: "obj-orbit-prop", name: "Precision Orbit Determination", description: "Compute impact risk probability windows for high-risk targets.", scienceWeight: 0.30 },
        { id: "obj-composition", name: "Spectral Classification (C/S/M Types)", description: "Determine mineralogy to evaluate kinetic deflection efficiency.", scienceWeight: 0.20 }
      ],
      requirements: {
        minInstruments: 2,
        requiredCategories: ["imaging", "radar"],
        preferredOrbits: ["heo", "l2"]
      },
      recommendedRoles: ["Planetary Defense Officer", "Thermal Architect"]
    },
    {
      id: "deepview",
      name: "DeepView Cosmic Dawn Space Observatory",
      icon: "🔭",
      difficulty: 3,
      destination: "Sun–Earth Lagrange Point 2 (L2)",
      type: "Astrophysics Flagship",
      categoryTag: "ASTROPHYSICS FLAGSHIP • CLASS-B",
      duration: 1825, // 5 years
      craftImg: "assets/brief/deepview_craft_trans.png",
      artImg: "assets/brief/deepview_art.jpg",
      briefing: "Peering back 13.5 billion years to the formation of the very first stars and galaxies requires an ultra-stable thermal haven 1.5 million kilometers away: Sun-Earth L2. Free from Earth's thermal glow, your flagship observatory needs cryogenic cooling, arcsecond pointing stability, and ultra-high bandwidth to downlink gigapixel deep-field survey data.",
      objectiveBullets: [
        { verb: "Observe", text: "First light galaxies & redshift (z > 12)" },
        { verb: "Analyze", text: "Exoplanet atmospheric spectra" },
        { verb: "Map", text: "Cosmic web & dark energy effects" },
        { verb: "Maintain", text: "Cryogenic stability & pointing" },
        { verb: "Deliver", text: "High-bandwidth deep-field data" }
      ],
      milestoneCards: [
        { theme: "blue", icon: "🌌", title: "First Light Galaxies & Redshift", tags: ["Pop III stars", "z > 12", "Early galaxies"] },
        { theme: "green", icon: "🪐", title: "Exoplanet Atmospheric Spectroscopy", tags: ["Transit curves", "Habitability", "Rocky worlds"] },
        { theme: "purple", icon: "〰️", title: "Gravitational Lensing & Dark Energy", tags: ["Cosmic web", "Shear mapping", "Dark energy"] }
      ],
      objectives: [
        { id: "obj-galaxies", name: "First Light Galaxies & Redshift", description: "Detect primordial Population III star clusters at z > 12.", scienceWeight: 0.40 },
        { id: "obj-exoplanet", name: "Exoplanet Atmospheric Spectroscopy", description: "Analyze transit light curves of habitable-zone rocky exoplanets.", scienceWeight: 0.35 },
        { id: "obj-dark-matter", name: "Gravitational Lensing & Dark Energy", description: "Map cosmic web structure via weak gravitational shear distortions.", scienceWeight: 0.25 }
      ],
      requirements: {
        minInstruments: 3,
        requiredCategories: ["imaging", "spectrometer"],
        preferredOrbits: ["l2"]
      },
      recommendedRoles: ["Chief Astrophysicist", "Precision ADCS Engineer"]
    }
  ],

  // Orbital Regimes
  orbits: [
    {
      id: "leo",
      name: "Low Earth Orbit (LEO - 400 km)",
      icon: "🛰️",
      image: "assets/orbits/leo.jpg",
      altitudeKm: 400,
      type: "LEO",
      deltaV: 0.0, // Baseline launch reference
      scienceMultiplier: 1.0,
      commsCoverage: 0.42,
      radiationLevel: "LOW",
      description: "Standard orbit around 400 km altitude with ~90-minute orbital period. Low launch cost and minimal radiation exposure, but frequent orbital eclipses and limited ground station contact windows.",
      pros: ["Lowest launch energy required (high payload mass)", "Low radiation damage to onboard electronics", "Ideal for high-resolution ground surface imaging"],
      cons: ["Frequent orbital night passes (requires battery storage)", "Atmospheric drag requires periodic orbit reboost", "Short 8-12 minute ground contact passes per station"]
    },
    {
      id: "sso",
      name: "Sun-Synchronous Polar Orbit (SSO - 600 km)",
      icon: "☀️",
      image: "assets/orbits/sso.jpg",
      altitudeKm: 600,
      type: "SSO",
      deltaV: 0.25,
      scienceMultiplier: 1.25,
      commsCoverage: 0.40,
      radiationLevel: "LOW",
      description: "Retrograde polar orbit (~98° inclination) where the satellite crosses the equator at the exact same local solar time each day, providing constant illumination conditions ideal for Earth science.",
      pros: ["Consistent sun angles for consistent photography & solar power", "Full global Earth surface coverage every few days", "Excellent for multispectral and climate monitoring"],
      cons: ["Higher delta-V required than equatorial LEO", "South Atlantic Anomaly brings occasional radiation hits", "Ground passes clustered near polar ground stations"]
    },
    {
      id: "meo",
      name: "Medium Earth Orbit (MEO - 2,000 km)",
      icon: "🌐",
      image: "assets/orbits/meo.jpg",
      altitudeKm: 2000,
      type: "MEO",
      deltaV: 0.35,
      scienceMultiplier: 0.85,
      commsCoverage: 0.65,
      radiationLevel: "HIGH",
      description: "Altitude range between LEO and GEO. Offers wide regional visibility and longer ground passes, but sits directly within the intense Van Allen trapped proton and electron radiation belts.",
      pros: ["Broader planetary vantage than LEO", "Longer ground station visibility windows (~1-2 hours)", "Well-suited for navigation and constellation architectures"],
      cons: ["Severe ionizing radiation degrades solar cells and memory", "Substantial payload penalty compared to LEO", "Requires active radiation-hardened components"]
    },
    {
      id: "geo",
      name: "Geostationary Orbit (GEO - 35,786 km)",
      icon: "🌀",
      image: "assets/orbits/geo.jpg",
      altitudeKm: 35786,
      type: "GEO",
      deltaV: 2.85,
      scienceMultiplier: 0.80,
      commsCoverage: 0.98,
      radiationLevel: "MEDIUM",
      description: "Equatorial circular orbit with a 24-hour orbital period matching Earth's rotation. The satellite remains hovering permanently over a single longitude on Earth.",
      pros: ["Continuous 24/7 direct communication with dedicated ground station", "Unbroken view of an entire hemisphere for weather tracking", "Minimal eclipse times (only near equinoxes)"],
      cons: ["Extreme delta-V required to circularize at 35,786 km", "High launch cost limits allowable payload mass", "Poor spatial resolution for surface mapping due to distance"]
    },
    {
      id: "heo",
      name: "Highly Elliptical Orbit (Molniya / HEO)",
      icon: "⚡",
      image: "assets/orbits/heo.jpg",
      altitudeKm: "500 - 40,000",
      type: "HEO",
      deltaV: 2.50,
      scienceMultiplier: 1.05,
      commsCoverage: 0.70,
      radiationLevel: "HIGH",
      description: "High-apogee elliptical orbit (perigee 500 km, apogee 40,000 km). Kepler's second law dictates the craft spends 80% of its orbital period dwelling over high-latitude polar regions.",
      pros: ["Extended dwell time over high northern/southern latitudes", "Excellent coverage of regions GEO satellites cannot see", "Deep space asteroid survey vantage outside inner gravity well"],
      cons: ["Repeatedly traverses both Van Allen radiation belts", "Doppler shift complicates radio tracking and communication", "Extreme thermal cycling between perigee and apogee"]
    },
    {
      id: "lunar",
      name: "Low Lunar Polar Orbit (100 km)",
      icon: "🌙",
      image: "assets/orbits/lunar.jpg",
      altitudeKm: "100 km above Moon",
      type: "lunar",
      deltaV: 4.10,
      scienceMultiplier: 1.60,
      commsCoverage: 0.35,
      radiationLevel: "MEDIUM",
      description: "Deep space orbit around Earth's Moon outside the protective terrestrial magnetosphere. Provides pristine access to lunar surface volatile reservoirs and cosmic rays.",
      pros: ["Sub-meter imaging access to lunar poles and craters", "No atmospheric drag whatsoever", "High scientific discovery value for lunar exploration"],
      cons: ["High translunar injection & orbital capture delta-V", "Lunar far-side blocks all Earth radio contact without a relay", "Lunar mass concentrations (mascons) perturb orbital stability"]
    },
    {
      id: "l2",
      name: "Sun-Earth Lagrange Point 2 (L2)",
      icon: "🌀",
      image: "assets/orbits/orbit_l2_exact.jpg",
      altitudeKm: "1,500,000 km (Halo)",
      type: "L2",
      deltaV: 3.40,
      scienceMultiplier: 2.10,
      commsCoverage: 0.30,
      radiationLevel: "LOW",
      description: "Gravitational equilibrium point 1.5 million kilometers directly behind Earth from the Sun. Allows a single sunshield to block heat and light from the Sun, Earth, and Moon simultaneously.",
      pros: ["Deep cryogenic thermal environment (~40 Kelvin passive)", "Unobstructed 360-degree cosmic observation 24/7/365", "No planetary occultations or orbital twilight transitions"],
      cons: ["Very high launch energy; communications require NASA DSN", "Irretrievable: no human servicing or rescue missions possible", "Requires precise station-keeping burns to stay in halo orbit"]
    }
  ],

  // Scientific Instruments
  instruments: [
    {
      id: "wide-cam",
      name: "Wide-Field Optical Camera",
      icon: "📷",
      category: "imaging",
      mass: 14, // kg
      power: 22, // W
      cost: 16, // $M
      dataRate: 6.5, // Mbps
      scienceValue: 32,
      requiredPointing: "moderate",
      description: "Multispectral wide-angle imager for large-area surface reconnaissance, cloud cover dynamics, and regional vegetation index mapping."
    },
    {
      id: "hires-cam",
      name: "High-Resolution Telescopic Camera",
      icon: "🔬",
      category: "imaging",
      mass: 38,
      power: 48,
      cost: 38,
      dataRate: 24.0,
      scienceValue: 52,
      requiredPointing: "precise",
      description: "Sub-meter focal-plane telescope with time-delay integration. Yields stunning clarity on surface features, landing hazards, or distant galaxies."
    },
    {
      id: "hyper-img",
      name: "Hyperspectral Earth & Astro Imager",
      icon: "🌈",
      category: "imaging",
      mass: 30,
      power: 42,
      cost: 44,
      dataRate: 18.0,
      scienceValue: 56,
      requiredPointing: "precise",
      description: "Splits light into 200+ contiguous spectral bands. Pinpoints mineral signatures, crop hydration, chemical pollutants, and planetary regolith composition."
    },
    {
      id: "uv-spec",
      name: "Ultraviolet Spectrometer",
      icon: "🟣",
      category: "spectrometer",
      mass: 12,
      power: 16,
      cost: 20,
      dataRate: 2.5,
      scienceValue: 36,
      requiredPointing: "moderate",
      description: "Analyzes upper atmospheric ozone layers, stellar coronae, and volatile exospheres of airless moons via UV emission/absorption lines."
    },
    {
      id: "ir-spec",
      name: "Thermal Infrared Spectrometer",
      icon: "🔴",
      category: "spectrometer",
      mass: 20,
      power: 32,
      cost: 30,
      dataRate: 5.5,
      scienceValue: 44,
      requiredPointing: "moderate",
      description: "Measures surface thermal inertia, atmospheric greenhouse gases, volcanic signatures, and detects cold dark asteroids."
    },
    {
      id: "mass-spec",
      name: "Quadrupole Mass Spectrometer",
      icon: "🧪",
      category: "spectrometer",
      mass: 24,
      power: 36,
      cost: 34,
      dataRate: 1.2,
      scienceValue: 48,
      requiredPointing: "any",
      description: "Direct in-situ analysis of atmospheric gas species and isotopic ratios. Critical for astrobiology and methane plume identification."
    },
    {
      id: "sar",
      name: "Synthetic Aperture Radar (SAR)",
      icon: "📡",
      category: "radar",
      mass: 48,
      power: 90,
      cost: 58,
      dataRate: 28.0,
      scienceValue: 58,
      requiredPointing: "moderate",
      description: "Active microwave radar system. Pierces darkness, clouds, dust storms, and dry regolith to reveal subsurface ice layers and tectonic faulting."
    },
    {
      id: "radar-alt",
      name: "Precision Radar Altimeter",
      icon: "📏",
      category: "radar",
      mass: 16,
      power: 24,
      cost: 20,
      dataRate: 3.5,
      scienceValue: 32,
      requiredPointing: "any",
      description: "Bounces radio pulses off the planetary surface to measure topography, ice sheet elevations, and ocean wave heights with centimeter precision."
    },
    {
      id: "magnetometer",
      name: "Fluxgate Boom Magnetometer",
      icon: "🧲",
      category: "fields",
      mass: 5,
      power: 4,
      cost: 9,
      dataRate: 0.6,
      scienceValue: 26,
      requiredPointing: "any",
      description: "Mounted on an extendable boom to isolate from spacecraft electronics. Measures planetary magnetic fields, core dynamos, and solar wind interactions."
    },
    {
      id: "plasma",
      name: "Solar Wind Ion & Plasma Analyzer",
      icon: "⚡",
      category: "particles",
      mass: 9,
      power: 12,
      cost: 14,
      dataRate: 1.2,
      scienceValue: 32,
      requiredPointing: "any",
      description: "Measures velocity, density, and charge states of incoming solar wind protons and interstellar plasma streams."
    },
    {
      id: "cosmic-ray",
      name: "Energetic Particle & Cosmic Ray Detector",
      icon: "☄️",
      category: "particles",
      mass: 11,
      power: 9,
      cost: 16,
      dataRate: 0.8,
      scienceValue: 36,
      requiredPointing: "any",
      description: "Tracks high-energy galactic cosmic rays and solar proton events to quantify astronaut radiation hazards and magnetospheric shielding."
    },
    {
      id: "radio-sci",
      name: "Radio Occultation & Science System",
      icon: "📻",
      category: "radio",
      mass: 6,
      power: 14,
      cost: 11,
      dataRate: 0.4,
      scienceValue: 24,
      requiredPointing: "any",
      description: "Utilizes the telecommunications carrier signal as it refracts through planetary atmospheres to deduce density profiles and gravity anomalies."
    }
  ],

  // Spacecraft Buses
  busSizes: [
    {
      id: "cubesat",
      name: "CubeSat Standard (12U Frame)",
      icon: "📦",
      dryMass: 14, // kg
      maxPayloadMass: 12,
      cost: 6, // $M
      powerCapacity: 120, // W max throughput
      description: "Standardized lightweight nanosatellite architecture. Very low cost and quick fabrication, but strictly limited payload mass and aperture volume."
    },
    {
      id: "small-sat",
      name: "SmallSat ESPA-Class Platform",
      icon: "🛰️",
      dryMass: 65,
      maxPayloadMass: 60,
      cost: 24,
      powerCapacity: 450,
      description: "Rideshare-friendly platform compatible with secondary payload rings. Balances cost-efficiency with serious scientific instrumentation capacity."
    },
    {
      id: "medium-sat",
      name: "Medium Observatory Bus",
      icon: "🚀",
      dryMass: 240,
      maxPayloadMass: 210,
      cost: 58,
      powerCapacity: 1100,
      description: "Robust institutional platform with redundant avionics and ample mounting deck space for multi-instrument science missions."
    },
    {
      id: "large-sat",
      name: "Flagship Deep-Space Platform",
      icon: "🏛️",
      dryMass: 650,
      maxPayloadMass: 550,
      cost: 115,
      powerCapacity: 2600,
      description: "Heavy multi-decade flagship bus built for ambitious planetary and space observatory expeditions with full dual-string fault redundancy."
    }
  ],

  // Power Generation & Storage
  powerSystems: [
    {
      id: "small-solar",
      name: "Body-Mounted / Deployable Solar Panels (250 W)",
      icon: "🔋",
      power: 250,
      mass: 10,
      cost: 6,
      type: "solar",
      description: "Compact triple-junction GaAs solar cells with integrated lithium-ion battery buffer. Highly cost-effective for LEO/SSO missions."
    },
    {
      id: "medium-solar",
      name: "Articulated Sun-Tracking Solar Arrays (700 W)",
      icon: "🔆",
      power: 700,
      mass: 28,
      cost: 15,
      type: "solar",
      description: "Motorized dual-axis solar wings that continuously orient toward the Sun, providing steady power during daylight orbital arcs."
    },
    {
      id: "large-solar",
      name: "High-Power Roll-Out Solar Arrays (ROSA - 1800 W)",
      icon: "⚡",
      power: 1800,
      mass: 65,
      cost: 32,
      type: "solar",
      description: "Next-gen deployable composite boom arrays delivering immense wattage for power-hungry radars, electric thrusters, and instruments."
    },
    {
      id: "rtg",
      name: "Next-Gen Plutonium-238 RTG (400 W Continuous)",
      icon: "☢️",
      power: 400,
      mass: 48,
      cost: 85,
      type: "rtg",
      description: "Decay heat of Plutonium-238 converted via thermocouples. Completely immune to eclipses, planetary shadow, and solar distance."
    }
  ],

  // Thermal Control
  thermalSystems: [
    {
      id: "passive",
      name: "Passive Thermal Blankets (MLI) & Heaters",
      icon: "🛡️",
      mass: 6,
      cost: 4,
      description: "Multi-layer insulation foil blankets and survival strip heaters. Simple and reliable for moderate thermal environments."
    },
    {
      id: "active",
      name: "Active Thermal Fluid Loop & Radiator Panels",
      icon: "❄️",
      mass: 18,
      cost: 12,
      description: "Pumped closed-loop coolant pipes routing waste heat to dedicated space-facing radiators. Required for high-power avionics and radar."
    },
    {
      id: "cryo",
      name: "Cryogenic Stirling Mechanical Cooler",
      icon: "🧊",
      mass: 34,
      cost: 28,
      description: "Active mechanical refrigeration cooling sensors down to <15 Kelvin. Indispensable for infrared detectors to prevent detector self-glow."
    }
  ],

  // Command & Data Handling (C&DH)
  computers: [
    {
      id: "basic-comp",
      name: "Rad-Tolerant Microcontroller (32 GB Flash)",
      icon: "💾",
      mass: 3,
      cost: 4,
      dataStorage: 32, // GB
      power: 6,
      description: "Low-overhead embedded system. Sufficient for CubeSats and low-data field particle instruments."
    },
    {
      id: "standard-comp",
      name: "Radiation-Hardened Dual-Core Processor (256 GB)",
      icon: "💻",
      mass: 6,
      cost: 10,
      dataStorage: 256,
      power: 15,
      description: "Industry-standard flight computer with error-correcting memory (ECC) and real-time operating system (RTOS)."
    },
    {
      id: "advanced-comp",
      name: "High-Performance Edge AI Flight System (1.5 TB)",
      icon: "🧠",
      mass: 10,
      cost: 24,
      dataStorage: 1536,
      power: 32,
      description: "FPGA-accelerated onboard computer capable of real-time data compression, optical cloud masking, and autonomous obstacle navigation."
    }
  ],

  // Attitude Determination and Control System (ADCS)
  attitudeControls: [
    {
      id: "spin",
      name: "Spin-Stabilization & Magnetic Torquers",
      icon: "🌀",
      pointingAccuracy: 1800, // arcseconds (~0.5 deg)
      mass: 6,
      cost: 5,
      power: 4,
      type: "spin",
      description: "Spacecraft rotates about its primary axis for gyroscopic stability. Low cost and rugged, but cannot hold optical cameras steady on a target."
    },
    {
      id: "3axis",
      name: "3-Axis Reaction Wheels & Sun Sensors",
      icon: "🎯",
      pointingAccuracy: 45, // arcsec
      mass: 16,
      cost: 16,
      power: 15,
      type: "3axis",
      description: "Internal reaction wheels control roll, pitch, and yaw. Enables slewing toward science targets and precise Earth/Sun pointing."
    },
    {
      id: "precision",
      name: "Fine Guidance Star Trackers & Control Moment Gyros",
      icon: "✨",
      pointingAccuracy: 1, // arcsec (ultra-fine)
      mass: 28,
      cost: 32,
      power: 28,
      type: "precision",
      description: "Sub-arcsecond pointing stability using autonomous star field matching and micro-thruster counter-jitter. Required for space telescopes."
    }
  ],

  // Propulsion Subsystem
  propulsionSystems: [
    {
      id: "no-prop",
      name: "None (Passive Orbit / Atmospheric Drag End-of-Life)",
      icon: "❌",
      deltaV: 0,
      mass: 0,
      cost: 0,
      power: 0,
      description: "No dedicated propulsion. Saves mass and money, but cannot perform collision avoidance, orbit raising, or disposal burns."
    },
    {
      id: "cold-gas",
      name: "Cold Gas Reaction Control Thrusters",
      icon: "💨",
      deltaV: 60, // m/s
      mass: 6,
      cost: 4,
      power: 2,
      description: "Pressurized nitrogen gas thrusters. Very simple, non-toxic, and reliable for small attitude tweaks and initial detumble."
    },
    {
      id: "chemical",
      name: "Hydrazine Monopropellant / Bipropellant System",
      icon: "🔥",
      deltaV: 420, // m/s
      mass: 32,
      cost: 18,
      power: 5,
      description: "High-thrust chemical rocket engine. Delivers rapid velocity increments for orbital insertion, planetary capture, and de-orbit disposal."
    },
    {
      id: "ion",
      name: "Hall-Effect Xenon Electric Propulsion",
      icon: "⚡",
      deltaV: 3200, // m/s
      mass: 22,
      cost: 38,
      power: 220,
      description: "Electrostatic accelerator yielding ten-fold higher propellant efficiency (Isp ~2500 s). High power draw, but delivers immense total delta-V over time."
    }
  ],

  // Antennas
  antennas: [
    {
      id: "dipole",
      name: "Omnidirectional Dipole Antenna",
      icon: "📶",
      gain: 2,
      dataRate: 0.15, // Mbps
      mass: 1,
      cost: 1,
      description: "Sends and receives signals in virtually all directions. Zero pointing required, but very slow data transmission."
    },
    {
      id: "patch",
      name: "Microstrip Patch Antenna Array",
      icon: "📡",
      gain: 10,
      dataRate: 3.0,
      mass: 3,
      cost: 4,
      description: "Flat, lightweight conformal antenna. Moderate gain with broad beamwidth for reliable medium-rate science passes."
    },
    {
      id: "parabolic",
      name: "0.8m Steerable Parabolic Dish",
      icon: "🛰️",
      gain: 28,
      dataRate: 20.0,
      mass: 10,
      cost: 10,
      description: "Directional dish antenna capable of slewing toward ground stations. High data throughput with moderate pointing precision."
    },
    {
      id: "hga",
      name: "2.4m High-Gain Deployable Reflector (HGA)",
      icon: "🔭",
      gain: 42,
      dataRate: 150.0,
      mass: 28,
      cost: 22,
      description: "Large mesh parabolic reflector delivering immense link margin over lunar and deep-space interplanetary distances."
    }
  ],

  // Communications Frequency Bands
  frequencyBands: [
    {
      id: "uhf",
      name: "UHF Band (400 MHz)",
      icon: "📻",
      maxDataRate: 1.0, // Mbps
      cost: 2,
      description: "Broad beamwidth, low rain attenuation, simple ground equipment. Best suited for emergency beaconing and low-rate telemetry."
    },
    {
      id: "s-band",
      name: "S-Band (2.2 GHz)",
      icon: "📡",
      maxDataRate: 12.0,
      cost: 6,
      description: "NASA near-Earth tracking network standard. Excellent balance of antenna size, link reliability, and command uplink."
    },
    {
      id: "x-band",
      name: "X-Band (8.4 GHz)",
      icon: "⚡",
      maxDataRate: 60.0,
      cost: 14,
      description: "Standard planetary and deep-space science band. High bandwidth density and compatibility with NASA Deep Space Network."
    },
    {
      id: "ka-band",
      name: "Ka-Band (26–40 GHz)",
      icon: "🌐",
      maxDataRate: 200.0,
      cost: 24,
      description: "Ultra-wide broadband radio spectrum. Enables massive scientific data dumps, but requires precise pointing and is vulnerable to rain fade."
    }
  ],

  // Ground Station Networks
  groundStations: [
    {
      id: "single",
      name: "Single Primary Ground Station",
      icon: "🏠",
      coverage: 5.5, // hours/day visible contact
      cost: 5,
      description: "Single tracking station site (e.g., Wallops or Svalbard). Contact occurs only during orbital passes directly overhead (~4-6 passes daily)."
    },
    {
      id: "network",
      name: "Global Commercial Ground Network",
      icon: "🌍",
      coverage: 15.0,
      cost: 16,
      description: "Distributed array of 12+ ground stations across Europe, Americas, Australia, and Antarctica, slashing data downlink latency."
    },
    {
      id: "dsn",
      name: "NASA Deep Space Network (DSN)",
      icon: "🌌",
      coverage: 22.0,
      cost: 32,
      description: "Colossal 34m and 70m parabolic dishes in Goldstone (CA), Madrid (Spain), and Canberra (Australia). The gold standard for deep space missions."
    }
  ],

  // Launch Vehicles
  launchVehicles: [
    {
      id: "scout",
      name: "Scout Small Rocket",
      icon: "🚀",
      payloadLEO: 320, // kg
      payloadGTO: 90,
      cost: 10, // $M
      reliability: 0.93,
      maxOrbitTypes: ["LEO", "SSO"],
      description: "Low-cost small satellite launcher. Fast schedule turn-around, but strictly limited to lightweight low Earth orbit payloads."
    },
    {
      id: "pathfinder",
      name: "Pathfinder Medium-Light Rocket",
      icon: "🚀",
      payloadLEO: 1800,
      payloadGTO: 750,
      cost: 28,
      reliability: 0.96,
      maxOrbitTypes: ["LEO", "SSO", "MEO", "HEO"],
      description: "Versatile medium launch vehicle capable of deploying small constellations or dedicated scientific probes up to high orbits."
    },
    {
      id: "workhorse",
      name: "Workhorse Heavy (Falcon / Atlas Class)",
      icon: "🚀",
      payloadLEO: 16000,
      payloadGTO: 6200,
      cost: 70,
      reliability: 0.99,
      maxOrbitTypes: ["LEO", "SSO", "MEO", "GEO", "HEO", "lunar"],
      description: "The premier reusable orbital workhorse. Exceptional reliability record and huge payload lift capacity for flagship payloads."
    },
    {
      id: "titan",
      name: "Titan Deep-Space Heavy Launcher",
      icon: "🚀",
      payloadLEO: 28000,
      payloadGTO: 11000,
      cost: 130,
      reliability: 0.97,
      maxOrbitTypes: ["LEO", "SSO", "MEO", "GEO", "HEO", "lunar", "L2"],
      description: "Heavy three-core liquid booster with cryogenic high-energy upper stage for direct lunar or planetary injection trajectories."
    },
    {
      id: "colossus",
      name: "Colossus Super-Heavy Flagship Rocket",
      icon: "🚀",
      payloadLEO: 85000,
      payloadGTO: 32000,
      cost: 320,
      reliability: 0.96,
      maxOrbitTypes: ["LEO", "SSO", "MEO", "GEO", "HEO", "lunar", "L2"],
      description: "Unprecedented super-heavy lift capacity. Can launch massive space observatories with unfurled mirrors directly to deep space L2 orbits."
    }
  ],

  // Random In-Flight Operational Events & Trade-off Decisions
  events: [
    {
      id: "solar-storm",
      title: "⚠️ Major Coronal Mass Ejection (Solar Storm)",
      phase: "science",
      probability: 0.22,
      description: "Space weather forecasters at NOAA detect an X-class solar flare barreling toward your spacecraft. Severe proton flux is imminent.",
      choices: [
        {
          text: "Safe Mode: Slew into sun-pointing survival attitude & power down sensitive instruments.",
          effects: {
            scienceChange: -15,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Spacecraft rode out the storm safely. Lost 4 days of science data, but all instruments survived intact."
          }
        },
        {
          text: "Ride the Wave: Keep observing to capture unprecedented solar storm physics in real-time.",
          effects: {
            scienceChange: +35,
            powerChange: -8,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: "random-degrade",
            description: "Groundbreaking solar storm data collected! However, high radiation degraded solar cell efficiency by 8% and caused sensor noise."
          }
        }
      ]
    },
    {
      id: "debris-conjunction",
      title: "🛰️ Orbital Debris Conjunction Alert",
      phase: "early-ops",
      probability: 0.20,
      description: "US Space Command notifies Mission Control: a defunct rocket upper stage fragment will pass within 45 meters of the spacecraft.",
      choices: [
        {
          text: "Perform Collision Avoidance Burn using onboard propulsion.",
          effects: {
            scienceChange: 0,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: -45, // Burns fuel reserve
            instrumentFailure: null,
            description: "Propellant burn successfully shifted trajectory with 2.8 km miss distance. Fuel reserve lowered, trimming operational lifetime."
          }
        },
        {
          text: "Cross Fingers: Do not burn fuel; probability of collision is 0.08%.",
          effects: {
            scienceChange: 0,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: "random-chance",
            description: "Debris zoomed past harmlessly! Fuel reserves conserved, though Flight Dynamics team lost sleep."
          }
        }
      ]
    },
    {
      id: "reaction-wheel-friction",
      title: "⚙️ Reaction Wheel #2 Bearing Friction Anomaly",
      phase: "science",
      probability: 0.25,
      description: "Telemetry indicates torque ripple and temperature rise in primary reaction wheel #2. Bearing lubrication failure is suspected.",
      choices: [
        {
          text: "Switch to 3-wheel cross-strapped degraded control algorithm.",
          effects: {
            scienceChange: -10,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Wheel preserved by operating at reduced RPM. Pointing jitter increased slightly, reducing fine optical resolution."
          }
        },
        {
          text: "Upload experimental micro-stepping firmware patch to redistribute lubricant.",
          effects: {
            scienceChange: +10,
            powerChange: 0,
            budgetChange: -3, // Engineering overtime
            lifetimeChange: +60,
            instrumentFailure: null,
            description: "Firmware worked like magic! Reaction wheel friction normalized, extending operational longevity."
          }
        }
      ]
    },
    {
      id: "serendipitous-discovery",
      title: "✨ Serendipitous Transient Science Discovery!",
      phase: "science",
      probability: 0.28,
      description: "Your instruments detect an unexpected anomalous flare: a nearby stellar gamma-ray burst or sudden icy plume eruption!",
      choices: [
        {
          text: "Interrupt scheduled survey to dedicate 100% instrument cadence to the target of opportunity.",
          effects: {
            scienceChange: +45,
            powerChange: -4,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Front-page Science journal discovery! The rapid retargeting yielded extraordinary data on early transient physics."
          }
        },
        {
          text: "Stick to the baseline baseline mission plan; do not disrupt scheduled science cycles.",
          effects: {
            scienceChange: +5,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Survey proceeded steadily with 100% timeline fidelity. Peer researchers regret missing the rare event."
          }
        }
      ]
    },
    {
      id: "ground-station-outage",
      title: "📡 Polar Ground Station Fiber Sever",
      phase: "science",
      probability: 0.18,
      description: "An undersea fiber optic break disables the Svalbard tracking station. Onboard solid-state data recorder is at 88% capacity.",
      choices: [
        {
          text: "Emergency DSN Relay: Purchase priority deep-space dish time from NASA.",
          effects: {
            scienceChange: +10,
            powerChange: 0,
            budgetChange: -5,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "DSN downlink prevented recorder overflow. Science returned seamlessly at modest budget expense."
          }
        },
        {
          text: "Enable lossy onboard data compression algorithm to fit incoming data.",
          effects: {
            scienceChange: -8,
            powerChange: -2,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Compression kept buffer within safety limits with minor loss of high-frequency spatial detail."
          }
        }
      ]
    },
    {
      id: "budget-review",
      title: "🏛️ Congressional Space Appropriations Review",
      phase: "early-ops",
      probability: 0.22,
      description: "NASA Headquarters conducts mid-term fiscal review. The committee evaluates science return versus cost expenditure.",
      choices: [
        {
          text: "Present stellar early telemetry and request $15M extended operations reserve.",
          effects: {
            scienceChange: +12,
            powerChange: 0,
            budgetChange: +15,
            lifetimeChange: +90,
            instrumentFailure: null,
            description: "Appropriations committee praised mission performance! Granted $15M operational extension budget."
          }
        },
        {
          text: "Reaffirm current budget envelope without requesting modifications.",
          effects: {
            scienceChange: 0,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Mission status acknowledged as stable. No budget changes enacted."
          }
        }
      ]
    },
    {
      id: "solar-panel-micrometeoroid",
      title: "⚡ Micrometeoroid Strike on Solar Wing Array",
      phase: "science",
      probability: 0.20,
      description: "A millimeter-sized interplanetary dust grain punctured solar panel string #4, causing an immediate 5% drop in total power bus voltage.",
      choices: [
        {
          text: "Isolate damaged string and reconfigure peak-power tracker.",
          effects: {
            scienceChange: 0,
            powerChange: -5,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Electrical short isolated without cascading. Bus voltage stabilized at 95% capacity."
          }
        },
        {
          text: "Cycle battery depth-of-discharge deeper during eclipses to offset deficit.",
          effects: {
            scienceChange: +5,
            powerChange: -2,
            budgetChange: 0,
            lifetimeChange: -30,
            instrumentFailure: null,
            description: "Full instrument schedule maintained, but accelerated battery chemical degradation cuts mission margin."
          }
        }
      ]
    },
    {
      id: "cosmic-ray-bitflip",
      title: "💻 Single Event Upset (SEU) in Flight Memory",
      phase: "science",
      probability: 0.24,
      description: "A cosmic ray particle flipped a critical bit in volatile memory, triggering an autonomous system reboot and diagnostic freeze.",
      choices: [
        {
          text: "Command complete warm restart from non-volatile EEPROM image.",
          effects: {
            scienceChange: -5,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Reboot restored nominal telemetry within 18 hours. Minor scientific downtime."
          }
        },
        {
          text: "Execute low-level memory dump and patch affected memory bank online.",
          effects: {
            scienceChange: +8,
            powerChange: 0,
            budgetChange: -2,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Brilliant patch! Flight software team patched the anomaly without halting background observations."
          }
        }
      ]
    },
    {
      id: "optics-outgassing",
      title: "🌫️ Optical Sensor Molecular Contamination",
      phase: "early-ops",
      probability: 0.19,
      description: "Volatile adhesives are outgassing in vacuum, leaving a microscopic haze on high-resolution camera primary lens optics.",
      choices: [
        {
          text: "Activate high-temperature survival de-ice heaters to bake off condensates.",
          effects: {
            scienceChange: +15,
            powerChange: -6,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Decontaminate bake-out cleared optics completely! Imaging contrast restored to 100% design spec."
          }
        },
        {
          text: "Calibrate optics mathematically using dark-sky flat-field post-processing.",
          effects: {
            scienceChange: -6,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Saved electrical heater power, but fine spatial contrast suffered minor reduction in signal-to-noise."
          }
        }
      ]
    },
    {
      id: "extended-mission-offer",
      title: "🚀 Senior Review: Extended Mission Authorization",
      phase: "extended",
      probability: 0.35,
      description: "Having fulfilled all primary mission science objectives, NASA invites proposal for a 1-year Extended Science Phase.",
      choices: [
        {
          text: "Accept Extended Mission: Squeeze every drop of science until propellant exhaustion.",
          effects: {
            scienceChange: +30,
            powerChange: -5,
            budgetChange: +8,
            lifetimeChange: +180,
            instrumentFailure: null,
            description: "Mission extended! Bonus scientific return achieved, earning highest scientific community accolades."
          }
        },
        {
          text: "Conclude primary mission gracefully: Fire controlled de-orbit burn to avoid space debris.",
          effects: {
            scienceChange: +10,
            powerChange: 0,
            budgetChange: 0,
            lifetimeChange: 0,
            instrumentFailure: null,
            description: "Spacecraft executed textbook end-of-life disposal into the South Pacific spacecraft cemetery. Exemplary stewardship!"
          }
        }
      ]
    }
  ],

  // Game Difficulties
  difficulties: [
    {
      id: "cadet",
      name: "Space Cadet (Introductory)",
      icon: "🌟",
      budget: 650, // $M
      eventFrequency: 0.15,
      description: "Generous budget and forgiving engineering margins. Perfect for learning space systems trade-offs without instant mission failure."
    },
    {
      id: "engineer",
      name: "Mission Systems Engineer (Realistic)",
      icon: "⚙️",
      budget: 420,
      eventFrequency: 0.30,
      description: "Realistic NASA Class-B/C mission constraints. Demands strict mass, power, and pointing margin management."
    },
    {
      id: "director",
      name: "NASA Flight Director (Hardcore)",
      icon: "🎯",
      budget: 270,
      eventFrequency: 0.50,
      description: "Tight fiscal limits, frequent orbital anomalies, and unforgiving launch margins. Only optimal engineering designs will succeed."
    }
  ],

  // Collaborative Player Roles (1 to 4 Players)
  roles: [
    {
      id: "director",
      name: "Mission Director / Systems Lead",
      icon: "👨‍✈️",
      color: "#4fc3f7",
      description: "Owns overall mission strategy, fiscal budget allocation, risk management, and launch vehicle selection.",
      responsibilities: [
        "Selects mission objective and launch vehicle",
        "Balances overall budget ceiling and schedules",
        "Authorizes high-risk anomaly responses during flight"
      ]
    },
    {
      id: "engineer",
      name: "Chief Spacecraft Engineer",
      icon: "🔧",
      color: "#7c4dff",
      description: "Oversees structural bus, power generation, thermal control, and propulsion delta-V budgets.",
      responsibilities: [
        "Ensures mass does not exceed launch vehicle payload capacity",
        "Maintains positive power margin across day and eclipse phases",
        "Selects propulsion and thermal stabilization hardware"
      ]
    },
    {
      id: "scientist",
      name: "Principal Science Investigator",
      icon: "🔬",
      color: "#00c853",
      description: "Selects scientific payload instruments to maximize discovery return and satisfy mission requirements.",
      responsibilities: [
        "Chooses instruments matching mission science goals",
        "Ensures required observation categories are fulfilled",
        "Monitors science telemetry return and calibration"
      ]
    },
    {
      id: "comms",
      name: "Communications & Avionics Officer",
      icon: "📡",
      color: "#ff9100",
      description: "Manages attitude pointing stability, telemetry link budget, onboard data storage, and ground networks.",
      responsibilities: [
        "Matches ADCS pointing precision to instrument requirements",
        "Ensures downlink throughput matches daily science data generation",
        "Configures radio bands, antennas, and ground stations"
      ]
    }
  ],

  // Real NASA Missions for Final Comparison
  realMissions: {
    "sentinel-e": {
      name: "Landsat-9 / Sentinel-2 / Terra",
      description: "NASA and USGS flagship Earth-observing satellites in polar sun-synchronous orbits, monitoring land use, glacial melt, and ecosystem health."
    },
    "stormwatch": {
      name: "GOES-16 / GOES-18 (Geostationary Operational Environmental Satellites)",
      description: "NASA and NOAA weather satellites in GEO providing continuous high-speed imagery of storms, hurricanes, and severe lightning across the Americas."
    },
    "artemis-scout": {
      name: "Lunar Reconnaissance Orbiter (LRO) & Lunar Trailblazer",
      description: "NASA probes orbiting the Moon to map surface topography, evaluate cold-trap water ice deposits, and scout safe landing sites for Artemis astronauts."
    },
    "red-pioneer": {
      name: "Mars Reconnaissance Orbiter (MRO) & Mars Express",
      description: "Historic interplanetary orbiters utilizing Shallow Radar (SHARAD) and HiRISE optical cameras to discover subsurface ice and future human landing zones."
    },
    "asteroid-guard": {
      name: "NEO Surveyor & WISE / NEOWISE",
      description: "Space-based infrared survey missions hunting dark, hazardous near-Earth asteroids and comets that approach inside the orbit of Earth."
    },
    "deepview": {
      name: "James Webb Space Telescope (JWST) & Nancy Grace Roman",
      description: "Flagship infrared space observatories situated at Sun-Earth L2, peering back to cosmic dawn, imaging primordial stars, and probing exoplanetary atmospheres."
    }
  }
};

console.log("[MissionControl] GameData loaded:", Object.keys(window.GameData).length, "categories available");
