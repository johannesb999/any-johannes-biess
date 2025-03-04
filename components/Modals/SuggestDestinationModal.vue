<template>
    <div v-if="isOpen" class="modal-overlay">
        <div class="modal-content">
            <h2>Suggest Destination</h2>
            <form @submit.prevent="handleSubmit">
                <div>
                    <label for="destinationName">Country:</label>
                    <input class="input" type="text" id="destinationName" v-model="destination.name" required />
                </div>
                <div>
                    <label for="travelType">Travelstyle:</label>
                    <input class="input" type="text" id="travelType" v-model="destination.type" required />
                </div>
                <div>
                    <label for="duration">Duration (in Days):</label>
                    <input class="input" type="number" id="duration" v-model.number="destination.duration" min="1"
                        max="90" required @input="checkAvailability" />
                    <div v-if="destination.duration > 0" class="availability-status">
                        <span :class="{ 'available': isAvailable, 'unavailable': !isAvailable }">
                            {{ isAvailable ? 'Zeitraum verfügbar' : 'Kein Platz im Kalender' }}
                        </span>
                    </div>
                </div>
                <!-- Neues Dropdown für bevorzugte Reisezeit -->
                <div>
                    <label for="preferredMonth">Bevorzugte Reisezeit:</label>
                    <select class="input" id="preferredMonth" v-model="destination.preferredMonth">
                        <option value="">Keine Präferenz</option>
                        <option v-for="(month, index) in monthNames" :key="index" :value="index">
                            {{ month }}
                        </option>
                    </select>
                </div>
                <div>
                    <label for="budget">Estimated Budget:</label>
                    <input class="input" type="text" id="budget" v-model="destination.budget" required />
                </div>
                <div>
                    <label for="notes">Description:</label>
                    <textarea class="textarea" id="notes" v-model="destination.notes" rows="3"></textarea>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">cancel</button>
                    <button type="submit" class="btn">Suggest</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    availableDates: {
        type: Array,
        default: () => []
    },
    bookings: {
        type: Array,
        default: () => []
    },
    uniqueUsers: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['close', 'suggest']);

// Monatsnamen für das Dropdown-Menü
const monthNames = [
    'Januar', 'Februar', 'März', 'April',
    'Mai', 'Juni', 'Juli', 'August',
    'September', 'Oktober', 'November', 'Dezember'
];

const destination = reactive({
    name: '',
    type: '',
    duration: 7, // Standardmäßig 7 Tage
    budget: '',
    notes: '',
    preferredMonth: '' // Neu: Bevorzugter Reisemonat
});

const isAvailable = ref(true); // Standard auf true setzen

// Verbesserte Verfügbarkeitsprüfung
function checkAvailability() {
    // Wenn keine Buchungen oder Benutzer vorhanden sind, immer als verfügbar betrachten
    if (!props.bookings || props.bookings.length === 0 || !props.uniqueUsers || props.uniqueUsers.length === 0) {
        console.log("[Modal] Keine Buchungen oder User vorhanden - als verfügbar markiert");
        isAvailable.value = true;
        return;
    }

    const requiredDays = destination.duration;
    console.log(`[Modal] Prüfe Verfügbarkeit für ${requiredDays} Tage`);

    // Verwende findAvailablePeriods, um zu prüfen, ob ein konfliktfreier Zeitraum existiert
    const availablePeriods = findAvailablePeriods(props.uniqueUsers, requiredDays);

    if (availablePeriods.length > 0) {
        console.log(`[Modal] Bester Zeitraum: ${availablePeriods[0].conflictCount}/${availablePeriods[0].totalUsers} blockiert (${Math.round(availablePeriods[0].conflictRatio * 100)}%)`);
        // Wenn es Perioden ohne Konflikte gibt (conflictRatio === 0), dann ist der Zeitraum verfügbar
        isAvailable.value = availablePeriods.some(period => period.conflictRatio === 0);
    } else {
        console.log("[Modal] Keine verfügbaren Zeiträume gefunden");
        isAvailable.value = false;
    }

    console.log(`[Modal] Verfügbarkeit für ${requiredDays} Tage: ${isAvailable.value}`);
}

// Findet zusammenhängende freie Zeiträume für alle oder bestimmte Nutzer
function findAvailablePeriods(users, requiredDays, lookAheadDays = 365) {
    // Wenn keine Buchungen oder keine Benutzer vorhanden sind, gibt es keine Konflikte
    if (!props.bookings || props.bookings.length === 0 || !users || users.length === 0) {
        return [{ startDate: new Date().toISOString().split('T')[0], conflictRatio: 0, conflictCount: 0, totalUsers: 0 }];
    }

    // Erstelle ein Set für jeden Tag und markiere die blockierten Tage
    const blockedDaysMap = {};
    const usersToConsider = users;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + lookAheadDays);

    // Erstelle für jeden Nutzer ein Set von blockierten Tagen
    const userBlockedDays = {};
    props.bookings.forEach(booking => {
        if (usersToConsider.includes(booking.username) && booking.unavailabledates) {
            if (!userBlockedDays[booking.username]) {
                userBlockedDays[booking.username] = new Set();
            }
            booking.unavailabledates.forEach(date => {
                userBlockedDays[booking.username].add(date);
            });
        }
    });

    console.log("[Modal] BlockedDays pro User:", Object.keys(userBlockedDays).map(user =>
        `${user}: ${userBlockedDays[user] ? userBlockedDays[user].size : 0} Tage`));

    // Erstelle ein Map aller Tage und wie viele Nutzer an diesen Tagen blockiert sind
    let currentDate = new Date(today);
    while (currentDate < endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let blockedUsers = 0;

        // Zähle, wie viele Nutzer an diesem Tag blockiert sind
        usersToConsider.forEach(user => {
            if (userBlockedDays[user] && userBlockedDays[user].has(dateStr)) {
                blockedUsers++;
            }
        });

        blockedDaysMap[dateStr] = blockedUsers;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Finde zusammenhängende Zeiträume mit minimalen Konflikten
    const availablePeriods = [];
    currentDate = new Date(today);

    while (currentDate < new Date(endDate.getTime() - requiredDays * 24 * 60 * 60 * 1000)) {
        let maxConflictCount = 0;
        let isValidPeriod = true;

        // Prüfe den aktuellen Zeitraum
        for (let i = 0; i < requiredDays; i++) {
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() + i);
            const checkDateStr = checkDate.toISOString().split('T')[0];

            // Wenn alle Nutzer blockiert sind, ist dieser Zeitraum ungültig
            if (blockedDaysMap[checkDateStr] >= usersToConsider.length) {
                isValidPeriod = false;
                break;
            }

            maxConflictCount = Math.max(maxConflictCount, blockedDaysMap[checkDateStr]);
        }

        // Wenn der Zeitraum gültig ist, füge ihn hinzu
        if (isValidPeriod) {
            const endDatePeriod = new Date(currentDate);
            endDatePeriod.setDate(endDatePeriod.getDate() + requiredDays - 1);

            const conflictRatio = usersToConsider.length > 0 ?
                maxConflictCount / usersToConsider.length : 0;

            availablePeriods.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: endDatePeriod.toISOString().split('T')[0],
                conflictRatio: conflictRatio,
                conflictCount: maxConflictCount,
                totalUsers: usersToConsider.length
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sortiere nach Konflikten (niedrigste zuerst)
    return availablePeriods.sort((a, b) => a.conflictRatio - b.conflictRatio);
}

function handleSubmit() {
    // Stelle sicher, dass duration eine Zahl ist
    const durationAsNumber = parseInt(destination.duration, 10);

    emit('suggest', {
        ...destination,
        duration: isNaN(durationAsNumber) ? 7 : durationAsNumber, // Fallback auf 7, wenn keine gültige Zahl
        isAvailable: isAvailable.value // Füge die Verfügbarkeitsinfo hinzu
    });

    // Reset form
    destination.name = '';
    destination.type = '';
    destination.duration = 7;
    destination.budget = '';
    destination.notes = '';
    destination.preferredMonth = ''; // Reset preferredMonth
    checkAvailability(); // Aktualisiere die Verfügbarkeit für die Standard-Dauer
}

// Prüfe Verfügbarkeit jedes Mal, wenn das Modal geöffnet wird oder die Daten aktualisiert werden
watch(() => props.isOpen, (newValue) => {
    if (newValue) {
        console.log("[Modal] Modal geöffnet, prüfe Verfügbarkeit...");
        checkAvailability();
    }
});

watch(() => props.bookings, () => {
    console.log("[Modal] Buchungen geändert, prüfe Verfügbarkeit...");
    checkAvailability();
}, { deep: true });

watch(() => props.uniqueUsers, () => {
    console.log("[Modal] Benutzer geändert, prüfe Verfügbarkeit...");
    checkAvailability();
}, { deep: true });

watch(() => destination.duration, () => {
    console.log("[Modal] Dauer geändert, prüfe Verfügbarkeit...");
    checkAvailability();
});

// Prüfe Verfügbarkeit beim Öffnen des Modals
onMounted(() => {
    console.log("[Modal] Komponente geladen, prüfe Verfügbarkeit...");
    checkAvailability();
});
</script>

<style scoped>
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

.input,
.textarea {
    width: 100%;
    border-radius: 0.5rem;
    border: 0.5px solid #bcbcbc;
    padding: 0.5rem;
    margin-top: 0.25rem;
}

.input {
    height: 1.5rem;
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
    margin-top: 1rem;
}

.btn {
    padding: 0.75rem 1.5rem;
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

input[type="number"] {
    -moz-appearance: textfield;
    /* Entfernt Pfeile in Firefox */
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Neue Styles für die Verfügbarkeitsstatus-Anzeige */
.availability-status {
    margin-top: 0.5rem;
    font-size: 0.8rem;
}

.available {
    color: green;
}

.unavailable {
    color: rgb(86, 86, 86);
}
</style>
