# Aether 3D
> *Shape the cosmos with your hands.*

Aether 3D is an interactive, magical web application that lets you control 3D particle systems using only your hand gestures. Built with Three.js and MediaPipe, it turns your webcam into a magical interface where you can conjure shapes, control their rotation, and even use AI and voice commands to create new forms.

## ✨ Features

-   **🖐️ Real-time Hand Tracking**: Use your hands to move and manipulate the particle cloud in 3D space.
-   **🔮 AI Shape Conjuring**: Ask the "spirits" (Gemini AI) to create any shape you can imagine (e.g., "A spiral galaxy" or "A DNA helix").
-   **🗣️ Voice Control**: Speak commands to switch shapes instantly (e.g., "Show me a heart").
-   **🤏 Interactive Gestures**:
    -   **Open Palm**: Move the object around.
    -   **Pinch**: Contract particles or "grab" controls.
    -   **'R' Gesture**: Draw an 'R' in the air to toggle auto-rotation.
-   **📹 Video Recording**: Record your magical sessions directly from the app.
-   **🎨 9+ Preset Shapes**: Beautiful presets like Flowers, Saturn, Fireworks, and more.

## 🛠️ Prerequisites

-   **Node.js**: v16 or higher is recommended.
-   **Webcam**: Required for hand tracking.

## 🚀 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/aether-3d.git
    cd aether-3d
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:5173` (or the URL shown in your terminal).

## ⚙️ Configuration (AI Features)

To use the **AI Conjuring** feature (generating new shapes from text), you need a Google Gemini API Key.

1.  Get your key from [Google AI Studio](https://aistudio.google.com/).
2.  In the app, try to conjure a shape. A prompt will appear asking for your key.
3.  Paste your key to save it locally in your browser.

> **Note**: The key is stored securely in your browser's `localStorage` and is never sent to any other server.

## 📖 Usage Guide

### 1. Basic Controls
-   **Move**: Hold your hand open to move the particle center.
-   **Scale/Contract**: Pinch your thumb and index finger to pull particles inward.
-   **Rotate**: Use the sliders on the left or grab the "Rotation Controls" box to spin the object manually.

### 2. Conjuring Shapes (AI)
1.  Click the "Conjure Object" input box (or drag the dialog to move it).
2.  Type a shape name (e.g., "Pyramid", "Tornado").
3.  Press **Enter** or click **Conjure**.
4.  Watch as the AI generates the code for your shape in real-time!

### 3. Voice Command
1.  Click the **Microphone** icon.
2.  Say the name of a shape (e.g., "Saturn", "Flower").
3.  The app will listen and switch immediately if it recognizes the word.

### 4. Recording
1.  Click the **Record Button** (circle) at the bottom of the camera feed.
2.  Perform your magic.
3.  Click it again to stop.
4.  The video (`.webm`) will automatically download or prompt to save.

## 🏗️ Technology Stack

-   **[Three.js](https://threejs.org/)**: 3D Rendering and Particle System.
-   **[MediaPipe](https://developers.google.com/mediapipe)**: Real-time Hand Tracking & Gesture Recognition.
-   **[Vite](https://vitejs.dev/)**: Fast frontend tooling.
-   **[Google Gemini API](https://ai.google.dev/)**: Generative AI for shape creation.

---

*Created with ❤️ by Nikhil*
