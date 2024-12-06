<template>
  <div>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
        rel="stylesheet"
      />

      <title>Figma Prototypen</title>
    </head>
    <NuxtPage />

    <header></header>
  </div>
</template>

<script setup></script>

<style>
/* Grundlegendes Styling */
html,
body {
  font-family: "Inter", sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Globaler Stil für alle Scrollbars */
::-webkit-scrollbar {
  width: 1px; /* Breite der Scrollbar */
  height: 1px; /* Höhe der horizontalen Scrollbar */
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.5); /* Farbe der Scrollbar */
  border-radius: 10px; /* Runde Kanten */
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.7); /* Hover-Effekt */
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1); /* Hintergrund der Scrollbar */
  border-radius: 10px; /* Runde Kanten */
}

/* Firefox spezifisch */
body {
  scrollbar-width: thin; /* Dünne Scrollbars */
  scrollbar-color: rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0.1); /* Farbe von Daumen und Track */
}
</style>
