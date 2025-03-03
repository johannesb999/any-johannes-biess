<template>
  <div class="page-container">
    <!-- Header mit Navigation -->
    <app-header :is-active="!!userPassphrase" :passphrase="userPassphrase" :username="currentUser"
      :show-copy-hint="showCopyHint" @open-create-modal="openCreateModal" @open-join-modal="openJoinModal"
      @copy-passphrase="copyPassphraseToClipboard">
      <template #userList>
        <user-list v-if="userPassphrase && uniqueUsers.length" :users="uniqueUsers" :active-filter="filterUser"
          @user-filter-change="toggleFilterUser" @clear-filter="clearFilter" />
      </template>
    </app-header>

    <!-- Modal: Create Calendar -->
    <div v-if="isCreateModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Create new Calendar</h2>
        <form @submit.prevent="createCalendar">
          <div>
            <label for="adminName">Your Name:</label>
            <input class="input" type="text" id="adminName" v-model="newAdminName" required />
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-secondary" @click="closeCreateModal">cancel</button>
            <button type="submit" class="btn">Create</button>
          </div>
        </form>
        <div v-if="createdPassphrase" class="modal-result">
          <p><strong>Calendar created!</strong></p>
          <p><strong>Passphrase: </strong> {{ createdPassphrase }}</p>
          <p>
            <strong>Invitelink: </strong>
            <a :href="invitationLink" target="_blank">{{ invitationLink }}</a>
          </p>
          <p>Invitelink copied to clipboard.</p>
        </div>
      </div>
    </div>

    <!-- Modal: Join Calendar -->
    <div v-if="isJoinModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Join Calendar</h2>
        <form @submit.prevent="joinCalendar">
          <div>
            <label for="joinPassphrase">Passphrase: </label>
            <input class="input" type="text" id="joinPassphrase" v-model="joinPassphrase" required />
          </div>
          <div>
            <label for="joinUserName">Your Name: </label>
            <input class="input" type="text" id="joinUserName" v-model="joinUserName" required />
          </div>
          <div class="modal-buttons">
            <button type="button" class="btn btn-secondary" @click="closeJoinModal">cancel</button>
            <button type="submit" class="btn">Join</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Suggest Destination Modal -->
    <suggest-destination-modal :is-open="isSuggestDestinationModalOpen" @close="closeSuggestDestinationModal"
      @suggest="addDestinationSuggestion" />

    <!-- Calendarcontainer -->
    <div :class="['calendar-container', userPassphrase && 'calendar-container--top']">
      <!-- Calendar Header mit Year Navigation -->
      <div v-if="userPassphrase" class="calendar-header">
        <!-- User list -->
        <div class="user-list-header">
          <user-list v-if="uniqueUsers.length" :users="uniqueUsers" :active-filter="filterUser"
            @user-filter-change="toggleFilterUser" @clear-filter="clearFilter" />
        </div>

        <!-- Year display with nav buttons -->
        <div class="year-display">
          <div v-if="currentDisplayYear > currentRealYear" class="year-nav-button prev-year" @click="prevYear">
            {{ currentDisplayYear - 1 }}
          </div>
          <div class="current-year">{{ currentDisplayYear }}</div>
          <div class="year-nav-button next-year" @click="nextYear">
            {{ currentDisplayYear + 1 }}
          </div>
        </div>

        <!-- Home button -->
        <div class="home-button-container">
          <button class="home-button" @click="returnToStartPage">return</button>
        </div>
      </div>

      <div class="months-grid">
        <div v-for="(month, mIndex) in months" :key="mIndex" class="month">
          <div class="month-title">{{ monthNames[mIndex] }}</div>
          <div class="weeks">
            <div v-for="(week, wIndex) in month.weeks" :key="wIndex" class="week">
              <div v-for="(day, dIndex) in week" :key="dIndex" class="day" :class="{ empty: !day }"
                :style="getDayStyle(day)" @click="userPassphrase ? toggleDaySelection(day) : null">
                <span v-if="day">{{ day.getDate() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Button zum Absenden der Buchung und andere Aktionen -->
    <div v-if="userPassphrase" class="action-buttons">
      <button v-if="selectedDates.length || deselectedDates.length" class="btn" @click="submitBooking">enter</button>
      <button class="btn" @click="openSuggestDestinationModal">Suggest Destination</button>
      <button class="btn" @click="toggleShowDestinations">
        {{ showDestinations ? 'Hide Destinations' : 'Show Destinations' }}
      </button>
    </div>

    <!-- Destination Vorschläge -->
    <destination-suggestions v-if="userPassphrase && showDestinations" :destinations="destinationSuggestions" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import AppHeader from '../components/AppHeader.vue';
import UserList from '../components/UserList.vue';
import SuggestDestinationModal from '../components/Modals/SuggestDestinationModal.vue';
import DestinationSuggestions from '../components/DestinationSuggestions.vue';

dayjs.extend(isSameOrBefore);

// --------------------------
// 0) Farbkonfiguration für Buchungen
// --------------------------
const bookingColorConfig = {
  minOpacity: 0.2,  // Hellgrau für 1 Person (20% Opazität)
  maxOpacity: 0.9,  // Fast schwarz für maximale Überschneidung (90% Opazität)
  baseColor: 'rgb(80, 80, 80)' // Grau-Basis
}

// --------------------------
// 1) Calendardaten (jährliches Raster)
// --------------------------
const currentRealYear = dayjs().year()
const currentDisplayYear = ref(currentRealYear)
const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
const months = computed(() => {
  const result = []
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(currentDisplayYear.value, m, 1)
    const lastDay = new Date(currentDisplayYear.value, m + 1, 0)
    const cells = []
    // Anzahl leerer Felder vor dem 1. des Monats
    const emptyBefore = firstDay.getDay()
    for (let i = 0; i < emptyBefore; i++) {
      cells.push(null)
    }
    // Tage des Monats
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(currentDisplayYear.value, m, d))
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
// 2) States für Modals, aktiver Calendar, Buchungen
// --------------------------
const isCreateModalOpen = ref(false)
const isJoinModalOpen = ref(false)
const isSuggestDestinationModalOpen = ref(false)
const newAdminName = ref('')
const joinPassphrase = ref('')
const joinUserName = ref('')
const createdPassphrase = ref('')
const invitationLink = ref('')
const userPassphrase = ref('') // Aktive Calendar-Passphrase
const currentUser = ref('')    // Aktueller Nutzername
const bookings = ref([])       // Einträge (DB)
const placeholderDates = ref([]) // Zufällige Tage für den Platzhalter-Calendar
const showCopyHint = ref(false) // Anzeige dass Passphrase kopiert wurde

// Neue Auswahlen
const selectedDates = ref([])   // Neue Buchungen
const deselectedDates = ref([]) // Markierte "zu löschende" DB-Buchungen

// Destination Suggestions
const destinationSuggestions = ref([])
const showDestinations = ref(false)

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

  // Zähle für jeden Tag, wie viele Personen ihn als besetzt markiert haben
  bookings.value.forEach(entry => {
    if (entry.unavailabledates) {
      entry.unavailabledates.forEach(d => {
        if (!filterUser.value || entry.username === filterUser.value || entry.username === currentUser.value) {
          counts[d] = (counts[d] || 0) + 1
        }
      })
    }
  })

  return counts
})

// Maximale Anzahl von Buchungen auf einem Tag (für Farbskalierung)
const maxBookingsPerDay = computed(() => {
  let max = 1
  for (const day in otherBookingCount.value) {
    if (otherBookingCount.value[day] > max) {
      max = otherBookingCount.value[day]
    }
  }
  return max
})

// --------------------------
// 4) Modals öffnen/schließen & Calendar aktivieren
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

function openSuggestDestinationModal() {
  isSuggestDestinationModalOpen.value = true
}

function closeSuggestDestinationModal() {
  isSuggestDestinationModalOpen.value = false
}

async function createCalendar() {
  const generatedPassphrase = Math.random().toString(36).substring(2, 10)
  try {
    const res = await $fetch('/api/groups', {
      method: 'POST',
      body: {
        groupName: 'Neuer Calendar',
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
    console.error("Fehler beim Erstellen des Calendars:", error)
  }
}

async function joinCalendar() {
  if (joinPassphrase.value && joinUserName.value) {
    userPassphrase.value = joinPassphrase.value
    currentUser.value = joinUserName.value
    isJoinModalOpen.value = false
    await fetchBookings()
    await fetchDestinationSuggestions() // Lade vorhandene Zielvorschläge
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
  if (!day || !userPassphrase.value) return
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
    let end = dayjs(dateStr)
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

  // Wenn kein aktiver Calendar, zeigen wir nur Platzhalter-Tage
  if (!userPassphrase.value) {
    if (placeholderDates.value.includes(dateStr)) {
      return { background: '#ccc', border: "0.5px solid #cfcfcf" }
    }
    return { background: '#fff', border: "0.5px solid #cfcfcf" }
  }

  // Neue Auswahl (noch nicht in DB)
  if (selectedDates.value.includes(dateStr)) {
    return { background: '#000', color: '#fff', border: "0.5px solid #000" }
  }

  // Eigene DB-Buchungen (grau + dicker schwarzer Rahmen), sofern nicht zur Freigabe markiert
  if (myBookedDates.value.has(dateStr) && !deselectedDates.value.includes(dateStr)) {
    return { background: '#ccc', border: "2px solid #000", color: "#000" }
  }

  // Buchungen anderer Nutzer - mit gradueller Färbung basierend auf der Anzahl der Buchungen
  const count = otherBookingCount.value[dateStr] || 0
  if (count > 0) {
    // Dynamische Opazität basierend auf der Anzahl der Buchungen im Verhältnis zum Maximum
    const opacityRange = bookingColorConfig.maxOpacity - bookingColorConfig.minOpacity;
    const normalizedCount = Math.min(count / maxBookingsPerDay.value, 1);
    const opacity = bookingColorConfig.minOpacity + (normalizedCount * opacityRange);

    return {
      background: bookingColorConfig.baseColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba'),
      border: "0.5px solid #cfcfcf",
      color: opacity > 0.6 ? '#fff' : '#000' // Textfarbe anpassen für bessere Lesbarkeit
    }
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

// --------------------------
// 10) Generate random placeholder dates
// --------------------------
function generateRandomPlaceholderDates() {
  const dates = []
  const totalDates = 80 // Anzahl der zufälligen Tage

  for (let i = 0; i < totalDates; i++) {
    const month = Math.floor(Math.random() * 12)
    const maxDay = new Date(currentDisplayYear.value, month + 1, 0).getDate()
    const day = Math.floor(Math.random() * maxDay) + 1
    const dateStr = dayjs(new Date(currentDisplayYear.value, month, day)).format('YYYY-MM-DD')

    // Vermeiden von Duplikaten
    if (!dates.includes(dateStr)) {
      dates.push(dateStr)
    }
  }

  placeholderDates.value = dates
}

// --------------------------
// 11) Jahr-Navigation
// --------------------------
function nextYear() {
  currentDisplayYear.value++;
  generateRandomPlaceholderDates();
}

function prevYear() {
  if (currentDisplayYear.value > currentRealYear) {
    currentDisplayYear.value--;
    generateRandomPlaceholderDates();
  }
}

// --------------------------
// 12) Passphrase kopieren & zur Startseite zurückkehren
// --------------------------
function copyPassphraseToClipboard() {
  navigator.clipboard.writeText(userPassphrase.value)
    .then(() => {
      showCopyHint.value = true;
      setTimeout(() => {
        showCopyHint.value = false;
      }, 2000);
    })
    .catch(err => {
      console.error("Fehler beim Kopieren:", err);
    });
}

function returnToStartPage() {
  userPassphrase.value = '';
  currentUser.value = '';
  bookings.value = [];
  selectedDates.value = [];
  deselectedDates.value = [];
  filterUser.value = '';
  currentDisplayYear.value = currentRealYear;
  destinationSuggestions.value = [];
  window.history.pushState({}, document.title, window.location.pathname);
}

// --------------------------
// 13) Destination Suggestions
// --------------------------
async function addDestinationSuggestion(newDestination) {
  try {
    const response = await $fetch('/api/destinations', {
      method: 'POST',
      body: {
        groupPassphrase: userPassphrase.value,
        author: currentUser.value,
        destination: newDestination
      }
    });

    if (response.message) {
      await fetchDestinationSuggestions();
      showDestinations.value = true;
    }
  } catch (error) {
    console.error("Fehler beim Speichern des Zielvorschlags:", error);
  }

  closeSuggestDestinationModal();
}

async function fetchDestinationSuggestions() {
  if (!userPassphrase.value) return;

  try {
    const response = await $fetch(`/api/destinations/${userPassphrase.value}`);
    if (response.destinations) {
      destinationSuggestions.value = response.destinations;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Zielvorschläge:", error);
  }
}

function toggleShowDestinations() {
  showDestinations.value = !showDestinations.value;
  if (showDestinations.value && destinationSuggestions.value.length === 0) {
    fetchDestinationSuggestions();
  }
}

// Beim Jahr-Wechsel neue Platzhalter-Daten generieren
watch(currentDisplayYear, () => {
  generateRandomPlaceholderDates();
});

onMounted(() => {
  generateRandomPlaceholderDates();

  // URL-Parameter für Passphrase prüfen
  const urlParams = new URLSearchParams(window.location.search);
  const paramPassphrase = urlParams.get('passphrase');
  if (paramPassphrase) {
    joinPassphrase.value = paramPassphrase;
    openJoinModal();
  }
})
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
  overflow-x: hidden;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.title {
  font-size: clamp(4rem, 19vw, 19rem);
  font-weight: bold;
  margin-bottom: 5rem;
  color: #131313;
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

.passphrase-display {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding-bottom: 2rem;
  font-size: 1rem;
  color: #555;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background 0.3s ease;
}

.passphrase-display:hover {
  background: rgba(255, 255, 255, 0.9);
}

.passphrase-text {
  font-weight: bold;
}

.user-name-display {
  font-size: 0.85rem;
  margin-top: 0.25rem;
  color: #777;
}

.copy-hint {
  position: absolute;
  bottom: -25px;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
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
  box-shadow: 0 7px 10px rgba(0, 0, 0, 0.119);
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
  z-index: 1000;
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
  transition: margin-top 0.5s ease, transform 0.5s ease;
}

.calendar-container--top {
  margin-top: 3.5rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: #000;
  position: relative;
}

.year-display {
  color: #fff;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-year {
  font-size: 2rem;
  font-weight: bold;
}

.year-nav-button {
  color: #aaa;
  /* grau */
  font-size: calc(2rem - 1rem);
  /* 1rem kleiner als das aktuelle Jahr */
  cursor: pointer;
  transition: color 0.3s ease;
}

.year-nav-button:hover {
  color: #fff;
}

.user-list-header {
  color: #fff;
  flex: 1;
}

.user-list-header ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  color: #fff;
}

.user-list-header {
  color: #fff;
  flex: 1;
}

.user-list-header ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 60%;
}

.user-list-header li {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border: 0.2px solid #fff;
  border-radius: 1rem;
  font-size: 0.8rem;
  transition: background 0.3s ease;
}

.user-list-header li.active,
.user-list-header li:hover {
  background: #333;
}

.home-button-container {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.home-button {
  background: rgba(255, 255, 255, 0.066);
  color: white;
  border: 1px solid white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.home-button:hover {
  background: rgba(255, 255, 255, 0.4);
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

/* Jahr-Navigation Styles */
.year-nav-top,
.year-nav-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 2rem;
  padding: 0.5rem 2rem;
  margin: 0.5rem 0;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.year-nav-top:hover,
.year-nav-bottom:hover {
  background: rgba(0, 0, 0, 0.1);
}

.year-nav-arrow {
  font-size: 1.2rem;
}

.year-nav-text {
  font-size: 1rem;
  margin: 0 0.5rem;
}

.page-transitioning-up {
  transform: translateY(-100%);
  opacity: 0;
}

.page-transitioning-down {
  transform: translateY(100%);
  opacity: 0;
}
</style>
