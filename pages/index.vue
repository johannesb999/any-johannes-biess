<template>
  <div>
    <h1>Wecker Stellen</h1>
    <p>Wecker: {{ connectionStatus }}</p>

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

    <!-- <h2>Wecker gestellt auf "{{ topicBase }}"</h2> -->
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
      temp: 44, // Standardwert für Temperatur
      hour: 20, // Standardwert für Stunde
      minute: 20, // Standardwert für Minute
      topicBase: "johannes", // MQTT-Base-Topic
      brokerUrl: "wss://mqtt.hfg.design:443/mqtt", // WebSocket-URL des Brokers
      connectionStatus: "Nicht verbunden", // Statusanzeige
      messages: [], // Empfangene Nachrichten
    };
  },
  mounted() {
    // Aktuelle Uhrzeit plus eine Minute setzen
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Eine Minute hinzufügen
    this.hour = now.getHours(); // Aktuelle Stunde
    this.minute = now.getMinutes(); // Aktuelle Minute

    // MQTT-Client über WebSocket verbinden
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on("connect", () => {
      this.connectionStatus = "Verbunden";
      console.log("Erfolgreich mit MQTT-Broker verbunden (WebSocket)");

      // Abonniere die Base-Topics
      this.client.subscribe(`${this.topicBase}/#`, (err) => {
        if (err) {
          console.error("Fehler beim Abonnieren der Topics:", err);
        } else {
          console.log(`Abonniert: ${this.topicBase}/#`);
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
      if (this.temp == null || this.hour == null || this.minute == null) {
        alert("Bitte alle Felder ausfüllen!");
        return;
      }

      // Sende die Werte an die jeweiligen Topics
      if (this.client && this.client.connected) {
        // Temperatur senden
        this.client.publish(
          `${this.topicBase}/heat`,
          String(this.temp),
          {},
          (err) => {
            if (err) {
              console.error("Fehler beim Senden von Temperatur:", err);
            } else {
              console.log(`Temperatur gesendet: ${this.temp}`);
            }
          }
        );

        // Stunde senden
        this.client.publish(
          `${this.topicBase}/hour`,
          String(this.hour),
          {},
          (err) => {
            if (err) {
              console.error("Fehler beim Senden von Stunde:", err);
            } else {
              console.log(`Stunde gesendet: ${this.hour}`);
            }
          }
        );

        // Minute senden
        this.client.publish(
          `${this.topicBase}/minute`,
          String(this.minute),
          {},
          (err) => {
            if (err) {
              console.error("Fehler beim Senden von Minute:", err);
            } else {
              console.log(`Minute gesendet: ${this.minute}`);
            }
          }
        );
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
