<template>
  <div class="link-container">
    <!-- Link 1 -->
    <div class="protected-link">
      <button @click="promptPassword(0)">
        <img src="/img/image1.png" alt="Seite 1" />
        <p>PlantMonit</p>
      </button>
    </div>
    <!-- Link 2 -->
    <div class="protected-link">
      <button @click="promptPassword(1)">
        <img src="/img/image2.png" alt="Seite 2" />
        <p>Seite 2</p>
      </button>
    </div>
    <!-- Link 3 -->
    <div class="protected-link">
      <button @click="promptPassword(2)">
        <img src="/img/image3.png" alt="Seite 3" />
        <p>Seite 3</p>
      </button>
    </div>
    <!-- Link 4 -->
    <div class="protected-link">
      <button @click="promptPassword(3)">
        <img src="/img/image4.png" alt="Seite 4" />
        <p>Seite 4</p>
      </button>
    </div>
    <!-- Link 5 -->
    <div class="protected-link">
      <button @click="promptPassword(4)">
        <img src="/img/image5.png" alt="Seite 5" />
        <p>Seite 5</p>
      </button>
    </div>
    <!-- Link 6 -->
    <div class="protected-link">
      <button @click="promptPassword(5)">
        <img src="/img/image6.png" alt="Seite 6" />
        <p>Seite 6</p>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      links: [
        { url: "/page1", password: "pass1" },
        { url: "/page2", password: "pass2" },
        { url: "/page3", password: "pass3" },
        { url: "/page4", password: "pass4" },
        { url: "/page5", password: "pass5" },
        { url: "/page6", password: "pass6" },
      ],
    };
  },
  methods: {
    promptPassword(index) {
      const userPassword = prompt("Bitte geben Sie das Passwort ein:");
      if (userPassword === this.links[index].password) {
        this.$router.push(this.links[index].url);
      } else {
        alert("Falsches Passwort!");
      }
    },
  },
};
</script>

<style scoped>
/* Container zentrieren */
.link-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  justify-content: center;
  align-content: center;
  height: 100vh;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.protected-link button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
}

.protected-link button img {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 0.5rem;
  transition: transform 0.3s ease;
}

.protected-link button img:hover {
  transform: scale(1.05); /* Vergrößert das Bild bei Hover */
}

.protected-link button p {
  font-size: 1rem;
  color: #333;
  margin: 0;
}
</style>
