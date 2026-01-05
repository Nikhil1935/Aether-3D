import * as THREE from 'three';
import { ParticleSystem } from './particles.js';
import { HandInput } from './handTracking.js';

// Setup Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize Systems
// State Flags
let visionReady = false;
let interactionMode = 'vision'; // 'vision' or 'mouse'

// Initialize Systems
const particleSystem = new ParticleSystem(scene);
particleSystem.init();

const handInput = new HandInput(document.getElementById('webcam'));
const loadingText = document.querySelector('#loading p');

// 1. Start Vision Init
console.log('Starting Vision Init...');
handInput.init(loadingText).then(() => {
    console.log('Vision Init Success!');
    visionReady = true;
    document.getElementById('loading').classList.add('hidden');
}).catch((err) => {
    console.error('Vision Init Failed:', err);
    if (!visionReady) enableMouseMode(); // Only fallback if strict failure
});

// 2. Start Safety Timer (30s)
let countdown = 30;
const countdownInterval = setInterval(() => {
    if (visionReady) {
        clearInterval(countdownInterval);
        return;
    }

    countdown--;
    if (loadingText) loadingText.textContent = `Initializing Vision... (${countdown}s)`;

    if (countdown <= 0) {
        clearInterval(countdownInterval);
        if (!visionReady) {
            console.warn('Vision Timed Out (30s). Force enabling mouse mode.');
            enableMouseMode();
        }
    }
}, 1000);

function enableMouseMode() {
    if (visionReady) return; // double check
    interactionMode = 'mouse';
    document.getElementById('loading').classList.add('hidden');

    // Show Toast
    const toast = document.createElement('div');
    toast.innerText = '⚠️ Camera slow. Mouse mode active.';
    Object.assign(toast.style, {
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255, 100, 100, 0.2)', border: '1px solid rgba(255, 100, 100, 0.5)',
        color: '#fff', padding: '10px 20px', borderRadius: '20px', pointerEvents: 'none', zIndex: '1000'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);

    // Add Retry Button
    const retryBtn = document.createElement('button');
    retryBtn.innerText = '📷 Try Camera Again';
    Object.assign(retryBtn.style, {
        position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.2)', border: '1px solid white',
        color: 'white', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', pointerEvents: 'auto', zIndex: '1000'
    });
    retryBtn.onclick = () => {
        window.location.reload();
    };
    document.body.appendChild(retryBtn);
}

// Mouse Input Handler
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
    if (interactionMode === 'mouse') {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
});

// Template Cycling
const templates = ['sphere', 'heart', 'flower', 'saturn', 'sun', 'shuttlecock', 'lamp', 'fireworks'];
let currentTemplateIdx = 0;

const speedSlider = document.getElementById('speed-slider');
if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (particleSystem) particleSystem.rotationSpeed = val;
    });
}

const shapeButtonsContainer = document.getElementById('shape-buttons');
if (shapeButtonsContainer) {
    shapeButtonsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const shape = e.target.getAttribute('data-shape');
            if (shape) {
                particleSystem.switchTemplate(shape);

                // Active state styling could go here
                document.querySelectorAll('#shape-buttons button').forEach(b => {
                    b.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }
        }
    });
}
// Set initial active
particleSystem.switchTemplate('flower');

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    let handData;

    if (interactionMode === 'vision') {
        handData = handInput.update();
    } else {
        // Simulate single hand data from mouse
        handData = {
            hasHands: true,
            hands: [{
                center: { x: mouse.x, y: mouse.y },
                pinchDistance: 1.0,
                isOpenPalm: true,
                isIndexPointing: false,
                isThumbUp: false,
                isPinch: false
            }],
            interaction: {
                center: { x: mouse.x, y: mouse.y },
                spread: 0,
                rotation: 0,
                isTwoHanded: false
            }
        };
    }

    particleSystem.update(handData, dt);

    renderer.render(scene, camera);
}

// --------------------------------------------------------------------------
// UI & Drag Logic
// --------------------------------------------------------------------------

function makeDraggable(element, handle) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    const startDrag = (e) => {
        isDragging = true;
        const rect = element.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        // Convert to fixed top/left
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';

        handle.style.cursor = 'grabbing';
    };

    handle.addEventListener('mousedown', startDrag);

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        handle.style.cursor = 'grab';
    });
}

// 1. Draggable Camera
const cameraContainer = document.getElementById('camera-container');
const cameraHandle = cameraContainer ? cameraContainer.querySelector('.drag-handle-bar') : null;
if (cameraContainer && cameraHandle) {
    makeDraggable(cameraContainer, cameraHandle);
}

// 2. Draggable Dialog
const dialog = document.getElementById('custom-shape-dialog');
const dialogHandle = dialog ? dialog.querySelector('.drag-handle-bar') : null;
if (dialog && dialogHandle) {
    makeDraggable(dialog, dialogHandle);
    // Note: CSS resize works automatically. 
    // We add a listener to save position if we wanted persistence, but user didn't explicitly ask for persistence on this one, 
    // just "draggable and resizable". We can add persistence for polish if desired, but sticking to request specificities first.
}

// 3. Rotation Controls
const rotBox = document.getElementById('rotation-controls');
const rotHandle = rotBox ? rotBox.querySelector('.drag-handle-bar') : null;
const rotSlider = document.getElementById('rot-x-slider');
const rotYSlider = document.getElementById('rot-y-slider');
const rotReset = document.getElementById('reset-rot-btn');

if (rotBox && rotHandle) {
    // Show box
    rotBox.style.display = 'block';

    // Position Persistence
    const savedPos = localStorage.getItem('rotBoxPos');
    if (savedPos) {
        const pos = JSON.parse(savedPos);
        rotBox.style.left = pos.x + 'px';
        rotBox.style.top = pos.y + 'px';
        rotBox.style.transform = 'none';
    } else {
        // Default Left Middle: handled by CSS (left: 20px, top: 50%)
        // No JS force needed if CSS matches
    }

    // Save on drag end
    const savePos = () => {
        const rect = rotBox.getBoundingClientRect();
        localStorage.setItem('rotBoxPos', JSON.stringify({ x: rect.left, y: rect.top }));
        rotBox.style.transform = 'none';
    };

    makeDraggable(rotBox, rotHandle);
    rotBox.addEventListener('mouseup', savePos);
}

if (rotSlider) {
    rotSlider.addEventListener('input', (e) => {
        particleSystem.rotationX = parseFloat(e.target.value);
    });
}

if (rotYSlider) {
    rotYSlider.addEventListener('input', (e) => {
        particleSystem.rotationY = parseFloat(e.target.value);
    });
}

if (rotReset) {
    rotReset.addEventListener('click', () => {
        // Reset Angles
        particleSystem.rotationX = 0;
        particleSystem.rotationY = 0;
        particleSystem.autoRotationAccumulator = 0; // Reset spin

        // Reset UI
        if (rotSlider) rotSlider.value = 0;
        if (rotYSlider) rotYSlider.value = 0;

        // Reset internal
        particleSystem.particles.rotation.x = 0;
        particleSystem.particles.rotation.y = 0;
    });
}

// --------------------------------------------------------------------------
// AI Generation Logic
// --------------------------------------------------------------------------

const shapeInput = document.getElementById('shape-input');
const shapeSubmit = document.getElementById('shape-submit');

// Hardcoded Key or LocalStorage (Hidden from UI)
// Users can set this in their browser console: localStorage.setItem('GEMINI_API_KEY', 'sk-...')
// OR paste it here directly:
const HARDCODED_KEY = '';

async function generateShapeAI(promptName) {
    const apiKey = HARDCODED_KEY || localStorage.getItem('GEMINI_API_KEY');

    if (!apiKey) {
        console.warn("No API Key found.");
        const userKey = prompt("🔮 To conjure new objects, the spirits need a Gemini API Key.\n\nPlease paste it here:");
        if (userKey) {
            localStorage.setItem('GEMINI_API_KEY', userKey.trim());
            // Retry immediately
            generateShapeAI(promptName);
        } else {
            shapeSubmit.innerText = '⚠️ No Key';
            setTimeout(() => shapeSubmit.innerText = 'Submit', 2000);
        }
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `
    You are a 3D Particle Math wizard. 
    Write a Javascript function body that loops 'this.count' times (variable i) and sets 'arr[i*3]', 'arr[i*3+1]', 'arr[i*3+2]' (x,y,z).
    The array 'arr' is already defined.
    The goal is to form the shape: "${promptName}".
    
    Constraints:
    - Use strict math (Math.sin, Math.cos, etc).
    - Coordinates should be roughly within -2 to +2 range.
    - Do NOT wrap in a function signature, just the loop and logic.
    - Do NOT use backticks or markdown, just raw code.
    - Ensure 'this.count' is used safely.
    `;

    try {
        const originalText = shapeSubmit.innerText;
        shapeSubmit.innerText = '🔮 Dreaming...';
        shapeSubmit.disabled = true;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let code = response.text();

        // Clean code
        code = code.replace(/```javascript/g, '').replace(/```/g, '');

        console.log("AI Generated Code:", code);

        // Create Function
        // Signature matches: generateXYZ(arr)
        const generatedFunc = new Function('arr', code);

        // Register
        const safeName = promptName.replace(/\s+/g, '_').toLowerCase();
        particleSystem.addTemplate(safeName, generatedFunc);

        // Switch
        particleSystem.switchTemplate(safeName);

        shapeSubmit.innerText = '✨ Conjured!';
        setTimeout(() => {
            shapeSubmit.innerText = 'Submit';
            shapeSubmit.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("AI Gen Failed:", error);
        shapeSubmit.innerText = '❌ Failed';
        setTimeout(() => {
            shapeSubmit.innerText = 'Submit';
            shapeSubmit.disabled = false;
        }, 2000);
    }
}


if (shapeSubmit && shapeInput) {
    const submitShape = () => {
        const val = shapeInput.value.trim().toLowerCase();
        if (!val) return;

        // Check if exists in predefined
        if (particleSystem.templates[val]) {
            particleSystem.switchTemplate(val);
            shapeInput.value = '';
            return;
        }

        // Else, AI Generate
        generateShapeAI(val);
        shapeInput.value = '';
    };

    shapeSubmit.addEventListener('click', submitShape);
    shapeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitShape();
    });

    // --------------------------------------------------------------------------
    // 1. Populate Shape List
    // --------------------------------------------------------------------------
    const shapeListEl = document.getElementById('shape-list');
    if (shapeListEl) {
        const keys = Object.keys(particleSystem.templates).sort();
        keys.forEach(key => {
            const span = document.createElement('span');
            span.className = 'shape-tag';
            span.innerText = key;
            span.onclick = () => {
                shapeInput.value = key; // Use display for feedback
                particleSystem.switchTemplate(key);
            };
            shapeListEl.appendChild(span);
        });
    }

    // --------------------------------------------------------------------------
    // 2. Voice Control
    // --------------------------------------------------------------------------
    const voiceBtn = document.getElementById('voice-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && voiceBtn) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let isListening = false;

        voiceBtn.onclick = () => {
            if (!isListening) {
                recognition.start();
                isListening = true;
                voiceBtn.classList.add('listening');
                console.log('Voice: Listening...');
            } else {
                recognition.stop();
                isListening = false;
                voiceBtn.classList.remove('listening');
                console.log('Voice: Stopped.');
            }
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.trim().toLowerCase();
            console.log(`Voice heard: "${text}"`);

            // Minimal feedback
            shapeInput.value = `🎤 ${text}...`;

            // Check if valid shape (sanitize for partial matches or exact)
            // We want exact or close enough? User said "If ... specific structure name mention ... convert"
            // Let's iterate keys and check if spoken text INCLUDES the key or IS the key

            const keys = Object.keys(particleSystem.templates);
            // Simple match: Exact word or last word
            // "Show me a heart" -> "heart" ? 
            // Let's do a simple exact match check first, then partial.

            let match = keys.find(k => text.includes(k));

            if (match) {
                console.log(`Voice Match: ${match}`);
                shapeInput.value = match; // Show verified match
                particleSystem.switchTemplate(match);
                // We keep listening as requested ("until user clicks to end")
            }
        };

        recognition.onerror = (e) => {
            console.error('Voice Error:', e.error);
            voiceBtn.classList.remove('listening');
            isListening = false;
        };

        recognition.onend = () => {
            if (isListening) {
                // Restart if it stopped automatically but we want continuous
                try { recognition.start(); } catch (e) { }
            }
        };
    } else if (voiceBtn) {
        voiceBtn.style.display = 'none'; // Hide if not supported
        console.warn("Speech API not supported.");
    }

    // --------------------------------------------------------------------------
    // 3. Video Recording Logic
    // --------------------------------------------------------------------------
    const recordBtn = document.getElementById('record-btn');
    const webcam = document.getElementById('webcam');

    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;

    if (recordBtn && webcam) {
        recordBtn.addEventListener('click', async () => {
            if (!isRecording) {
                // START RECORDING
                const stream = webcam.srcObject;
                if (!stream) {
                    console.warn("No webcam stream to record.");
                    return;
                }

                // Check types
                const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9") ? "video/webm; codecs=vp9" : "video/webm";

                try {
                    mediaRecorder = new MediaRecorder(stream, { mimeType });
                } catch (e) {
                    console.error("MediaRecorder init failed", e);
                    return;
                }

                recordedChunks = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    // Create Blob
                    const blob = new Blob(recordedChunks, { type: mimeType });

                    // SAVE DIALOG
                    try {
                        if (window.showSaveFilePicker) {
                            const handle = await window.showSaveFilePicker({
                                suggestedName: `conjure-capture-${Date.now()}.webm`,
                                types: [{
                                    description: 'Video File',
                                    accept: { 'video/webm': ['.webm'] },
                                }],
                            });
                            const writable = await handle.createWritable();
                            await writable.write(blob);
                            await writable.close();
                            console.log("Video Saved via File Picker");
                        } else {
                            // Fallback
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.style.display = "none";
                            a.href = url;
                            a.download = `conjure-capture-${Date.now()}.webm`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            console.log("Video Saved via Download");
                        }
                    } catch (err) {
                        console.error("Save failed or cancelled", err);
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.classList.add('recording');
                console.log("Recording Started...");

            } else {
                // STOP RECORDING
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
                isRecording = false;
                recordBtn.classList.remove('recording');
                console.log("Recording Stopped.");
            }
        });
    }

}

animate();

