<template>
  <div class="app-container">
    <!-- Splash Screen -->
    <div class="splash-screen" v-if="showSplash">
      <div class="splash-content">

        <img class="pillow-icon-splash" src="public/docs/loader.svg" alt="Pillow icon" />
      </div>
    </div>

    <!-- Hauptbildschirm -->
    <div class="main-screen" v-else>
      <!-- Header mit zzz links und Dream On mittig -->
      <header class="app-header">
        <img class="zzz-header" src="public/docs/zzz.svg" alt="zzz icon" />
        <h1 class="header-title">DREAM ON</h1>
      </header>

      <!-- Inhalt -->
      <div class="content">
        <!-- Kissen -->
        <div class="pillow-section">
          <img class="pillow-icon-main" src="public/docs/pillow.svg" alt="Pillow icon" />
          <p class="pillow-status">Kissen CT-3000 Verbunden</p>
        </div>

        <!-- Time Picker -->
        <div class="time-section" @click="showTimePicker = true">
          <div class="time-display">
            {{ formattedHour }} : {{ formattedMinute }}
          </div>
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

<script>
import mqtt from "mqtt";

export default {
  data() {
    return {
      // MQTT
      client: null,
      topicBase: "johannes",
      brokerUrl: "wss://mqtt.hfg.design:443/mqtt",

      // Splash
      showSplash: true,

      // Zeit
      hour: 7,
      minute: 15,
      showTimePicker: false,

      // Temperatur
      temp: 45,

      // Grüner Haken Overlay
      showCheckOverlay: false,
    };
  },
  computed: {
    formattedHour() {
      return String(this.hour).padStart(2, "0");
    },
    formattedMinute() {
      return String(this.minute).padStart(2, "0");
    },
    minutePadded() {
      return String(this.minute).padStart(2, "0");
    },
  },
  mounted() {
    // Splash ausblenden nach 1.5s
    setTimeout(() => {
      this.showSplash = false;
    }, 700);

    // Uhrzeit = jetzt +1 Min
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    this.hour = now.getHours();
    this.minute = now.getMinutes();

    // MQTT Connect
    this.client = mqtt.connect(this.brokerUrl);
    this.client.on("connect", () => {
      console.log("MQTT verbunden");
      this.client.subscribe(`${this.topicBase}/#`, (err) => {
        if (err) {
          console.error("Fehler beim Abonnieren:", err);
        }
      });
    });
    this.client.on("error", (error) => {
      console.error("MQTT-Fehler:", error);
    });
    this.client.on("offline", () => {
      console.warn("MQTT offline");
    });
    this.client.on("reconnect", () => {
      console.log("MQTT reconnect...");
    });
    this.client.on("message", (topic, message) => {
      // Nur Konsole, kein UI
      console.log(`[MQTT] ${topic}: ${message.toString()}`);
    });
  },
  methods: {
    // Time-Picker
    incrementHour() {
      this.hour = (this.hour + 1) % 24;
    },
    decrementHour() {
      this.hour = (this.hour - 1 + 24) % 24;
    },
    incrementMinute() {
      let newMin = this.minute + 1;
      if (newMin === 60) {
        newMin = 0;
        this.incrementHour();
      }
      this.minute = newMin;
    },
    decrementMinute() {
      let newMin = this.minute - 1;
      if (newMin < 0) {
        newMin = 59;
        this.decrementHour();
      }
      this.minute = newMin;
    },
    applyTime() {
      this.closeTimePicker();
    },
    closeTimePicker() {
      this.showTimePicker = false;
    },

    // Abschicken => MQTT publizieren, grünes Overlay
    sendMessage() {
      if (this.client && this.client.connected) {
        this.client.publish(`${this.topicBase}/heat`, String(this.temp));
        this.client.publish(`${this.topicBase}/hour`, String(this.hour));
        this.client.publish(`${this.topicBase}/minute`, String(this.minute));
        console.log("Werte gesendet:", {
          temp: this.temp,
          hour: this.hour,
          minute: this.minute,
        });
      } else {
        console.warn("MQTT nicht verbunden. Konnte nicht senden.");
      }

      // Grünes Haken-Overlay anzeigen
      this.showCheckOverlay = true;
      setTimeout(() => {
        this.showCheckOverlay = false;
      }, 2000);
    },
  },
  beforeUnmount() {
    if (this.client) {
      this.client.end();
    }
  },
};
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

/* ZzZ-SVG */
.zzz-splash {
  position: absolute;
  top: 0;
  left: -40px;
  width: 40px;
  height: auto;
  transform: rotate(-20deg);
}

/* DREAM / ON / Pillow im Splash */



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

/* Inhalt mit 10rem Abstand */
.content {
  flex: 1;
  margin-top: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* ========== KISSEN-SEKTION ========== */
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

/* ========== TIME-PICKER ANZEIGE ========== */
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

/* ========== TEMPERATUR ========== */
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

/* Temperatur-Wert & Label daneben */
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

/* ========== BUTTON ========== */
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

/* ========== TIME PICKER OVERLAY ========== */
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

.time-picker-dialog h2 {
  margin-bottom: 12px;
  font-size: 1.2rem;
  font-weight: 600;
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

.dialog-col label {
  font-size: 0.8rem;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.arrow {
  font-size: 1.2rem;
  color: #000000;
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
  background: #000000;
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

/* ========== GRÜNER HAKEN OVERLAY ========== */
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

/* Kleiner Popup-Effekt */
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
