<template>
  <div class="app-container">
    <!-- ========== STEP 0: SPLASH SCREEN ========== -->
    <div v-if="step === 0" class="splash-screen">
      <div class="splash-content">
        <img class="pillow-icon-splash" src="public/docs/loader.svg" alt="Pillow icon" />
      </div>
    </div>

    <!-- ========== STEP 1: MANUAL QR-SCAN ========== -->
    <div v-else-if="step === 1">
      <!-- Nur im Client => SSR mag kein Kamera-Zugriff -->
      <client-only>
        <div class="qr-scan-screen">
          <h2>QR-Code scannen (manuell mit jsQR)</h2>
          <p>Bitte richte deine Kamera auf den Kissen-QR-Code.</p>

          <!-- Video-Preview (Kamera-Live) -->
          <video ref="videoRef" class="camera-preview" playsinline muted autoplay></video>

          <!-- Canvas im Hintergrund zum Auslesen der Frames, kann hidden sein -->
          <canvas ref="canvasRef" class="scan-canvas" width="300" height="300"></canvas>

          <!-- Optionaler Skip-Knopf, falls du keinen QR zur Hand hast -->
          <button @click="skipScan" class="skip-btn">Überspringen (Test)</button>
        </div>
      </client-only>
    </div>

    <!-- ========== STEP 2: MAIN-SCREEN ========== -->
    <div v-else class="main-screen">
      <!-- Header -->
      <header class="app-header">
        <img class="zzz-header" src="public/docs/zzz.svg" alt="zzz icon" />
        <h1 class="header-title">DREAM ON</h1>
      </header>

      <!-- Inhalt -->
      <div class="content">
        <!-- Kissen -->
        <div class="pillow-section">
          <img class="pillow-icon-main" src="public/docs/pillow.svg" alt="Pillow icon" />
          <p class="pillow-status">
            Kissen {{ pillowId }} Verbunden
          </p>
        </div>

        <!-- Time Picker -->
        <div class="time-section" @click="showTimePicker = true">
          <div class="time-display">{{ formattedHour }} : {{ formattedMinute }}</div>
          <div class="time-subtitle">Wake up Time</div>
        </div>

        <!-- Temperatur -->
        <div class="temp-section">
          <input class="temp-slider" type="range" min="35" max="60" v-model.number="temp" />
          <div class="temp-info">
            <span class="temp-value">{{ temp }}°C</span>
            <span class="temp-label">Temperatur</span>
          </div>
        </div>

        <!-- Abschicken-Button -->
        <button class="submit-button" @click="sendMessage">Abschicken</button>
      </div>

      <!-- Hilfelink -->
      <a class="help-link" href="/help">Hilfe</a>
    </div>

    <!-- Zeit-Picker Overlay -->
    <div v-if="showTimePicker" class="time-picker-overlay" @click.self="closeTimePicker">
      <div class="time-picker-dialog">
        <h2>Zeit einstellen</h2>
        <div class="dialog-content">
          <!-- Stunde -->
          <div class="dialog-col">
            <label>Stunde</label>
            <div class="arrow" @click="incrementHour">▲</div>
            <div class="digit">{{ hour }}</div>
            <div class="arrow" @click="decrementHour">▼</div>
          </div>
          <div class="dialog-sep">:</div>
          <!-- Minute -->
          <div class="dialog-col">
            <label>Minute</label>
            <div class="arrow" @click="incrementMinute">▲</div>
            <div class="digit">{{ minutePadded }}</div>
            <div class="arrow" @click="decrementMinute">▼</div>
          </div>
        </div>
        <button class="dialog-ok" @click="applyTime">OK</button>
      </div>
    </div>

    <!-- Grüner Haken + "Sleep well" Overlay -->
    <div v-if="showCheckOverlay" class="check-overlay">
      <div class="check-container">
        <img src="public/docs/zzzCheck.svg" alt="zzzCheck" class="check-icon" />
        <p class="check-text">Sleep well</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import mqtt from 'mqtt'

// WICHTIG: Damit SSR nicht meckert, laden wir jsQR erst im Browser:
let jsQR = null

// Steps: 0=Splash, 1=QR-Scan, 2=Main
const step = ref(0)
const pillowId = ref('CT-3000')

// UI States
const showTimePicker = ref(false)
const showCheckOverlay = ref(false)

// Zeit & Temperatur
const hour = ref(7)
const minute = ref(15)
const temp = ref(45)

// MQTT
const brokerUrl = 'wss://mqtt.hfg.design:443/mqtt'
const client = ref(null)

// Refs für Video & Canvas
const videoRef = ref(null)
const canvasRef = ref(null)

// handleCamera / Animations
let localStream = null       // Speichern des getUserMedia()-Streams
let animFrameId = 0          // requestAnimationFrame ID
let scanningActive = false   // Steuert, ob wir gerade scannen

// --------------
// MOUNTED
// --------------
onMounted(() => {
  // Splash => nach 700 ms -> step=1
  setTimeout(async () => {
    step.value = 1
    await initJsQrAndStartCamera()
  }, 700)

  // Uhrzeit => jetzt +1 min
  const now = new Date()
  now.setMinutes(now.getMinutes() + 1)
  hour.value = now.getHours()
  minute.value = now.getMinutes()

  // MQTT Connect
  client.value = mqtt.connect(brokerUrl)
  client.value.on('connect', () => {
    console.log('[MQTT] connected')
  })
  client.value.on('error', (err) => {
    console.error('[MQTT] error', err)
  })
  client.value.on('offline', () => {
    console.warn('[MQTT] offline')
  })
  client.value.on('reconnect', () => {
    console.log('[MQTT] reconnecting...')
  })
  client.value.on('message', (topic, message) => {
    console.log(`[MQTT] message => ${topic}: ${message.toString()}`)
  })
})

onUnmounted(() => {
  // Kamera stoppen
  stopCamera()
  // MQTT trennen
  if (client.value) {
    client.value.end()
  }
})

// --------------
// initJsQrAndStartCamera
// --------------
async function initJsQrAndStartCamera() {
  console.log('[initJsQrAndStartCamera] loading jsQR dynamically...')
  const lib = await import('jsqr')         // => { default: [Function: jsQR], ...}
  jsQR = lib.default || lib.jsQR || null   // Versuche default oder named 
  if (!jsQR) {
    console.error('[initJsQrAndStartCamera] jsQR not found in module =>', lib)
    return
  }
  console.log('[initJsQrAndStartCamera] jsQR loaded =>', jsQR)

  // Kamera starten
  startCamera()
    .then(() => {
      console.log('[initJsQrAndStartCamera] camera started => start scanning loop')
      scanningActive = true
      scanLoop()
    })
    .catch(err => {
      console.error('[initJsQrAndStartCamera] could not start camera:', err)
    })
}

// --------------
// Start Camera
// --------------
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia not supported in this browser!')
  }
  console.log('[startCamera] requesting getUserMedia...')
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false
  })

  if (!videoRef.value) {
    throw new Error('videoRef is not available in DOM yet!')
  }

  // Video befüllen
  videoRef.value.srcObject = localStream
  await videoRef.value.play()
  console.log('[startCamera] video playing...')
}

// --------------
// Stop Camera
// --------------
function stopCamera() {
  scanningActive = false
  cancelAnimationFrame(animFrameId)
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.srcObject = null
  }
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop())
    localStream = null
  }
}

// --------------
// scanLoop
// --------------
function scanLoop() {
  if (!scanningActive) return

  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) {
    animFrameId = requestAnimationFrame(scanLoop)
    return
  }

  const ctx = canvas.getContext('2d')
  // Canvas = Video-Größe anpassen
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  // Draw current Frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Pixel holen & jsQR checken
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, canvas.width, canvas.height)

  if (code?.data) {
    console.log('[scanLoop] found QR =>', code.data)
    // => Pillow-Id
    pillowId.value = code.data
    // => ab zu Main-Screen
    stopCamera()
    step.value = 2
    subscribeToPillowId(code.data)
    return
  }

  // Nächsten Frame
  animFrameId = requestAnimationFrame(scanLoop)
}

// --------------
// subscribeToPillowId
// --------------
function subscribeToPillowId(id) {
  if (client.value && client.value.connected) {
    client.value.subscribe(`${id}/#`, err => {
      if (err) console.error('[subscribeToPillowId] error =>', err)
      else console.log(`[subscribeToPillowId] subscribed to ${id}/#`)
    })
  } else {
    console.warn('[subscribeToPillowId] not connected yet')
  }
}

// --------------
// Skip-Scan
// --------------
function skipScan() {
  console.log('[skipScan] => Setting pillowId=TEST-1234')
  pillowId.value = 'TEST-1234'
  step.value = 2
  stopCamera()
  subscribeToPillowId('TEST-1234')
}

// --------------
// Zeit-Funktionen
// --------------
function incrementHour() {
  hour.value = (hour.value + 1) % 24
}
function decrementHour() {
  hour.value = (hour.value - 1 + 24) % 24
}
function incrementMinute() {
  let newMin = minute.value + 1
  if (newMin === 60) {
    newMin = 0
    incrementHour()
  }
  minute.value = newMin
}
function decrementMinute() {
  let newMin = minute.value - 1
  if (newMin < 0) {
    newMin = 59
    decrementHour()
  }
  minute.value = newMin
}
function applyTime() {
  closeTimePicker()
}
function closeTimePicker() {
  showTimePicker.value = false
}

// --------------
// MQTT - Senden
// --------------
function sendMessage() {
  if (!pillowId.value) {
    console.warn('[sendMessage] no pillowId => cannot send')
    return
  }
  if (client.value && client.value.connected) {
    client.value.publish(`${pillowId.value}/heat`, String(temp.value))
    client.value.publish(`${pillowId.value}/hour`, String(hour.value))
    client.value.publish(`${pillowId.value}/minute`, String(minute.value))
    console.log('[sendMessage] published =>', {
      pillowId: pillowId.value,
      temp: temp.value,
      hour: hour.value,
      minute: minute.value
    })
  } else {
    console.warn('[sendMessage] MQTT not connected => cannot publish')
  }

  // Grünes Haken-Overlay
  showCheckOverlay.value = true
  setTimeout(() => {
    showCheckOverlay.value = false
  }, 2000)
}

// --------------
// Computed
// --------------
const formattedHour = computed(() => String(hour.value).padStart(2, '0'))
const formattedMinute = computed(() => String(minute.value).padStart(2, '0'))
const minutePadded = computed(() => String(minute.value).padStart(2, '0'))
</script>

<style scoped>
/* Basis-Styles wie gehabt... */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-container {
  width: 100%;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* SPLASH SCREEN */
.splash-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* QR-SCAN */
.qr-scan-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.camera-preview {
  width: 300px;
  height: 300px;
  border: 2px solid #444;
  object-fit: cover;
  background: #000;
}

.scan-canvas {
  display: none;
  /* kann man auch zeigen für Debug */
}

.skip-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #999;
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 6px;
}

/* MAIN SCREEN */
.main-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-header {
  position: relative;
  text-align: center;
  padding-top: 1rem;
  padding-bottom: 0.5rem;
}

.zzz-header {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%) rotate(-10deg);
  width: 30px;
  height: auto;
}

.header-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.content {
  flex: 1;
  margin-top: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Kissen */
.pillow-section {
  text-align: center;
}

.pillow-icon-main {
  width: 160px;
  height: auto;
}

.pillow-status {
  color: #777;
  font-size: 1rem;
  margin-top: 0.9rem;
  text-align: left;
  width: 100%;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

/* TIME-PICKER ANZEIGE */
.time-section {
  margin-top: 5rem;
  text-align: center;
  cursor: pointer;
}

.time-display {
  font-size: 4rem;
  font-weight: 600;
}

.time-subtitle {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: #999;
}

/* TEMPERATUR */
.temp-section {
  margin-top: 7rem;
  text-align: center;
}

.temp-slider {
  width: 250px;
  margin-bottom: 0.5rem;
  appearance: none;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #ccc, #444);
  outline: none;
  cursor: pointer;
}

.temp-info {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: baseline;
}

.temp-value {
  font-size: 1.2rem;
  font-weight: 500;
  color: #000;
}

.temp-label {
  font-size: 0.9rem;
  color: #555;
}

/* BUTTON */
.submit-button {
  margin-top: auto;
  margin-bottom: auto;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

.submit-button:hover {
  background-color: #333;
}

/* Hilfelink unten rechts */
.help-link {
  position: absolute;
  right: 1rem;
  bottom: 2rem;
  color: #aaa;
  font-size: 0.9rem;
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

/* TIME PICKER OVERLAY */
.time-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-picker-dialog {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  width: 80%;
  max-width: 320px;
  text-align: center;
}

.dialog-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.dialog-col {
  margin: 0 8px;
  text-align: center;
}

.arrow {
  font-size: 1.2rem;
  color: #000;
  cursor: pointer;
  margin: 2px 0;
  user-select: none;
}

.arrow:hover {
  color: #525252;
}

.digit {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 4px 0;
}

.dialog-sep {
  font-size: 1.6rem;
  margin: 0 4px;
  color: #333;
}

.dialog-ok {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

.dialog-ok:hover {
  background: #525252;
}

/* GRÜNER HAKEN OVERLAY */
.check-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-container {
  background: #0000007e;
  padding: 100% 100%;
  text-align: center;
  animation: popIn 0.2s ease;
}

.check-icon {
  width: 190px;
  height: auto;
  margin-bottom: 8px;
}

.check-text {
  font-size: 1.4rem;
  color: #ffffff;
  font-weight: 700;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
