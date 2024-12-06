<template>
  <div class="figma-embed-container">
    <button class="back-button" @click="goToOverview">Zur Übersicht</button>
    <iframe :src="figmaSrc" allowfullscreen></iframe>
  </div>
</template>

<script>
export default {
  data() {
    return {
      figmaSrc:
        "https://embed.figma.com/proto/rHMiCRxSPiksU9tFb5V7CY/Projektergebnisse?page-id=0%3A1&node-id=20-4236&node-type=canvas&viewport=94%2C338%2C0.07&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=20%3A2857&show-proto-sidebar=0&embed-host=share",
    };
  },
  methods: {
    goToOverview() {
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.figma-embed-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}

.back-button {
  position: absolute;
  bottom: 1%; /* Abstand vom unteren Rand */
  left: 50%; /* Zentrierung horizontal */
  transform: translateX(-50%);
  z-index: 10;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #171717;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.back-button:hover {
  background-color: #7e7e7e;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
