<template>
  <div>
    <h1>MQTT Sender (WebSocket)</h1>
    <p>Verbindungsstatus: {{ connectionStatus }}</p>

    <div>
      <label for="temp">Temperatur:</label>
      <input
        id="temp"
        type="number"
        v-model.number="temp"
        placeholder="z. B. 45"
      />
    </div>
    <div>
      <label for="hour">Stunde:</label>
      <input
        id="hour"
        type="number"
        v-model.number="hour"
        placeholder="z. B. 20"
      />
    </div>
    <div>
      <label for="minute">Minute:</label>
      <input
        id="minute"
        type="number"
        v-model.number="minute"
        placeholder="z. B. 20"
      />
    </div>
    <button @click="sendMessage">Senden</button>

    <h2>Nachrichten aus Topic "{{ topic }}"</h2>
    <ul>
      <li v-for="(msg, index) in messages" :key="index">{{ msg }}</li>
    </ul>
  </div>
</template>

<script>
import mqtt from "mqtt";

export default {
  data() {
    return {
      client: null,
      temp: 45, // Standardwert für Temperatur
      hour: 20, // Standardwert für Stunde
      minute: 20, // Standardwert für Minute
      topic: "johannes", // MQTT-Topic
      brokerUrl: "wss://mqtt.hfg.design:443/mqtt", // WebSocket-URL des Brokers
      connectionStatus: "Nicht verbunden", // Statusanzeige
      messages: [], // Empfangene Nachrichten
    };
  },
  mounted() {
    // MQTT-Client über WebSocket verbinden
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on("connect", () => {
      this.connectionStatus = "Verbunden";
      console.log("Erfolgreich mit MQTT-Broker verbunden (WebSocket)");

      // Abonniere das Topic
      this.client.subscribe(this.topic, (err) => {
        if (err) {
          console.error("Fehler beim Abonnieren des Topics:", err);
        } else {
          console.log(`Abonniert: ${this.topic}`);
        }
      });
    });

    this.client.on("error", (error) => {
      this.connectionStatus = "Fehler";
      console.error("Fehler bei der MQTT-Verbindung:", error);
    });

    this.client.on("offline", () => {
      this.connectionStatus = "Offline";
      console.warn("MQTT-Client ist offline.");
    });

    this.client.on("reconnect", () => {
      this.connectionStatus = "Versuche erneut zu verbinden...";
      console.log("Versuche erneut, eine Verbindung herzustellen...");
    });

    // Nachrichten empfangen
    this.client.on("message", (topic, message) => {
      const msg = `Topic: ${topic}, Nachricht: ${message.toString()}`;
      console.log(msg);

      // Nachricht zur Liste hinzufügen
      this.messages.push(msg);
    });
  },
  methods: {
    sendMessage() {
      // Eingaben validieren
      if (!this.temp || !this.hour || !this.minute) {
        alert("Bitte alle Felder ausfüllen!");
        return;
      }

      // Nachricht erstellen
      const payload = JSON.stringify({
        temp: this.temp,
        hour: this.hour,
        minute: this.minute,
      });

      if (this.client && this.client.connected) {
        this.client.publish(this.topic, payload, {}, (err) => {
          if (err) {
            console.error("Fehler beim Senden der Nachricht:", err);
          } else {
            alert(`Nachricht gesendet: ${payload}`);
          }
        });
      } else {
        alert("MQTT-Client ist nicht verbunden.");
      }
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
h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

label {
  margin-right: 0.5rem;
}

input {
  padding: 0.5rem;
  margin: 0.5rem 0;
  width: 100px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

ul {
  margin-top: 1rem;
  list-style-type: none;
  padding: 0;
}

li {
  background: #f8f9fa;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}
</style>
