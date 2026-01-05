import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class HandInput {
  constructor(videoElement) {
    this.video = videoElement;
    this.handLandmarker = null;
    this.runningMode = 'VIDEO';
    this.lastVideoTime = -1;

    // Gesture State
    this.strokePath = [];
    this.isRecording = false;

    // "R" Template (Normalized 0..1)
    // Vertical up, Loop, Leg
    this.rTemplate = [
      { x: 0, y: 1 }, { x: 0, y: 0 }, // Up
      { x: 0.5, y: 0 }, { x: 1, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0, y: 0.5 }, // Loop
      { x: 1, y: 1 } // Leg
    ];

    // Initialize Templates Map
    this.templates = {
      'R': this.rTemplate,
      // 'O': ... (add other templates here if needed)
    };

    this.data = {
      isActive: false,
      center: { x: 0, y: 0 },
      pinchDistance: 0,
      isOpenPalm: false,
      gesture: null // 'R' or null
    };
  }

  // Simplified $1 Unistroke Logic
  resample(points, n) {
    const I = this.pathLength(points) / (n - 1);
    const newPoints = [points[0]];
    let D = 0;
    for (let i = 1; i < points.length; i++) {
      const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      if ((D + d) >= I) {
        const qx = points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
        const qy = points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
        const q = { x: qx, y: qy };
        newPoints.push(q);
        points.splice(i, 0, q);
        D = 0;
      } else {
        D += d;
      }
    }
    if (newPoints.length === n - 1) newPoints.push(points[points.length - 1]);
    return newPoints;
  }

  pathLength(points) {
    let d = 0;
    for (let i = 1; i < points.length; i++) {
      d += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return d;
  }

  recognize(points) {
    if (points.length < 10) return null;

    // 1. Resample
    points = this.resample(points, 32);

    // 2. Translate to Centroid
    const c = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    c.x /= points.length; c.y /= points.length;
    points = points.map(p => ({ x: p.x - c.x, y: p.y - c.y }));

    // 3. Scale to Box
    // (Skipping rotation invariance for simplicity - assume upright R)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    const scale = Math.max(maxX - minX, maxY - minY);
    if (scale < 0.05) return null; // Too small
    points = points.map(p => ({ x: (p.x - minX) / scale, y: (p.y - minY) / scale }));

    // 4. Match against Templates
    let bestDist = Infinity;
    let bestGesture = null;

    for (const [name, templatePoints] of Object.entries(this.templates)) {
      const templ = this.resample(templatePoints, 32);
      let d = 0;
      for (let i = 0; i < 32; i++) {
        d += Math.hypot(points[i].x - templ[i].x, points[i].y - templ[i].y);
      }
      const avgDist = d / 32;

      if (avgDist < bestDist) {
        bestDist = avgDist;
        bestGesture = name;
      }
    }

    console.log(`Gesture Dist: ${bestDist} (${bestGesture})`);
    return bestDist < 0.25 ? bestGesture : null;
  }

  async init(statusElement) {
    console.log('[HandTracking] Init started');
    if (statusElement) statusElement.textContent = "Loading AI Models...";

    console.log('[HandTracking] Calling FilesetResolver...');
    console.log('[HandTracking] Calling FilesetResolver...');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
    );
    console.log('[HandTracking] FilesetResolver done');

    if (statusElement) statusElement.textContent = "Setting up Detector...";

    console.log('[HandTracking] Creating HandLandmarker...');
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: 'GPU', // Switched to GPU for performance
      },
      runningMode: this.runningMode,
      numHands: 2, // Enable 2 hands
    });
    console.log('[HandTracking] HandLandmarker created');

    if (statusElement) statusElement.textContent = "Requesting Camera...";
    console.log('[HandTracking] Calling startWebcam...');
    await this.startWebcam();
    console.log('[HandTracking] startWebcam finished');
  }

  startWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Browser does not support getUserMedia');
      return Promise.reject('No camera support');
    }

    return navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: 'user', // Selfie camera
      },
    }).then((stream) => {
      this.video.srcObject = stream;
      return new Promise((resolve) => {
        const onLoaded = () => {
          this.video.play();
          this.video.classList.add('active');
          resolve();
        };

        if (this.video.readyState >= 2) {
          onLoaded();
        } else {
          this.video.onloadeddata = onLoaded;
        }
      });
    });
  }

  update() {
    if (!this.handLandmarker || this.video.paused) return this.data;

    // Reset one-time triggers
    this.data.gesture = null;

    let startTimeMs = performance.now();

    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

      const hands = [];

      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          // 1. Calculate Center (approximately palm center, index 9 is middle finger base)
          // Normalize coordinates from 0..1 to -1..1 for Three.js conveniently
          // Note: MediaPipe X is 0 (left) to 1 (right). In Three.js, we often map X to -1(left) to 1(right).
          // BUT Webcam is mirrored in CSS transform: scaleX(-1). 
          // Logic: 
          //   MediaPipe provides raw stream coordinates (unmirrored).
          //   If user moves Right hand to Right of screen, MP sees X close to 0 (if camera is mirrored? no raw camera is mirror like)
          //   Usually selfie cam:
          //     Real User: Moves Right.
          //     Cam Image: Moves Left (Pixels 0).
          //     We want particles on Right.
          //     So we assume standard interaction: Mirror X.
          const centerX = (landmarks[9].x - 0.5) * 2;
          const centerY = -(landmarks[9].y - 0.5) * 2;

          // 2. Calculate Pinch (Thumb Tip 4 to Index Tip 8)
          const thumb = landmarks[4];
          const index = landmarks[8];
          const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);

          // 3. Gesture Detection
          // Y coordinates: Top is 0, Bottom is 1. So "Up" means Lower Y value.
          // Finger Extended Check: Tip (4, 8, 12, 16, 20) < PIP (2, 6, 10, 14, 18) - roughly

          const isFingerUp = (tipIdx, pipIdx) => landmarks[tipIdx].y < landmarks[pipIdx].y;

          // Thumb (4) vs IP (3). 
          const thumbUp = landmarks[4].y < landmarks[3].y;
          const indexUp = isFingerUp(8, 6);
          const middleUp = isFingerUp(12, 10);
          const ringUp = isFingerUp(16, 14);
          const pinkyUp = isFingerUp(20, 18);

          // "Open Palm": All Up (or at least 4 fingers including index/middle/ring/pinky)
          const isOpenPalm = indexUp && middleUp && ringUp && pinkyUp;

          // "Pinch": Check distance. If very close, it's a pinch.
          // We consider it a "Pinch Event" if distance is < 0.1
          const isPinch = distance < 0.1;

          // "Index Pointing": Index UP, others DOWN.
          // STRICTER: Thumb should NOT be "Up" or clearly part of a fist. 
          // We prioritize: If OpenPalm or Pinch, it is NOT Index Pointing.
          let isIndexPointing = indexUp && !middleUp && !ringUp && !pinkyUp;
          if (isOpenPalm || isPinch) isIndexPointing = false;

          // "Thumb Up": Thumb UP, Index/Middle/Ring/Pinky DOWN.
          let isThumbUp = thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp;
          if (isOpenPalm || isPinch) isThumbUp = false;

          hands.push({
            center: { x: -centerX, y: centerY }, // Mirror X
            // Unclamped for Analog Control: 0.0 (Touch) to >1.0 (Wide)
            pinchDistance: Math.max(distance * 4, 0),
            isOpenPalm,
            isPinch,
            isIndexPointing,
            isThumbUp
          });
        }
      }

      // Calculate Interaction (Spread & Rotate)
      let interaction = {
        center: { x: 0, y: 0 },
        spread: 0,
        rotation: 0,
        isTwoHanded: false,
        bothHandsPinched: false
      };

      if (hands.length === 1) {
        interaction.center = hands[0].center;
      } else if (hands.length === 2) {
        const h1 = hands[0];
        const h2 = hands[1];

        interaction.isTwoHanded = true;
        interaction.bothHandsPinched = h1.isPinch && h2.isPinch;

        interaction.center = {
          x: (h1.center.x + h2.center.x) / 2,
          y: (h1.center.y + h2.center.y) / 2
        };

        // Spread (Distance)
        const dx = h2.center.x - h1.center.x;
        const dy = h2.center.y - h1.center.y;
        interaction.spread = Math.sqrt(dx * dx + dy * dy);

        // Rotation (Angle)
        interaction.rotation = Math.atan2(dy, dx);
      }

      // 4. Gesture Recording & Recognition
      let detectedGesture = null;
      if (hands.length > 0) {
        const h = hands[0];
        // If pinching, record path
        if (h.isPinch) {
          this.strokePath.push({ x: h.center.x, y: h.center.y });
          this.isRecording = true;
        } else {
          // Released pinch
          if (this.isRecording) {
            this.isRecording = false;
            detectedGesture = this.recognize(this.strokePath);
            this.strokePath = []; // Clear
          }
        }
      } else {
        // No hands, reset recording
        this.isRecording = false;
        this.strokePath = [];
      }

      this.data = {
        hasHands: hands.length > 0,
        hands: hands,
        interaction: interaction,
        gesture: detectedGesture
      };
    }

    return this.data;
  }
}
