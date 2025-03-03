<template>
  <div class="page-container">
    <!-- Vor Kalenderaktivierung: großer Titel & Header -->
    <div v-if="!userPassphrase" class="title">DATEPLAN</div>
    <header v-if="!userPassphrase" class="main-header">
      <div class="header-buttons">
        <button class="btn" @click="openCreateModal">Create Kalender</button>
        <button class="btn" @click="openJoinModal">Join Kalender</button>
      </div>
    </header>
    <!-- Wenn Kalender aktiv, kleines Logo oben links -->
    <div v-else class="logo">DP</div>

    <!-- Modal: Create Kalender -->
    <div v-if="isCreateModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Neuen Kalender erstellen</h2>
        <form @submit.prevent="createCalendar">
          <div>
            <label for="adminName">Dein Name (Admin):</label>
            <input class="input" type="text" id="adminName" v-model="newAdminName" required />
          </div>
          <div class="modal-buttons">
            <button type="submit" class="btn">Erstellen</button>
            <button type="button" class="btn btn-secondary" @click="closeCreateModal">Abbrechen</button>
          </div>
        </form>
        <div v-if="createdPassphrase" class="modal-result">
          <p><strong>Kalender erstellt!</strong></p>
          <p><strong>Passphrase: </strong> {{ createdPassphrase }}</p>
          <p>
            <strong>Einladungslink: </strong>
            <a :href="invitationLink" target="_blank">{{ invitationLink }}</a>
          </p>
          <p>Der Einladungslink wurde in die Zwischenablage kopiert.</p>
        </div>
      </div>
    </div>

    <!-- Modal: Join Kalender -->
    <div v-if="isJoinModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Kalender beitreten</h2>
        <form @submit.prevent="joinCalendar">
          <div>
            <label for="joinPassphrase">Passphrase: </label>
            <input class="input" type="text" id="joinPassphrase" v-model="joinPassphrase" required />
          </div>
          <div>
            <label for="joinUserName">Dein Name: </label>
            <input class="input" type="text" id="joinUserName" v-model="joinUserName" required />
          </div>
          <div class="modal-buttons">
            <button type="submit" class="btn">Beitreten</button>
            <button type="button" class="btn btn-secondary" @click="closeJoinModal">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Kalendercontainer -->
    <div :class="['calendar-container', userPassphrase && 'calendar-container--top']">
      <div class="calendar-header">
        <div class="year-display">{{ currentYear }}</div>
      </div>
      <div class="months-grid">
        <div v-for="(month, mIndex) in months" :key="mIndex" class="month">
          <div class="month-title">{{ monthNames[mIndex] }}</div>
          <div class="weeks">
            <div v-for="(week, wIndex) in month.weeks" :key="wIndex" class="week">
              <div v-for="(day, dIndex) in week" :key="dIndex" class="day" :class="{ empty: !day }"
                :style="getDayStyle(day)" @click="toggleDaySelection(day)">
                <span v-if="day">{{ day.getDate() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Button zum Absenden der Buchung -->
    <div v-if="userPassphrase && (selectedDates.length || deselectedDates.length)" class="booking-actions">
      <button class="btn" @click="submitBooking">Buchung absenden</button>
    </div>

    <!-- Teilnehmerliste -->
    <div v-if="userPassphrase && uniqueUsers.length" class="user-list">
      <p>Teilnehmer:</p>
      <ul>
        <li v-for="user in uniqueUsers" :key="user" @click="toggleFilterUser(user)"
          :class="{ active: filterUser === user }">
          {{ user }}
        </li>
        <li v-if="filterUser" @click="clearFilter">Alle anzeigen</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)


// --------------------------
// 1) Kalenderdaten (jährliches Raster)
// --------------------------
const currentYear = dayjs().year()
const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
const months = computed(() => {
  const result = []
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(currentYear, m, 1)
    const lastDay = new Date(currentYear, m + 1, 0)
    const cells = []
    // Anzahl leerer Felder vor dem 1. des Monats
    const emptyBefore = firstDay.getDay()
    for (let i = 0; i < emptyBefore; i++) {
      cells.push(null)
    }
    // Tage des Monats
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(currentYear, m, d))
    }
    // Auffüllen auf ein Vielfaches von 7
    while (cells.length % 7 !== 0) {
      cells.push(null)
    }
    const weeks = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    result.push({ weeks })
  }
  return result
})

// --------------------------
// 2) States für Modals, aktiver Kalender, Buchungen
// --------------------------
const isCreateModalOpen = ref(false)
const isJoinModalOpen = ref(false)
const newAdminName = ref('')
const joinPassphrase = ref('')
const joinUserName = ref('')
const createdPassphrase = ref('')
const invitationLink = ref('')
const userPassphrase = ref('') // Aktive Kalender-Passphrase
const currentUser = ref('')    // Aktueller Nutzername
const bookings = ref([])       // Einträge (DB)

// Neue Auswahlen
const selectedDates = ref([])   // Neue Buchungen
const deselectedDates = ref([]) // Markierte "zu löschende" DB-Buchungen

// --------------------------
// 3) Computed: Eigene Buchungen & andere Buchungen
// --------------------------
const myBookedDates = computed(() => {
  const dates = new Set()
  bookings.value.forEach(entry => {
    if (entry.username === currentUser.value && entry.unavailabledates) {
      entry.unavailabledates.forEach(d => dates.add(d))
    }
  })
  return dates
})
const otherBookingCount = computed(() => {
  const counts = {}
  bookings.value.forEach(entry => {
    if (entry.unavailabledates) {
      entry.unavailabledates.forEach(d => {
        if (entry.username !== currentUser.value) {
          counts[d] = (counts[d] || 0) + 1
        }
      })
    }
  })
  return counts
})

// --------------------------
// 4) Modals öffnen/schließen & Kalender aktivieren
// --------------------------
function openCreateModal() {
  isCreateModalOpen.value = true
  newAdminName.value = ''
  createdPassphrase.value = ''
  invitationLink.value = ''
}
function closeCreateModal() {
  isCreateModalOpen.value = false
}
function openJoinModal() {
  isJoinModalOpen.value = true
  joinPassphrase.value = ''
  joinUserName.value = ''
}
function closeJoinModal() {
  isJoinModalOpen.value = false
}

async function createCalendar() {
  const generatedPassphrase = Math.random().toString(36).substring(2, 10)
  try {
    const res = await $fetch('/api/groups', {
      method: 'POST',
      body: {
        groupName: 'Neuer Kalender',
        adminName: newAdminName.value,
        passphrase: generatedPassphrase
      }
    })
    if (res.message) {
      createdPassphrase.value = generatedPassphrase
      invitationLink.value = window.location.origin + '/?passphrase=' + generatedPassphrase
      await navigator.clipboard.writeText(invitationLink.value)
      userPassphrase.value = generatedPassphrase
      currentUser.value = newAdminName.value
      isCreateModalOpen.value = false
      isJoinModalOpen.value = false
      fetchBookings()
    }
  } catch (error) {
    console.error("Fehler beim Erstellen des Kalenders:", error)
  }
}

async function joinCalendar() {
  if (joinPassphrase.value && joinUserName.value) {
    userPassphrase.value = joinPassphrase.value
    currentUser.value = joinUserName.value
    isJoinModalOpen.value = false
    fetchBookings()
  }
}

// --------------------------
// 5) Buchungen abrufen (API-Endpunkt GET /api/entries/[passphrase])
// --------------------------
function fetchBookings() {
  if (!userPassphrase.value) {
    bookings.value = []
    return
  }
  $fetch(`/api/entries/${userPassphrase.value}`)
    .then(res => { bookings.value = res.entries || [] })
    .catch(err => { console.error("Error fetching bookings:", err); bookings.value = [] })
}

// --------------------------
// 6) Tag-Auswahl für Zeitspanne und Freigabe
// --------------------------
function toggleDaySelection(day) {
  if (!day) return
  const dateStr = dayjs(day).format('YYYY-MM-DD')

  // a) Falls bereits neu ausgewählt -> entfernen
  if (selectedDates.value.includes(dateStr)) {
    selectedDates.value = selectedDates.value.filter(d => d !== dateStr)
    return
  }

  // b) Falls bereits in DB (eigene Buchung), dann togglen wir Freigabe
  if (myBookedDates.value.has(dateStr)) {
    if (!deselectedDates.value.includes(dateStr)) {
      deselectedDates.value.push(dateStr)
    } else {
      deselectedDates.value = deselectedDates.value.filter(d => d !== dateStr)
    }
    return
  }

  // c) Sonst: Neue Auswahl
  if (selectedDates.value.length === 0) {
    // 1. Klick -> push
    selectedDates.value.push(dateStr)
  } else if (selectedDates.value.length === 1) {
    // 2. Klick -> Zeitspanne
    let start = dayjs(selectedDates.value[0])
    let end = dayjs(day)
    if (end.isBefore(start)) [start, end] = [end, start]
    const range = []
    let cur = start
    while (cur.isSameOrBefore(end)) {
      range.push(cur.format('YYYY-MM-DD'))
      cur = cur.add(1, 'day')
    }
    selectedDates.value = range
  } else {
    // Schon mehr als 1 Tag drin -> reset auf diesen einen Tag
    selectedDates.value = [dateStr]
  }
}

// --------------------------
// 7) Dynamischer Stil pro Tag
// --------------------------
function getDayStyle(day) {
  if (!day) return {}
  const dateStr = dayjs(day).format('YYYY-MM-DD')

  // Neue Auswahl (noch nicht in DB)
  if (selectedDates.value.includes(dateStr)) {
    return { background: '#000', color: '#fff', border: "0.5px solid #000" }
  }
  // Eigene DB-Buchungen (grau + dicker schwarzer Rahmen), sofern nicht zur Freigabe markiert
  if (myBookedDates.value.has(dateStr) && !deselectedDates.value.includes(dateStr)) {
    return { background: '#ccc', border: "2px solid #000", color: "#000" }
  }
  // Buchungen anderer Nutzer
  const count = otherBookingCount.value[dateStr] || 0
  if (count > 0) {
    const opacity = Math.min(0.2 + count * 0.2, 0.8)
    return { background: `rgba(128,128,128,${opacity})`, border: "0.5px solid #cfcfcf" }
  }
  // Standard
  return { background: '#fff', border: "0.5px solid #cfcfcf" }
}

// --------------------------
// 8) Buchung absenden -> POST /api/entries (neue), POST /api/entries/remove (löschen)
// --------------------------
async function submitBooking() {
  try {
    // a) Neue Buchungen hinzufügen
    if (selectedDates.value.length) {
      await $fetch('/api/entries', {
        method: 'POST',
        body: {
          groupPassphrase: userPassphrase.value,
          userName: currentUser.value,
          unavailableDates: selectedDates.value
        }
      })
    }
    // b) Eigene Buchungen entfernen
    if (deselectedDates.value.length) {
      await $fetch('/api/entries/remove', {
        method: 'POST',
        body: {
          groupPassphrase: userPassphrase.value,
          userName: currentUser.value,
          unavailableDates: deselectedDates.value
        }
      })
    }
    // Reset
    selectedDates.value = []
    deselectedDates.value = []
    fetchBookings()
  } catch (error) {
    console.error("Fehler beim Absenden der Buchung:", error)
  }
}

// --------------------------
// 9) Teilnehmerliste & Filter (optional)
// --------------------------
const uniqueUsers = computed(() => {
  const users = new Set()
  bookings.value.forEach(entry => {
    if (entry.username) users.add(entry.username)
  })
  return Array.from(users)
})

const filterUser = ref('')
function toggleFilterUser(user) {
  filterUser.value = filterUser.value === user ? '' : user
}
function clearFilter() {
  filterUser.value = ''
}
</script>

<style scoped>
.page-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5f5f5;
  min-height: 100vh;
  padding: 2rem;
}

.title {
  font-size: clamp(4rem, 19vw, 19rem);
  font-weight: bold;
  margin-bottom: 5rem;
  color: #000;
  text-align: justify;
  white-space: nowrap;
  line-height: 65%;
}

.title::after {
  content: "";
  display: inline-block;
  width: 100%;
}

.logo {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 2rem;
  font-weight: bold;
  color: #000;
}

.main-header {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  background: #000;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn:hover {
  background: #333;
}

.btn.btn-secondary {
  background: #777;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  width: 300px;
  text-align: center;
}

.input {
  height: 1.5rem;
  width: auto;
  border-radius: 0.5rem;
  border: 0.5px solid #bcbcbc;
}


.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-buttons {
  display: flex;
  justify-content: space-around;

}

.calendar-container {
  width: 100%;
  max-width: 1200px;
  background: #fff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 4rem auto;
  transition: margin-top 0.5s ease;
}

.calendar-container--top {
  margin-top: 1rem;
}

.calendar-header {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background: #000;
}

.year-display {
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.month {
  padding: 0.5rem;
}

.month-title {
  text-align: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #000;
}

.week {
  display: flex;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.day {
  width: 2rem;
  height: 1.7rem;
  border: 0.5px solid #cfcfcf;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.25rem;
  font-size: 0.8rem;
  background: #fff;
  transition: background 0.3s ease, border 0.3s ease;
}

.day:hover {
  background: #e0e0e0;
}

.day.empty {
  border: 0.5px solid #e7e7e7;
}

.booking-actions {
  margin-top: 1rem;
}

.user-list {
  margin-top: 1rem;
}

.user-list ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 1rem;
}

.user-list li {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 1px solid #000;
  border-radius: 20px;
  transition: background 0.3s ease;
}

.user-list li.active,
.user-list li:hover {
  background: #ddd;
}
</style>
