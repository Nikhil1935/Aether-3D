import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.count = 5000;
        this.particles = null;
        this.geometry = null;
        this.material = null;

        this.originalPositions = new Float32Array(this.count * 3);
        this.targetPositions = new Float32Array(this.count * 3);
        this.currentPositions = new Float32Array(this.count * 3);
        this.colors = new Float32Array(this.count * 3);

        this.templates = {
            sphere: this.generateSphere.bind(this),
            heart: this.generateHeart.bind(this),
            flower: this.generateFlower.bind(this),
            sun: this.generateSun.bind(this),
            saturn: this.generateSaturn.bind(this),
            shuttlecock: this.generateShuttlecock.bind(this),
            lamp: this.generateLamp.bind(this),
            fireworks: this.generateFireworks.bind(this),

            // New Shapes (30+)
            cube: this.generateCube.bind(this),
            pyramid: this.generatePyramid.bind(this),
            torus: this.generateTorus.bind(this),
            cylinder: this.generateCylinder.bind(this),
            cone: this.generateCone.bind(this),
            helix: this.generateHelix.bind(this),
            dna: this.generateDNA.bind(this),
            wave: this.generateWave.bind(this),
            grid: this.generateGrid.bind(this),
            vortex: this.generateVortex.bind(this),
            tornado: this.generateTornado.bind(this),
            galaxy: this.generateGalaxy.bind(this),
            atom: this.generateAtom.bind(this),
            star: this.generateStar.bind(this),
            diamond: this.generateDiamond.bind(this),
            hourglass: this.generateHourglass.bind(this),
            tree: this.generateTree.bind(this),
            cloud: this.generateCloud.bind(this),
            rain: this.generateRain.bind(this),
            snow: this.generateSnow.bind(this),
            shield: this.generateShield.bind(this),
            sword: this.generateSword.bind(this),
            ghost: this.generateGhost.bind(this),
            portal: this.generatePortal.bind(this),
            blackhole: this.generateBlackhole.bind(this),
            ring: this.generateRing.bind(this),
            buckyball: this.generateBuckyball.bind(this),
            mushroom: this.generateMushroom.bind(this),
            ufo: this.generateUFO.bind(this),
            crown: this.generateCrown.bind(this)
        };

        this.currentTemplate = 'sphere';
        this.time = 0;

        // Relative Zoom State
        this.globalScale = 1.0;
        this.isPinchLocked = false;
        this.pinchStartSpread = 0;
        this.pinchStartScale = 1.0;

        // Auto Rotation
        this.isAutoRotating = false;
        this.rotationSpeed = 0.02;
        this.autoRotationAccumulator = 0; // New accumulator for continuous spin

        // Manual Rotation
        this.rotationX = 0;
        this.rotationY = 0; // Manual offset

        // Position Lock Logic
        this.isPositionLocked = false;
        this.lockedTargetX = 0;
        this.lockedTargetY = 0;

        // Interaction Activation Logic
        this.isControlActive = false;
        this.sawOpenPalm = false;
    }

    addTemplate(name, func) {
        this.templates[name] = func.bind(this);
    }

    init() {
        this.geometry = new THREE.BufferGeometry();

        // Initial State: Random Sphere
        this.generateSphere(this.originalPositions);
        this.generateSphere(this.targetPositions); // Start target as sphere too

        // Copy to current
        this.currentPositions.set(this.originalPositions);

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        // Create a soft glow texture (programmatic)
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        const texture = new THREE.CanvasTexture(canvas);

        this.material = new THREE.PointsMaterial({
            size: 0.15,
            map: texture,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.8
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);
    }

    switchTemplate(name) {
        if (this.templates[name] && name !== this.currentTemplate) {
            this.currentTemplate = name;
            const positions = new Float32Array(this.count * 3);
            this.templates[name](positions);

            // We set the NEW target. The update loop will lerp towards it.
            this.targetPositions.set(positions);
            console.log(`Switched to ${name}`);
        }
    }

    generateSphere(arr) {
        for (let i = 0; i < this.count; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.count);
            const theta = Math.sqrt(this.count * Math.PI) * phi;
            const r = 2; // radius

            arr[i * 3] = r * Math.cos(theta) * Math.sin(phi);
            arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            arr[i * 3 + 2] = r * Math.cos(phi);
        }
    }

    generateHeart(arr) {
        for (let i = 0; i < this.count; i++) {
            // Random distribution for volume
            const t = Math.random() * Math.PI * 2;
            const u = Math.random() * Math.PI;

            // Heart formula 3D (approx)
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = (Math.random() - 0.5) * 5;

            const scale = 0.15;
            arr[i * 3] = x * scale;
            arr[i * 3 + 1] = y * scale;
            arr[i * 3 + 2] = z * scale;
        }
    }

    generateFlower(arr) {
        for (let i = 0; i < this.count; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI;
            const r = 2 + Math.sin(5 * u) * Math.sin(5 * v); // Petal modulation

            arr[i * 3] = r * Math.sin(v) * Math.cos(u);
            arr[i * 3 + 1] = r * Math.sin(v) * Math.sin(u);
            arr[i * 3 + 2] = r * Math.cos(v);
        }
    }

    generateSun(arr) {
        for (let i = 0; i < this.count; i++) {
            // Core
            const radius = 1.0;
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            // 70% Core
            if (i < this.count * 0.7) {
                const r = radius * (0.8 + Math.random() * 0.4);
                arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                arr[i * 3 + 2] = r * Math.cos(phi);
            } else {
                // Rays
                const r = radius * (1.5 + Math.random() * 2.0);
                arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                arr[i * 3 + 2] = r * Math.cos(phi);
            }
        }
    }

    generateSaturn(arr) {
        // Planet + Ring
        const ringRatio = 0.4; // 40% particles in ring
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * (1 - ringRatio)) {
                // Planet Sphere
                const phi = Math.acos(-1 + (2 * i) / (this.count * (1 - ringRatio)));
                const theta = Math.sqrt(this.count * Math.PI) * phi;
                const r = 1.2;
                arr[i * 3] = r * Math.cos(theta) * Math.sin(phi);
                arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
                arr[i * 3 + 2] = r * Math.cos(phi);
            } else {
                // Ring
                const angle = Math.random() * Math.PI * 2;
                const dist = 2.0 + Math.random() * 1.5;
                arr[i * 3] = dist * Math.cos(angle);
                arr[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Flat Y
                arr[i * 3 + 2] = dist * Math.sin(angle);

                // Tilt the ring
                const x = arr[i * 3];
                const y = arr[i * 3 + 1];
                const c = Math.cos(0.4); // tilt angle
                const s = Math.sin(0.4);
                arr[i * 3] = x;
                arr[i * 3 + 1] = y * c - arr[i * 3 + 2] * s; // rotate around X
            }
        }
    }

    generateShuttlecock(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.2) {
                // Cork (Sphere/Semisphere)
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);
                const r = 0.5;
                arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 1.5; // Shift down
                arr[i * 3 + 2] = r * Math.cos(phi);
            } else {
                // Feathers (Cone)
                // x^2 + z^2 = (y * tan(alpha))^2
                const h = Math.random() * 2.0; // Height 0 to 2
                const rBase = 0.5;
                const rTop = 1.5;
                const ratio = h / 2.0;
                const r = rBase + (rTop - rBase) * ratio;
                const angle = Math.random() * Math.PI * 2;

                arr[i * 3] = r * Math.cos(angle);
                arr[i * 3 + 1] = h - 1.2; // Shift
                arr[i * 3 + 2] = r * Math.sin(angle);
            }
        }
    }

    generateLamp(arr) {
        for (let i = 0; i < this.count; i++) {
            // 3 parts: Base, Stem, Shade
            const p = i / this.count;
            if (p < 0.2) {
                // Base (Cylinder/Disk)
                const r = Math.sqrt(Math.random()) * 0.8;
                const angle = Math.random() * Math.PI * 2;
                arr[i * 3] = r * Math.cos(angle);
                arr[i * 3 + 1] = -1.5; // Bottom
                arr[i * 3 + 2] = r * Math.sin(angle);
            } else if (p < 0.4) {
                // Stem (Line)
                const r = 0.1;
                const angle = Math.random() * Math.PI * 2;
                const h = Math.random() * 2.0;
                arr[i * 3] = r * Math.cos(angle);
                arr[i * 3 + 1] = -1.5 + h;
                arr[i * 3 + 2] = r * Math.sin(angle);
            } else {
                // Shade (Cone)
                // y from 0.5 to 1.5
                const h = Math.random(); // 0 to 1
                const y = 0.5 + h;
                const rBot = 0.4;
                const rTop = 1.2;
                const r = rBot + (rTop - rBot) * h;
                const angle = Math.random() * Math.PI * 2;
                arr[i * 3] = r * Math.cos(angle);
                arr[i * 3 + 1] = y;
                arr[i * 3 + 2] = r * Math.sin(angle);
            }
        }
    }

    // ------------------------------------------------------------------------
    // NEW SHAPE GENERATORS (30+)
    // ------------------------------------------------------------------------

    generateCube(arr) {
        const side = Math.cbrt(this.count); // Cube root for distribution
        const step = 3.0 / side; // Size 3
        let idx = 0;
        for (let i = 0; i < this.count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 3;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 3;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
        }
    }

    generatePyramid(arr) {
        for (let i = 0; i < this.count; i++) {
            const h = Math.random() * 2; // Height 0 to 2
            const y = h - 1;
            const r = (2 - h) * 0.8; // Radius shrinks as height goes up
            const angle = Math.random() * Math.PI * 2;
            arr[i * 3] = r * Math.cos(angle) * (Math.random() > 0.5 ? 1 : Math.sin(angle)); // Square-ish base
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(angle);
        }
    }

    generateTorus(arr) {
        const R = 1.5; // Major radius
        const r = 0.5; // Minor radius
        for (let i = 0; i < this.count; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            arr[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
            arr[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
            arr[i * 3 + 2] = r * Math.sin(v);
        }
    }

    generateCylinder(arr) {
        for (let i = 0; i < this.count; i++) {
            const h = (Math.random() - 0.5) * 3;
            const theta = Math.random() * Math.PI * 2;
            const r = 1.0;
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = h;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateCone(arr) {
        for (let i = 0; i < this.count; i++) {
            const h = Math.random() * 3; // 0 to 3
            const y = h - 1.5;
            const r = (3 - h) * 0.4;
            const theta = Math.random() * Math.PI * 2;
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateHelix(arr) {
        for (let i = 0; i < this.count; i++) {
            const t = (i / this.count) * Math.PI * 10; // 5 winds
            const r = 1.0;
            arr[i * 3] = r * Math.cos(t);
            arr[i * 3 + 1] = (i / this.count) * 4 - 2;
            arr[i * 3 + 2] = r * Math.sin(t);
        }
    }

    generateDNA(arr) {
        for (let i = 0; i < this.count; i++) {
            const t = (i / this.count) * Math.PI * 10;
            const y = (i / this.count) * 4 - 2;
            const offset = (i % 2 === 0) ? 0 : Math.PI; // Double helix
            const r = 1.0;
            arr[i * 3] = r * Math.cos(t + offset);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(t + offset);

            // Rungs
            if (i % 50 < 10) {
                arr[i * 3] *= Math.random();
                arr[i * 3 + 2] *= Math.random();
            }
        }
    }

    generateWave(arr) {
        const size = Math.sqrt(this.count);
        for (let i = 0; i < this.count; i++) {
            const x = (Math.random() - 0.5) * 4;
            const z = (Math.random() - 0.5) * 4;
            const y = Math.sin(x * 2 + z) * 0.5;
            arr[i * 3] = x;
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = z;
        }
    }

    generateGrid(arr) {
        for (let i = 0; i < this.count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 4;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
    }

    generateVortex(arr) {
        for (let i = 0; i < this.count; i++) {
            const t = Math.random() * Math.PI * 4;
            const y = (t / (Math.PI * 4)) * 3 - 2;
            const r = Math.abs(y) + 0.1;
            arr[i * 3] = r * Math.cos(t * 3);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(t * 3);
        }
    }

    generateTornado(arr) {
        for (let i = 0; i < this.count; i++) {
            const h = Math.random() * 4; // 0 to 4
            const y = h - 2;
            const r = 0.2 + h * 0.3;
            const theta = Math.random() * Math.PI * 10; // winding
            arr[i * 3] = r * Math.cos(theta + y * 2);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(theta + y * 2);
        }
    }

    generateGalaxy(arr) {
        const arms = 3;
        for (let i = 0; i < this.count; i++) {
            const arm = i % arms;
            const dist = Math.random();
            const theta = (dist * Math.PI * 2 * 2) + (arm * (Math.PI * 2 / arms));
            const r = dist * 2.5;
            const fuzz = 0.2;
            arr[i * 3] = r * Math.cos(theta) + (Math.random() - 0.5) * fuzz;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Flat
            arr[i * 3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * fuzz;
        }
    }

    generateAtom(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.2) {
                // Nucleus
                const r = Math.random() * 0.3;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                arr[i * 3 + 2] = r * Math.cos(phi);
            } else {
                // Shells
                const shell = (i % 3);
                const r = 1.0 + shell * 0.5;
                const theta = Math.random() * Math.PI * 2;
                // Tilt planes
                let x = r * Math.cos(theta);
                let y = r * Math.sin(theta);
                let z = 0;

                // Rotations per shell
                if (shell === 0) { /* xy plane */ }
                if (shell === 1) { let tmpy = y; y = z; z = tmpy; } // xz plane
                if (shell === 2) { let tmpx = x; x = z; z = tmpx; } // yz plane

                arr[i * 3] = x;
                arr[i * 3 + 1] = y;
                arr[i * 3 + 2] = z;
            }
        }
    }

    generateStar(arr) {
        for (let i = 0; i < this.count; i++) {
            // 5 point star logic approx
            const angle = Math.random() * Math.PI * 2;
            const rBase = 1.5; // tips
            const rInner = 0.5;
            // modulation 5 times
            const r = rInner + (rBase - rInner) * Math.pow(Math.cos(angle * 2.5), 2);
            arr[i * 3] = r * Math.cos(angle);
            arr[i * 3 + 1] = r * Math.sin(angle);
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
    }

    generateDiamond(arr) {
        for (let i = 0; i < this.count; i++) {
            // Octahedron
            const h = (Math.random() - 0.5) * 3;
            const absH = Math.abs(h);
            const r = 1.5 * (1.5 - absH);
            const theta = Math.random() * Math.PI * 2;
            if (r < 0) { arr[i * 3] = 0; arr[i * 3 + 1] = h; arr[i * 3 + 2] = 0; continue; }
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = h;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateHourglass(arr) {
        for (let i = 0; i < this.count; i++) {
            const y = (Math.random() - 0.5) * 3;
            const r = Math.abs(y) + 0.1;
            const theta = Math.random() * Math.PI * 2;
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateTree(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.2) {
                // Trunk
                arr[i * 3] = (Math.random() - 0.5) * 0.3;
                arr[i * 3 + 1] = (Math.random() * 1.5) - 2; // -2 to -0.5
                arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            } else {
                // Cone Leaves
                const h = Math.random(); // 0 to 1
                const y = -0.5 + h * 2.5;
                const r = (1 - h) * 1.5;
                const theta = Math.random() * Math.PI * 2;
                arr[i * 3] = r * Math.cos(theta);
                arr[i * 3 + 1] = y;
                arr[i * 3 + 2] = r * Math.sin(theta);
            }
        }
    }

    generateCloud(arr) {
        // Multi-sphere
        const centers = [
            { x: 0, y: 0, z: 0, r: 1 },
            { x: 1, y: 0.2, z: 0, r: 0.8 },
            { x: -1, y: 0.1, z: 0, r: 0.9 },
            { x: 0.5, y: 0.8, z: 0.5, r: 0.7 },
            { x: -0.5, y: 0.7, z: -0.5, r: 0.7 }
        ];
        for (let i = 0; i < this.count; i++) {
            const c = centers[i % centers.length];
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = c.r * Math.cbrt(Math.random());
            arr[i * 3] = c.x + r * Math.sin(phi) * Math.cos(theta);
            arr[i * 3 + 1] = c.y + r * Math.sin(phi) * Math.sin(theta);
            arr[i * 3 + 2] = c.z + r * Math.cos(phi);
        }
    }

    generateRain(arr) {
        for (let i = 0; i < this.count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 4;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
            // Make them lines visually by alignment? 
            // Better: just thin cylinder.
            // Actually just random volume is fine, animation makes it rain.
            // But static shape:
            arr[i * 3 + 1] = (Math.random() * 4) - 2;
        }
    }

    generateSnow(arr) {
        // Same as rain but just uniform distribution in box
        this.generateCube(arr);
    }

    generateShield(arr) {
        for (let i = 0; i < this.count; i++) {
            // Curved surface
            const theta = (Math.random() - 0.5) * Math.PI; // Half circle
            const phi = (Math.random() - 0.5) * Math.PI * 0.8;
            const r = 1.5;
            arr[i * 3] = r * Math.sin(theta);
            arr[i * 3 + 1] = r * Math.cos(theta) * Math.cos(phi);
            arr[i * 3 + 2] = Math.sin(phi) * 0.5; // Curve depth
        }
    }

    generateSword(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.8) {
                // Blade
                arr[i * 3] = (Math.random() - 0.5) * 0.3;
                arr[i * 3 + 1] = Math.random() * 3; // 0 to 3
                arr[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            } else {
                // Hilt
                arr[i * 3] = (Math.random() - 0.5) * 1.5; // Crossguard
                arr[i * 3 + 1] = 0;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
            }
        }
    }

    generateGhost(arr) {
        for (let i = 0; i < this.count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 3;
            const rBase = 1.0;
            const wave = Math.sin(y * 3 + theta * 2) * 0.2;
            const r = (rBase + wave) * (y > 0 ? 1 : 0.8); // Head wider

            // Top dome
            if (y > 1) {
                // simple sphere cap
            }

            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generatePortal(arr) {
        this.generateTorus(arr); // Re-use torus
    }

    generateBlackhole(arr) {
        this.generateSaturn(arr); // Re-use Saturn-like
    }

    generateRing(arr) {
        const r = 2.0;
        for (let i = 0; i < this.count; i++) {
            const theta = Math.random() * Math.PI * 2;
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateBuckyball(arr) {
        this.generateSphere(arr); // Approx
    }

    generateMushroom(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.3) {
                // Stem
                arr[i * 3] = (Math.random() - 0.5) * 0.6;
                arr[i * 3 + 1] = (Math.random() * 1.5) - 1.5;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
            } else {
                // Cap
                const r = Math.random() * 1.5;
                const theta = Math.random() * Math.PI * 2;
                const h = Math.cos(r); // Dome shape approx
                arr[i * 3] = r * Math.cos(theta);
                arr[i * 3 + 1] = h * 1.0;
                arr[i * 3 + 2] = r * Math.sin(theta);
            }
        }
    }

    generateUFO(arr) {
        for (let i = 0; i < this.count; i++) {
            if (i < this.count * 0.7) {
                // Disk
                const r = Math.random() * 2.0;
                const theta = Math.random() * Math.PI * 2;
                arr[i * 3] = r * Math.cos(theta);
                arr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
                arr[i * 3 + 2] = r * Math.sin(theta);
            } else {
                // Dome
                const r = Math.random() * 0.8;
                const theta = Math.random() * Math.PI * 2;
                const h = Math.sqrt(0.8 * 0.8 - r * r);
                arr[i * 3] = r * Math.cos(theta);
                arr[i * 3 + 1] = h;
                arr[i * 3 + 2] = r * Math.sin(theta);
            }
        }
    }

    generateCrown(arr) {
        for (let i = 0; i < this.count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 1.5;
            const spikes = 5;
            const h = 0.5 + Math.abs(Math.sin(theta * spikes / 2));
            arr[i * 3] = r * Math.cos(theta);
            arr[i * 3 + 1] = (Math.random() * h);
            arr[i * 3 + 2] = r * Math.sin(theta);
        }
    }

    generateFireworks(arr) {
        // Multiple bursts
        const centers = [];
        const numBursts = 5;
        for (let j = 0; j < numBursts; j++) {
            centers.push({
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4,
                z: (Math.random() - 0.5) * 4,
                color: Math.random() // for variety if needed
            });
        }

        for (let i = 0; i < this.count; i++) {
            // Assign to a burst
            const burstIdx = Math.floor(Math.random() * numBursts);
            const center = centers[burstIdx];

            // Sphere around center
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = Math.random() * 0.8; // Burst size

            arr[i * 3] = center.x + r * Math.sin(phi) * Math.cos(theta);
            arr[i * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta);
            arr[i * 3 + 2] = center.z + r * Math.cos(phi);
        }
    }

    update(handData, dt) {
        // Use dt to increment time (defaulting to 0.016 if undefined for safety)
        const safeDt = dt || 0.016;
        this.time += safeDt;

        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;

        // Determine Mode: Two-Handed vs Single-Handed
        let targetX = 0;
        let targetY = 0;
        // let expansion = 1.0; // REPLACED by discrete Scale and Explosion
        let explosion = 0.0;
        // globalScale is already class property

        let isTwoHanded = false;
        let rotationZ = 0;
        // 1. Process Hand Data
        if (handData && handData.interaction) {
            if (handData.hasHands) {
                // State Machine: Open Palm -> Pinch -> Active
                const hand = handData.hands[0];
                if (hand.isOpenPalm) {
                    this.sawOpenPalm = true;
                }
                if (this.sawOpenPalm && hand.isPinch) {
                    this.isControlActive = true;
                }

                // Calculate proposed target from current hands
                const proposedX = handData.interaction.center.x * 5;
                const proposedY = handData.interaction.center.y * 3;

                if (handData.interaction.isTwoHanded) {
                    isTwoHanded = true;

                    // Feature 2: Two-Handed Relative Zoom & Position Lock
                    if (handData.interaction.bothHandsPinched && this.isControlActive) {
                        // Lock Logic
                        if (!this.isPinchLocked) {
                            // First frame of pinch: LOCK / RE-GRAB
                            this.isPinchLocked = true;
                            this.pinchStartSpread = handData.interaction.spread;
                            this.pinchStartScale = this.globalScale;

                            // Lock Position
                            this.isPositionLocked = true;
                            this.lockedTargetX = proposedX;
                            this.lockedTargetY = proposedY;
                        }

                        // Use Locked Position
                        targetX = this.lockedTargetX;
                        targetY = this.lockedTargetY;

                        // Relative Zoom (SCALE)
                        if (this.pinchStartSpread > 0.05) {
                            const ratio = handData.interaction.spread / this.pinchStartSpread;
                            this.globalScale = this.pinchStartScale * ratio;

                            // Clamp
                            if (this.globalScale < 0.2) this.globalScale = 0.2;
                            if (this.globalScale > 5.0) this.globalScale = 5.0;
                        }
                    } else {
                        // Pinch Released or Not Active: Unlock
                        this.isPinchLocked = false;
                        this.isPositionLocked = false;

                        // Follow hands normally
                        targetX = proposedX;
                        targetY = proposedY;
                    }

                } else {
                    // Feature 1: Single Hand EXPLOSION
                    targetX = proposedX;
                    targetY = proposedY;

                    if (this.isControlActive) {
                        // EXIT CONDITION: Open Palm (Release Lock)
                        if (hand.isOpenPalm) {
                            this.isControlActive = false;
                            this.pinchStartSpread = null;
                            this.sawOpenPalm = true;
                            explosion = 0;
                        } else {
                            // STAY ACTIVE: Map Pinch Distance to Explosion
                            // Close pinch (0) -> 0 Explosion
                            // Open pinch (1.0) -> High Explosion

                            if (this.pinchStartSpread === undefined || this.pinchStartSpread === null) {
                                // Capture initial state? Or just direct map?
                                // "as distance increases... explode"
                                // Direct mapping is more intuitive for "Explosion"
                                this.pinchStartSpread = 0;
                            }

                            // Explosion Factor
                            // 0.05 (Closed) -> 0
                            // 0.5 (Open) -> 2.0 (Exploded)
                            const dist = Math.max(hand.pinchDistance, 0);
                            if (dist > 0.1) {
                                explosion = (dist - 0.1) * 8.0; // Sensitivity
                            }
                        }
                    } else {
                        // Stable state before activation
                        this.pinchStartSpread = null;
                        explosion = 0;
                    }
                }
            } else {
                // No hands: Reset State
                this.isControlActive = false;
                this.sawOpenPalm = false;
                explosion = 0;
            }
        } else if (handData && handData.isActive) {
            // Fallback
            targetX = handData.center.x * 5;
            targetY = handData.center.y * 3;
        }

        // 2. Gesture Triggers (R / O)
        if (handData && (handData.gesture === 'R' || handData.gesture === 'O')) {
            this.isAutoRotating = true;
            console.log(`Auto-Rotate STARTED (${handData.gesture})`);
        }

        // Cancel Auto-Rotation if user interacts manually (Mouse down, Two hands, or Pinching)
        if ((handData && handData.isActive) || isTwoHanded || (handData && handData.hasHands && handData.hands[0].isPinch)) {
            this.isAutoRotating = false;
        }

        // 3. Apply Rotation Logic
        // Damping factors adjusted for dt using: factor = 1 - pow(base, dt)
        // Base 0.1 means very snappy, Base 0.9 means slow
        const fastDamp = 1 - Math.pow(0.001, safeDt);
        const slowDamp = 1 - Math.pow(0.5, safeDt);

        if (isTwoHanded) {
            // Dampen existing rotation to 0
            this.particles.rotation.z += (0 - this.particles.rotation.z) * fastDamp;
        } else if (this.isAutoRotating) {
            // Auto-rotate gesture (FAST)
            this.autoRotationAccumulator += 2.0 * safeDt; // Fixed fast speed for 'R' gesture
            // Dampen Z
            this.particles.rotation.z += (0 - this.particles.rotation.z) * slowDamp;
        } else {
            // Idle / Slider Controlled Speed appends to accumulator
            this.autoRotationAccumulator += this.rotationSpeed * safeDt;

            // Manual X (Tilt)
            const currentX = this.particles.rotation.x;
            const targetXRot = this.rotationX;
            this.particles.rotation.x += (targetXRot - currentX) * 0.1;

            // Manual Y (Spin Offset)
            // We combine continuous auto-rotation with manual slider offset
            // Effective Y = Accumulator + ManualY
            this.particles.rotation.y = this.autoRotationAccumulator + this.rotationY;

            // Dampen Z
            this.particles.rotation.z += (0 - this.particles.rotation.z) * slowDamp;
        }

        // 4. Update Particles Loop
        const hueBase = (this.time * 0.1) % 1.0;
        const colorObject = new THREE.Color();

        // Frame-rate independent lerp
        // We want ~0.05 per frame @ 60fps
        // factor = 1 - exp(-lambda * dt)
        // 0.05 = 1 - exp(-lambda * 1/60) -> lambda approx 3
        const lerpFactor = 1 - Math.exp(-3 * safeDt);

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            let tx = this.targetPositions[i3];
            let ty = this.targetPositions[i3 + 1];
            let tz = this.targetPositions[i3 + 2];

            // Apply SCALE (Two Hand)
            tx *= this.globalScale;
            ty *= this.globalScale;
            tz *= this.globalScale;

            // Apply EXPLOSION (One Hand)
            if (explosion > 0.01) {
                // Explode outwards from center
                // We can use the normalized position vector
                const dist = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.001;
                const dirX = tx / dist;
                const dirY = ty / dist;
                const dirZ = tz / dist;

                // Add explosion offset
                tx += dirX * explosion;
                ty += dirY * explosion;
                tz += dirZ * explosion;

                // Optional: Add some noise dispersion
                tx += (Math.random() - 0.5) * explosion * 0.5;
                ty += (Math.random() - 0.5) * explosion * 0.5;
                tz += (Math.random() - 0.5) * explosion * 0.5;
            }

            // Apply Position Offset
            tx += targetX;
            ty += targetY;

            // Noise
            tx += Math.sin(this.time + i) * 0.05;
            ty += Math.cos(this.time + i * 0.5) * 0.05;

            // Update
            positions[i3] += (tx - positions[i3]) * lerpFactor;
            positions[i3 + 1] += (ty - positions[i3 + 1]) * lerpFactor;
            positions[i3 + 2] += (tz - positions[i3 + 2]) * lerpFactor;

            // Colors
            const hue = (hueBase + (positions[i3] * 0.05)) % 1.0;
            const l = (this.globalScale > 1.5 || explosion > 0.5) ? 0.8 : 0.5; // Brighter when expanded or exploded
            colorObject.setHSL(hue, 0.8, l);
            colors[i3] = colorObject.r;
            colors[i3 + 1] = colorObject.g;
            colors[i3 + 2] = colorObject.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }
}

