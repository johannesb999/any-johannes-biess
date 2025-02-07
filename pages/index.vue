<template>
  <div class="app-container">
    <!-- ========== STEP 0: SPLASH SCREEN ========== -->
    <div v-if="step === 0" class="splash-screen">
      <div class="splash-content">
        <img class="pillow-icon-splash" src="/docs/loader.svg" alt="Pillow icon" />
      </div>
    </div>

    <!-- ========== STEP 1: MANUAL QR-SCAN ========== -->
    <div v-else-if="step === 1">
      <!-- Nur im Client => SSR mag keinen Kamera-Zugriff -->
      <client-only>
        <div class="qr-scan-screen">
          <div class="qrimg">
            <h1 class="header-title">DREAM ON</h1>
            <img class="pillow-icon-main" src="/docs/pillow.svg" alt="Pillow icon" />
          </div>
          <div class="qrdescr">Bitte richte deine Kamera auf den Kissen-QR-Code.</div>

          <!-- Video-Preview (Kamera-Live) -->
          <video ref="videoRef" class="camera-preview" playsinline muted autoplay></video>

          <!-- Canvas zum Auslesen der Frames (versteckt) -->
          <canvas ref="canvasRef" class="scan-canvas" width="300" height="300"></canvas>

          <!-- Skip-Button -->
          <!-- <button @click="skipScan" class="skip-btn">Überspringen (Test)</button> -->
        </div>
      </client-only>
    </div>

    <!-- ========== STEP 2: MAIN SCREEN ========== -->
    <div v-else class="main-screen">
      <!-- Header -->
      <header class="app-header">
        <img class="zzz-header" src="/docs/zzz.svg" alt="zzz icon" />
        <h1 class="header-title">DREAM ON</h1>
      </header>

      <!-- Inhalt -->
      <div class="content">
        <!-- Kissen -->
        <div class="pillow-section">
          <img class="pillow-icon-main" src="/docs/pillow.svg" alt="Pillow icon" />
          <p class="pillow-status">
            Kissen {{ pillowId }} Verbunden
          </p>
        </div>

        <!-- Time Picker: Native Timepicker, erscheint nur beim Klicken auf den Bereich -->
        <label class="time-section" for="time-input">
          <div class="time-display">{{ formattedHour }} : {{ formattedMinute }}</div>
          <div class="time-subtitle">Wake up Time</div>
          <!-- Der Timepicker wird über das Label gelegt -->
          <input id="time-input" type="time" v-model="timeValue" class="native-timepicker" />
        </label>

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

    <!-- Grüner Haken + "Sleep well" Overlay -->
    <div v-if="showCheckOverlay" class="check-overlay">
      <div class="check-container">
        <img src="/docs/zzzCheck.svg" alt="zzzCheck" class="check-icon" />
        <p class="check-text">Sleep well</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import mqtt from 'mqtt'

// Damit SSR nicht meckert, laden wir jsQR erst im Browser:
let jsQR = null

// Schritte: 0 = Splash, 1 = QR-Scan, 2 = Main
const step = ref(0)
const pillowId = ref('')

// UI States
const showCheckOverlay = ref(false)

// Zeit & Temperatur
const hour = ref(7)
const minute = ref(15)
const temp = ref(45)

// Computed: native Timepicker (HH:MM)
const timeValue = computed({
  get() {
    return `${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`
  },
  set(val) {
    const parts = val.split(':')
    if (parts.length === 2) {
      hour.value = parseInt(parts[0], 10)
      minute.value = parseInt(parts[1], 10)
    }
  }
})
const formattedHour = computed(() => String(hour.value).padStart(2, '0'))
const formattedMinute = computed(() => String(minute.value).padStart(2, '0'))

// MQTT
const brokerUrl = 'wss://mqtt.simplejb.com:443/mqtt'
const client = ref(null)

// Refs für Video & Canvas
const videoRef = ref(null)
const canvasRef = ref(null)

// Kamera & Scan-Handling
let localStream = null
let animFrameId = 0
let scanningActive = false

// ---------- Lifecycle ----------
onMounted(() => {
  // Nach 700ms: zu QR-Scan (Step 1)
  setTimeout(async () => {
    step.value = 1
    await initJsQrAndStartCamera()
  }, 700)

  // Standardzeit: Jetzt + 1 Minute
  const now = new Date()
  now.setMinutes(now.getMinutes() + 1)
  hour.value = now.getHours()
  minute.value = now.getMinutes()

  // MQTT-Verbindung aufbauen
  client.value = mqtt.connect(brokerUrl, {
    username: `kissen`,
    password: "stochastisch-häckseln-Wespe-Propeller-7"
  })
  client.value.on('connect', () => {
    console.log('[MQTT] connected')
  })
  client.value.on('error', err => {
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
  stopCamera()
  if (client.value) client.value.end()
})

// ---------- jsQR & Kamera ----------
async function initJsQrAndStartCamera() {
  console.log('[initJsQrAndStartCamera] loading jsQR dynamically...')
  const lib = await import('jsqr')
  jsQR = lib.default || lib.jsQR || null
  if (!jsQR) {
    console.error('[initJsQrAndStartCamera] jsQR not found in module =>', lib)
    return
  }
  console.log('[initJsQrAndStartCamera] jsQR loaded =>', jsQR)
  startCamera()
    .then(() => {
      console.log('[initJsQrAndStartCamera] camera started => starting scan loop')
      scanningActive = true
      scanLoop()
    })
    .catch(err => {
      console.error('[initJsQrAndStartCamera] could not start camera:', err)
    })
}

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
  videoRef.value.srcObject = localStream
  await videoRef.value.play()
  console.log('[startCamera] video playing...')
}

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

function scanLoop() {
  if (!scanningActive) return
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) {
    animFrameId = requestAnimationFrame(scanLoop)
    return
  }
  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, canvas.width, canvas.height)
  if (code?.data) {
    console.log('[scanLoop] found QR =>', code.data)
    pillowId.value = code.data
    stopCamera()
    step.value = 2
    subscribeToPillowId(code.data)
    return
  }
  animFrameId = requestAnimationFrame(scanLoop)
}

function subscribeToPillowId(id) {
  if (client.value && client.value.connected) {
    client.value.subscribe(`${id}/#`, err => {
      if (err) console.error('[subscribeToPillowId] error =>', err)
      else console.log(`[subscribeToPillowId] subscribed to ${id}/#`)
    })
  } else {
    console.warn('[subscribeToPillowId] client not connected yet')
  }
}

function skipScan() {
  console.log('[skipScan] => Setting pillowId = pillow-142587n826-bed3')
  pillowId.value = 'pillow-142587n826-bed3'
  step.value = 2
  stopCamera()
  subscribeToPillowId('pillow-142587n826-bed3')
}

// ---------- MQTT: Senden ----------
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
  showCheckOverlay.value = true
  setTimeout(() => {
    showCheckOverlay.value = false
  }, 2000)
}
</script>

<style scoped>
/* ========== BASIS ========== */
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
  padding-top: 2rem;
}

.qrimg {
  display: flex;
  flex-direction: column;
}

.qrdescr {
  font-size: 1rem;
  color: #777;
  padding: 1rem;
}

.camera-preview {
  width: 300px;
  height: 300px;
  border: 2px solid #444;
  object-fit: cover;
  background: #ffffff;
  border-radius: 1rem;
}

.scan-canvas {
  display: none;
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
}

.content {
  flex: 1;
  margin-top: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  max-width: 320px;
  margin: auto;
}

/* TIME-PICKER: Native Timepicker */
.time-section {
  margin-top: 5rem;
  text-align: center;
  cursor: pointer;
  position: relative;
  display: inline-block;
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

/* Hier wird der native Timepicker nur über dem Label platziert */
.native-timepicker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
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
  margin: auto 0;
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

/* HELP LINK */
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
