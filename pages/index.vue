<template>
  <div class="container">
    <header>
      <h1>Hasel Füttern</h1>
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

    <button class="send-button" @click="checkPasswordBefore(sendMessage)">
      Senden
    </button>

    <div class="messages">
      <h3>Empfangene Nachrichten</h3>
      <ul>
        <li v-for="(msg, index) in messages" :key="index" class="message-item">
          <span class="message-topic">{{ msg.topic }}</span
          >:
          <span class="message-content">{{ msg.message }}</span>
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
      loch: "HaselsFutter",
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
      topicBase: "hasel",
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
    checkPasswordBefore(action) {
      const input = prompt("Eingabe:");
      if (input === this.loch) {
        action();
      } else {
        alert("Falsch!");
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

<style>
/* Globale Styles für den Body */
body {
  margin: 0;
  padding: 0;
  background: linear-gradient(to bottom right, #a1887f, #6d4c41),
    /* Moderne Brauntöne */ url("/image.png"); /* Pfad zum Bild im public-Ordner */
  font-family: "Roboto", sans-serif;
  background-repeat: repeat;
  background-size: 160px 160px;
  background-blend-mode: lighten;
  background-color: rgba(255, 255, 255, 0.9);
}

/* Allgemeine Styles */
.container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.968);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2.5rem;
  color: #5d4037; /* Dunkelbraun */
  margin-bottom: 0.5rem;
  font-family: "Pacifico", cursive;
}

header p {
  font-size: 1.2rem;
  color: #6d4c41; /* Mittelbraun */
}

header .connected {
  color: #388e3c; /* Grün für Verbunden */
}

header .error {
  color: #d32f2f; /* Rot für Fehler */
}

header .offline {
  color: #fbc02d; /* Gelb für Offline */
}

header .reconnecting {
  color: #1976d2; /* Blau für Wiederverbinden */
}

/* Klappen-Layout */
.klappen {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Klappe-Karte */
.klappe-card {
  background-color: #ffe0b2; /* Helles Braun-Orange */
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #bcaaa4; /* Mittelbraun */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.klappe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.klappe-card h2 {
  margin-top: 0;
  color: #5d4037; /* Dunkelbraun */
  font-size: 1.8rem;
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
  color: #5d4037; /* Dunkelbraun */
  font-weight: 500;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #bcaaa4; /* Mittelbraun */
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input-group input:focus {
  border-color: #6d4c41; /* Mittelbraun */
  box-shadow: 0 0 5px rgba(109, 76, 65, 0.5);
  outline: none;
}

/* Send-Button */
.send-button {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background-color: #6d4c41; /* Mittelbraun */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
  margin: 2rem 0;
}

.send-button:hover {
  background-color: #5d4037; /* Dunkelbraun */
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* Nachrichtenbereich */
.messages {
  background-color: #6d4c4191; /* Helles Braun-Orange */
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.messages h3 {
  margin-top: 0;
  color: #5d4037; /* Dunkelbraun */
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
  background: #fff8e1; /* Sehr helles Braun-Orange */
  margin-bottom: 0.5rem;
  border-left: 4px solid #6d4c41; /* Mittelbraun */
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
}

.message-topic {
  font-weight: 600;
  color: #6d4c41; /* Mittelbraun */
  margin-right: 0.5rem;
}

.message-content {
  color: #5d4037; /* Dunkelbraun */
  word-break: break-word;
}

/* Statusfarben */
.connected {
  color: #388e3c; /* Grün für Verbunden */
  font-weight: bold;
}

.error {
  color: #d32f2f; /* Rot für Fehler */
  font-weight: bold;
}

.offline {
  color: #fbc02d; /* Gelb für Offline */
  font-weight: bold;
}

.reconnecting {
  color: #1976d2; /* Blau für Wiederverbinden */
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
