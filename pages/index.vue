<template>
  <div class="app-container">
    <!-- ========== STEP 0: SPLASH SCREEN ========== -->
    <div v-if="step === 0" class="splash-screen">
      <div class="splash-content">
        <img class="pillow-icon-splash" src="public/docs/loader.svg" alt="Pillow icon" />
      </div>
    </div>

    <!-- ========== STEP 1: QR-SCAN SCREEN ========== -->
    <div v-else-if="step === 1">
      <!-- Nur der umschließende div erhält v-else-if -->
      <client-only>
        <!-- Innerhalb dieses div kommt der Kamera-Scan -->
        <div class="qr-scan-screen">
          <h2>QR-Code scannen</h2>
          <p>Bitte richte deine Kamera auf den Kissen-QR-Code.</p>

          <video ref="videoRef" class="camera-preview" />

          <!-- Optionaler Skip-Button zum Testen -->
          <button @click="skipScan" class="skip-btn">Überspringen (Test)</button>
        </div>
      </client-only>
    </div>

    <!-- ========== STEP 2: MAIN SCREEN ========== -->
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
          <!-- Dynamische ID -->
          <p class="pillow-status">Kissen {{ pillowId }} Verbunden</p>
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

    <!-- ========== Zeit-Picker Overlay ========== -->
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

    <!-- ========== Grüner Haken + "Sleep well" Overlay ========== -->
    <div v-if="showCheckOverlay" class="check-overlay">
      <div class="check-container">
        <img src="public/docs/zzzCheck.svg" alt="zzzCheck" class="check-icon" />
        <p class="check-text">Sleep well</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import mqtt from 'mqtt'

// --------------------------
// 1) Steps & globale States
// --------------------------
const step = ref(0)                // 0 = Splash, 1 = QR-Scan, 2 = Main
const pillowId = ref('CT-3000')    // Standard oder Platzhalter

const showSplash = ref(true)
const showTimePicker = ref(false)
const showCheckOverlay = ref(false)

// Zeit/Temp
const hour = ref(7)
const minute = ref(15)
const temp = ref(45)

// MQTT
const brokerUrl = 'wss://mqtt.hfg.design:443/mqtt'
const client = ref(null)

// --------------------------
// 2) QR-Reader (Dynamic Import)
// --------------------------
const videoRef = ref(null)
let start, stop, decodedResult, isSupported
const skipScan = () => {
  // Lokaltest ohne echten QR
  pillowId.value = 'TEST-1234'
  subscribeToPillowId(pillowId.value)
  if (stop) stop()
  step.value = 2
}

async function initScanner() {
  const { useQrReader } = await import('vue3-qr-reader')
  const scanner = useQrReader({
    video: videoRef,
    constraints: {
      facingMode: 'environment'
    }
  })
  start = scanner.start
  stop = scanner.stop
  decodedResult = scanner.decodedResult
  isSupported = scanner.isSupported

  // QR-Code beobachten
  watch(decodedResult, (val) => {
    if (val) {
      console.log('QR gefunden:', val)
      pillowId.value = val
      subscribeToPillowId(val)
      // Stop + Wechsel
      stop()
      step.value = 2
    }
  })
}

// MQTT-Subscribe, wenn eine pillowId da ist
function subscribeToPillowId(id) {
  if (client.value && client.value.connected) {
    client.value.subscribe(`${id}/#`, (err) => {
      if (err) console.error('MQTT-Subscribe Fehler:', err)
      else console.log('Abonniere Topic:', `${id}/#`)
    })
  }
}

// --------------------------
// 3) Lifecycle
// --------------------------
onMounted(() => {
  // a) Splash → nach 700ms => QR
  setTimeout(async () => {
    step.value = 1
    await initScanner()
    if (isSupported) start()
  }, 700)

  // b) Uhrzeit = jetzt +1 Min
  const now = new Date()
  now.setMinutes(now.getMinutes() + 1)
  hour.value = now.getHours()
  minute.value = now.getMinutes()

  // c) MQTT connect
  client.value = mqtt.connect(brokerUrl)
  client.value.on('connect', () => {
    console.log('MQTT verbunden')
  })
  client.value.on('error', (err) => {
    console.error('MQTT-Fehler:', err)
  })
  client.value.on('offline', () => {
    console.warn('MQTT offline')
  })
  client.value.on('reconnect', () => {
    console.log('MQTT reconnect...')
  })
  client.value.on('message', (topic, message) => {
    console.log(`[MQTT] ${topic}: ${message.toString()}`)
  })
})

onUnmounted(() => {
  // Kamera
  if (stop) stop()
  // MQTT
  if (client.value) client.value.end()
})

// --------------------------
// 4) Computed
// --------------------------
const formattedHour = computed(() => String(hour.value).padStart(2, '0'))
const formattedMinute = computed(() => String(minute.value).padStart(2, '0'))
const minutePadded = computed(() => String(minute.value).padStart(2, '0'))

// --------------------------
// 5) Methoden
// --------------------------
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

// Abschicken => MQTT
function sendMessage() {
  if (!pillowId.value) {
    console.warn('Keine pillowId. Abbruch.')
    return
  }
  if (client.value && client.value.connected) {
    client.value.publish(`${pillowId.value}/heat`, String(temp.value))
    client.value.publish(`${pillowId.value}/hour`, String(hour.value))
    client.value.publish(`${pillowId.value}/minute`, String(minute.value))
    console.log('Gesendet:', {
      pillowId: pillowId.value,
      temp: temp.value,
      hour: hour.value,
      minute: minute.value,
    })
  } else {
    console.warn('MQTT nicht verbunden, kann nicht senden.')
  }

  // Overlay
  showCheckOverlay.value = true
  setTimeout(() => {
    showCheckOverlay.value = false
  }, 2000)
}
</script>

<style scoped>
/* Deine bisherigen Styles... (leicht gekürzt) */

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

/* ========== SPLASH SCREEN ========== */
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

/* ========== MAIN SCREEN ========== */
.main-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header */
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

/* KISSEN-SEKTION */
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
  -webkit-appearance: none;
  appearance: none;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #ccc, #444);
  outline: none;
  cursor: pointer;
}

.temp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 1px solid #888;
  border-radius: 50%;
}

.temp-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border: 1px solid #888;
  border-radius: 50%;
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

/* ========== QR-SCAN SCREEN ========== */
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
  margin: 1rem 0;
  object-fit: cover;
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
</style>
