<template>
  <div class="container">
    <header>
      <h1>Klappensteuerung einstellen</h1>
      <p>
        Status:
        <span :class="connectionStatusClass">{{ connectionStatus }}</span>
      </p>
    </header>

    <div class="klappen">
      <div class="klappe-card" v-for="klappe in klappen" :key="klappe.id">
        <h2>Klappe {{ klappe.id }}</h2>
        <div class="input-row">
          <div class="input-group">
            <label :for="`klappe${klappe.id}-date`">Datum:</label>
            <input
              :id="`klappe${klappe.id}-date`"
              type="date"
              v-model="klappe.date"
            />
          </div>
          <div class="input-group">
            <label :for="`klappe${klappe.id}-time`">Uhrzeit:</label>
            <input
              :id="`klappe${klappe.id}-time`"
              type="time"
              v-model="klappe.time"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="send-button" @click="sendMessage">Senden</button>

    <div class="messages">
      <h3>Empfangene Nachrichten</h3>
      <ul>
        <li v-for="(msg, index) in messages" :key="index" class="message-item">
          <span class="message-topic">{{ msg.topic }}</span
          >: <span class="message-content">{{ msg.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import mqtt from "mqtt";

export default {
  data() {
    const today = new Date();
    const formatDate = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const addDays = (dateObj, days) => {
      const result = new Date(dateObj);
      result.setDate(result.getDate() + days);
      return result;
    };

    return {
      client: null,
      klappen: [
        {
          id: 1,
          date: formatDate(today),
          time: "17:00",
        },
        {
          id: 2,
          date: formatDate(addDays(today, 1)),
          time: "17:00",
        },
        {
          id: 3,
          date: formatDate(addDays(today, 2)),
          time: "17:00",
        },
      ],
      topicBase: "johannes",
      brokerUrl: "wss://mqtt.hfg.design:443/mqtt",
      connectionStatus: "Nicht verbunden",
      messages: [], // Array von Nachrichtenobjekten
    };
  },
  computed: {
    connectionStatusClass() {
      return {
        connected: this.connectionStatus === "Verbunden",
        error: this.connectionStatus === "Fehler",
        offline: this.connectionStatus === "Offline",
        reconnecting:
          this.connectionStatus === "Versuche erneut zu verbinden...",
      };
    },
  },
  mounted() {
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on("connect", () => {
      this.connectionStatus = "Verbunden";
      console.log("Erfolgreich mit MQTT-Broker verbunden (WebSocket)");
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
      const msgObj = {
        topic: topic,
        message: message.toString(),
      };
      console.log(`Empfangen: ${msgObj.topic} - ${msgObj.message}`);
      this.messages.unshift(msgObj); // Neueste Nachrichten oben
    });
  },
  methods: {
    sendMessage() {
      if (this.client && this.client.connected) {
        this.klappen.forEach((klappe) => {
          // Klappe Datum senden
          this.client.publish(
            `${this.topicBase}/klappe${klappe.id}/date`,
            klappe.date,
            {},
            (err) => {
              if (err) {
                console.error(
                  `Fehler beim Senden des Datums für Klappe ${klappe.id}:`,
                  err
                );
              } else {
                console.log(
                  `Klappe ${klappe.id} Datum gesendet: ${klappe.date}`
                );
              }
            }
          );

          // Klappe Uhrzeit senden
          this.client.publish(
            `${this.topicBase}/klappe${klappe.id}/time`,
            klappe.time,
            {},
            (err) => {
              if (err) {
                console.error(
                  `Fehler beim Senden der Uhrzeit für Klappe ${klappe.id}:`,
                  err
                );
              } else {
                console.log(
                  `Klappe ${klappe.id} Uhrzeit gesendet: ${klappe.time}`
                );
              }
            }
          );
        });

        // Optional: Feedback an den Nutzer
        alert("Daten erfolgreich gesendet!");
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
/* Allgemeine Styles */
.container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  font-family: "Roboto", sans-serif;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2rem;
  color: #333;
}

header p {
  font-size: 1rem;
  color: #666;
}

header .connected {
  color: #28a745;
}

header .error {
  color: #dc3545;
}

header .offline {
  color: #ffc107;
}

header .reconnecting {
  color: #17a2b8;
}

/* Klappen-Layout */
.klappen {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Klappe-Karte */
.klappe-card {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.klappe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.klappe-card h2 {
  margin-top: 0;
  color: #007bff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

/* Input-Reihe */
.input-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.input-group label {
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input-group input:focus {
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  outline: none;
}

/* Send-Button */
.send-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin: 2rem 0;
}

.send-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

/* Nachrichtenbereich */
.messages {
  background-color: #f1f1f1;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.messages h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1rem;
}

.messages ul {
  list-style-type: none;
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0.5rem;
  background: #ffffff;
  margin-bottom: 0.5rem;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
}

.message-topic {
  font-weight: 600;
  color: #007bff;
  margin-right: 0.5rem;
}

.message-content {
  color: #555;
  word-break: break-word;
}

/* Statusfarben */
.connected {
  color: #28a745;
  font-weight: bold;
}

.error {
  color: #dc3545;
  font-weight: bold;
}

.offline {
  color: #ffc107;
  font-weight: bold;
}

.reconnecting {
  color: #17a2b8;
  font-weight: bold;
}

/* Responsives Design */
@media (max-width: 600px) {
  .input-row {
    flex-direction: column;
  }

  .message-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-topic {
    margin-bottom: 0.25rem;
  }
}
</style>
