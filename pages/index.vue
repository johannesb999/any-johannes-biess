<template>
  <html lang="eng">
  <div class="page-container">
    <!-- Title nur auf Startseite anzeigen -->
    <div v-if="!userPassphrase" class="landing-page">
      <div class="title">DATEPLAN</div>
      <div class="header-buttons">
        <button class="btn" @click="openCreateModal">Create Calendar</button>
        <button class="btn" @click="openJoinModal">Join Calendar</button>
      </div>
    </div>

    <!-- Header nur anzeigen, wenn Calendar aktiv -->
    <app-header v-if="!!userPassphrase" :passphrase="userPassphrase" :username="currentUser"
      :show-copy-hint="showCopyHint" @copy-passphrase="copyPassphraseToClipboard">
      <!-- UserList aus dem Header entfernt -->
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

    <!-- Create Poll Modal -->
    <create-poll-modal :is-open="isCreatePollModalOpen" :selected-destinations="selectedDestinations"
      @close="closeCreatePollModal" @create-poll="createPoll" />

    <!-- Calendarcontainer -->
    <div :class="['calendar-container', userPassphrase && 'calendar-container--top']">
      <!-- Calendar Header mit Year Navigation und User-Filter -->
      <div v-if="userPassphrase" class="calendar-header">
        <!-- UserList links im Kalender-Header -->
        <div class="user-filter-container">
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
              <div v-for="(day, dIndex) in week" :key="dIndex" class="day" :class="{
                empty: !day,
                'highlighted-day': isHighlightedDay(day)
              }" :style="getDayStyle(day)" @click="userPassphrase ? toggleDaySelection(day) : null">
                <span v-if="day">{{ day.getDate() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enter Button im Kalendercontainer -->
      <div v-if="userPassphrase" class="enter-button-container">
        <button class="btn" :disabled="!hasChanges" :class="{ 'btn-disabled': !hasChanges }" @click="submitBooking">
          Enter
        </button>
      </div>
    </div>

    <!-- Button zum Vorschlagen neuer Ziele -->
    <div v-if="userPassphrase" class="action-buttons">
      <button class="btn" @click="openSuggestDestinationModal">Suggest Destination</button>
    </div>

    <!-- Destination Vorschläge -->
    <destination-suggestions v-if="userPassphrase && destinationSuggestions.length > 0"
      :destinations="destinationSuggestions" :selectable="true" :bookings="bookings" :uniqueUsers="uniqueUsers"
      :currentUser="currentUser" @selection-change="handleDestinationSelection" @delete="deleteDestination"
      @highlight-dates="handleHighlightDates" />

    <!-- Poll Create Button -->
    <div v-if="selectedDestinations.length > 0" class="create-poll-button-container">
      <button class="btn btn-primary" @click="openCreatePollModal">Create Poll</button>
    </div>

    <!-- Polls List -->
    <polls-list v-if="userPassphrase" :polls="polls" :current-user="currentUser" @vote="submitPollVote"
      @delete-poll="deletePoll" />
  </div>

  </html>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useCalendarData } from '../composables/useCalendarData';
import { useBookings } from '../composables/useBookings';
import AppHeader from '../components/AppHeader.vue';
import UserList from '../components/UserList.vue';
import SuggestDestinationModal from '../components/Modals/SuggestDestinationModal.vue';
import DestinationSuggestions from '../components/DestinationSuggestions.vue';
import CreatePollModal from '../components/Modals/CreatePollModal.vue';
import PollsList from '../components/PollsList.vue';

dayjs.extend(isSameOrBefore);

// --------------------------
// 0) Farbkonfiguration für Buchungen
// --------------------------
const bookingColorConfig = {
  minOpacity: 0.2,  // Hellgrau für 1 Person (20% Opazität)
  maxOpacity: 0.9,  // Fast schwarz für maximale Überschneidung (90% Opazität)
  baseColor: 'rgb(80, 80, 80)' // Grau-Basis
};

// --------------------------
// 1) Calendardaten (jährliches Raster)
// --------------------------
const {
  currentRealYear,
  currentDisplayYear,
  monthNames,
  months,
  nextYear,
  prevYear
} = useCalendarData();

// --------------------------
// 2) States für Modals, aktiver Calendar, Buchungen
// --------------------------
const isCreateModalOpen = ref(false);
const isJoinModalOpen = ref(false);
const isSuggestDestinationModalOpen = ref(false);
const isCreatePollModalOpen = ref(false);
const newAdminName = ref('');
const joinPassphrase = ref('');
const joinUserName = ref('');
const createdPassphrase = ref('');
const invitationLink = ref('');
const userPassphrase = ref(''); // Aktive Calendar-Passphrase
const currentUser = ref('');    // Aktueller Nutzername
const showCopyHint = ref(false); // Anzeige dass Passphrase kopiert wurde
const filterUser = ref(''); // Filter für Benutzer

// Buchungen
const {
  bookings,
  filteredBookings,
  placeholderDates,
  selectedDates,
  deselectedDates,
  myBookedDates,
  otherBookingCount,
  maxBookingsPerDay,
  hasChanges,
  fetchBookings,
  toggleDaySelection,
  getDayStyle,
  submitBooking,
  generateRandomPlaceholderDates
} = useBookings(userPassphrase, currentUser, currentDisplayYear, filterUser);

// Destination Suggestions
const destinationSuggestions = ref([]);
const selectedDestinations = ref([]);
const polls = ref([]);

// Neuer State für hervorgehobene Daten
const highlightedDates = ref([]);
let highlightTimeout = null;

// --------------------------
// 3) Modals öffnen/schließen & Calendar aktivieren
// --------------------------
function openCreateModal() {
  isCreateModalOpen.value = true;
  newAdminName.value = '';
  createdPassphrase.value = '';
  invitationLink.value = '';
}

function closeCreateModal() {
  isCreateModalOpen.value = false;
}

function openJoinModal() {
  isJoinModalOpen.value = true;
  joinPassphrase.value = '';
  joinUserName.value = '';
}

function closeJoinModal() {
  isJoinModalOpen.value = false;
}

function openSuggestDestinationModal() {
  isSuggestDestinationModalOpen.value = true;
}

function closeSuggestDestinationModal() {
  isSuggestDestinationModalOpen.value = false;
}

async function createCalendar() {
  const generatedPassphrase = Math.random().toString(36).substring(2, 10);
  try {
    const res = await $fetch('/api/groups', {
      method: 'POST',
      body: {
        groupName: 'Neuer Calendar',
        adminName: newAdminName.value,
        passphrase: generatedPassphrase
      }
    });

    if (res.message) {
      createdPassphrase.value = generatedPassphrase;
      invitationLink.value = window.location.origin + '/?passphrase=' + generatedPassphrase;
      await navigator.clipboard.writeText(invitationLink.value);
      userPassphrase.value = generatedPassphrase;
      currentUser.value = newAdminName.value;
      isCreateModalOpen.value = false;
      isJoinModalOpen.value = false;
      fetchBookings();
    }
  } catch (error) {
    console.error("Fehler beim Erstellen des Calendars:", error);
  }
}

async function joinCalendar() {
  if (joinPassphrase.value && joinUserName.value) {
    userPassphrase.value = joinPassphrase.value;
    currentUser.value = joinUserName.value;
    isJoinModalOpen.value = false;
    await fetchBookings();
    await fetchDestinationSuggestions(); // Lade vorhandene Zielvorschläge
  }
}

// --------------------------
// 4) Teilnehmerliste & Filter
// --------------------------
const uniqueUsers = computed(() => {
  const users = new Set();
  bookings.value.forEach(entry => {
    if (entry.username) users.add(entry.username);
  });
  return Array.from(users);
});

function toggleFilterUser(user) {
  filterUser.value = filterUser.value === user ? '' : user;
}

function clearFilter() {
  filterUser.value = '';
}

// --------------------------
// 5) Passphrase kopieren & zur Startseite zurückkehren
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
// 6) Destination Suggestions und Polls
// --------------------------
async function addDestinationSuggestion(newDestination) {
  try {
    const response = await $fetch('/api/destinations', {
      method: 'POST',
      body: {
        grouppassphrase: userPassphrase.value,
        author: currentUser.value,
        name: newDestination.name,
        type: newDestination.type,
        duration: newDestination.duration,
        budget: newDestination.budget,
        notes: newDestination.notes
      }
    });

    if (response.message) {
      await fetchDestinationSuggestions();
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

function handleDestinationSelection(selected) {
  selectedDestinations.value = selected;
}

function openCreatePollModal() {
  isCreatePollModalOpen.value = true;
}

function closeCreatePollModal() {
  isCreatePollModalOpen.value = false;
}

async function createPoll(pollData) {
  try {
    const response = await $fetch('/api/polls', {
      method: 'POST',
      body: {
        grouppassphrase: userPassphrase.value,
        createdby: currentUser.value,
        enddate: pollData.endDate,
        destinations: pollData.destinations
      }
    });

    if (response.message) {
      await fetchPolls();
      selectedDestinations.value = [];
    }
  } catch (error) {
    console.error("Fehler beim Erstellen der Umfrage:", error);
  }

  closeCreatePollModal();
}

async function fetchPolls() {
  if (!userPassphrase.value) return;

  try {
    const response = await $fetch(`/api/polls/${userPassphrase.value}`);
    if (response.polls) {
      polls.value = response.polls;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Umfragen:", error);
  }
}

async function submitPollVote(voteData) {
  try {
    await $fetch('/api/polls/vote', {
      method: 'POST',
      body: {
        poll_id: voteData.pollId,
        username: currentUser.value,
        selected_destinations: voteData.selectedDestinations
      }
    });
    await fetchPolls();
  } catch (error) {
    console.error("Fehler beim Abstimmen:", error);
  }
}

// Neue Methode zum Löschen eines Destinations-Vorschlags
async function deleteDestination(destination) {
  if (confirm(`Wirklich den Vorschlag "${destination.name}" löschen?`)) {
    try {
      const response = await $fetch('/api/destinations/delete', {
        method: 'POST',
        body: {
          id: destination.id,
          author: currentUser.value
        }
      });

      if (response.success) {
        await fetchDestinationSuggestions(); // Liste neu laden
      } else {
        console.error("Fehler beim Löschen:", response.message || "Unbekannter Fehler");
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Zielvorschlags:", error);
    }
  }
}

// Neue Funktion zum Prüfen, ob ein Tag hervorgehoben werden soll
function isHighlightedDay(day) {
  if (!day) return false;

  const dateStr = day.toISOString().split('T')[0];
  return highlightedDates.value.includes(dateStr);
}

// Handler für das highlight-dates Event
function handleHighlightDates(data) {
  console.log("Kalenderdaten zum Hervorheben empfangen:", data);

  // Bestehenden Timer löschen, falls vorhanden
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }

  // Setze die hervorgehobenen Daten
  highlightedDates.value = data.dates || [];

  // Wenn Daten gefunden wurden, zeige sie für 15 Sekunden
  if (data.dates && data.dates.length > 0) {
    console.log(`${data.dates.length} Tage werden im Kalender markiert`);

    // Setze einen Timer, um die Hervorhebung nach 15 Sekunden zu entfernen
    highlightTimeout = setTimeout(() => {
      highlightedDates.value = [];
      console.log("Kalenderhervorhebung zurückgesetzt");
    }, 15000);
  }
}

// Neue Funktion zum Löschen von Polls - vereinfacht und mit mehr Logging
async function deletePoll(poll) {
  console.log("Löschversuch für Poll:", poll);
  console.log("Aktueller Benutzer:", currentUser.value);
  console.log("Poll-Ersteller:", poll.createdby);

  // Bestätigungsdialog mit klaren Informationen
  const confirmMessage = `Wirklich die Umfrage mit ID ${poll.id} löschen?\n` +
    `Erstellt von: ${poll.createdby}\n` +
    `Du bist angemeldet als: ${currentUser.value}`;

  if (confirm(confirmMessage)) {
    try {
      console.log("Sende Löschanfrage...");

      const response = await $fetch('/api/polls/delete', {
        method: 'POST',
        body: {
          poll_id: poll.id,
          author: currentUser.value // Zur Überprüfung, ob der aktuelle Benutzer der Autor ist
        }
      });

      console.log("Antwort vom Server:", response);

      if (response.success) {
        alert("Umfrage erfolgreich gelöscht!");
        await fetchPolls(); // Liste neu laden
      } else {
        alert(`Fehler beim Löschen: ${response.message || "Unbekannter Fehler"}`);
        console.error("Server-Fehlermeldung:", response.message);
      }
    } catch (error) {
      alert("Fehler bei der Löschung: " + error.message);
      console.error("Fehler beim Löschen der Umfrage:", error);
    }
  }
}

// Hilfsfunktion, um einen leserlichen Titel für die Bestätigungsabfrage zu erstellen
function getPollTitle(poll) {
  if (!poll || !poll.destinations || poll.destinations.length === 0) {
    return "Unbenannte Umfrage";
  }

  if (poll.destinations.length === 1) {
    return poll.destinations[0].name;
  }

  return `${poll.destinations[0].name} und ${poll.destinations.length - 1} weitere`;
}

// --------------------------
// 7) Lifecycle hooks und watches
// --------------------------
watch(currentDisplayYear, () => {
  generateRandomPlaceholderDates();
});

watch(userPassphrase, (newVal) => {
  if (newVal) {
    fetchPolls();
    fetchDestinationSuggestions();
  }
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
});
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

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  position: relative;
  width: 100%;
  max-width: 1200px;
  background: #fff;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 4rem auto;
  padding-bottom: 4rem;
  transition: margin-top 0.5s ease, transform 0.5s ease;
}

.calendar-container--top {
  margin-top: 3.5rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #000;
  position: relative;
}

.user-filter-container {
  color: #fff;
  flex: 1;
  text-align: left;
  padding-right: 2rem;
  z-index: 1;
  max-width: 60%;
  width: 50% !important;
}

.year-display {
  color: #fff;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 2;
}

.current-year {
  font-size: 2rem;
  font-weight: bold;
}

.year-nav-button {
  color: #aaa;
  font-size: calc(2rem - 1rem);
  cursor: pointer;
  transition: color 0.3s ease;
}

.year-nav-button:hover {
  color: #fff;
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

.enter-button-container {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.create-poll-button-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.landing-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 5rem;
  overflow-x: hidden;
}

.title {
  font-size: clamp(16rem, 17vw, 16rem);
  font-weight: bold;
  margin-bottom: 5rem;
  margin-left: 2rem;
  margin-right: 2rem;
  padding: 0 2rem;
  color: #131313;
  white-space: nowrap;
  line-height: 70%;
  letter-spacing: -0.02em;
}

.title::after {
  content: "";
  display: inline-block;
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

/* Stil für hervorgehobene Tage */
.day.highlighted-day {
  background-color: rgba(0, 128, 0, 0.2) !important;
  /* Leichtes Grün */
  border: 1px solid green !important;
  position: relative;
  z-index: 1;
}

.day.highlighted-day:hover {
  background-color: rgba(0, 128, 0, 0.4) !important;
  /* Etwas dunkleres Grün beim Hover */
}
</style>
