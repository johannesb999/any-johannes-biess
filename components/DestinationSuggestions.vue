<template>
    <div v-if="destinations.length > 0" class="destination-suggestions">
        <h3>Proposed Countrys</h3>
        <div class="destination-cards">
            <div v-for="destination in destinations" :key="destination.id" class="destination-card" :class="{
                'selected': selectable && isSelected(destination),
                'conflict-mild': getConflictLevel(destination) === 1,
                'conflict-medium': getConflictLevel(destination) === 2,
                'conflict-high': getConflictLevel(destination) === 3,
                'conflict-extreme': getConflictLevel(destination) === 4
            }" @click="selectable && toggleSelection(destination)">
                <!-- Löschbutton - nur für den Autor sichtbar -->
                <div v-if="currentUser === destination.author" class="delete-button"
                    @click.stop="$emit('delete', destination)">
                    <span class="delete-icon">×</span>
                </div>

                <!-- Reload-Button -->
                <div class="reload-button" @click.stop="checkDestinationAndHighlight(destination)"
                    title="Verfügbarkeit prüfen und im Kalender markieren">
                    <svg class="reload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>

                <div v-if="selectable" class="selection-indicator">
                </div>
                <h4 class="destination-title">{{ destination.name }}</h4>
                <div class="destination-details">
                    <div class="tags-container">
                        <div class="tag">{{ destination.type }}</div>
                        <div class="tag">{{ destination.duration }} Tage</div>
                        <div class="tag">{{ destination.budget }}</div>
                    </div>
                    <p v-if="destination.notes" class="destination-notes">{{ destination.notes }}</p>
                    <div class="suggestion-author">Proposed by {{ destination.author }}</div>
                </div>
                <div v-if="getConflictLevel(destination) > 0" class="conflict-indicator">
                    {{ getConflictMessage(destination) }}
                </div>
                <div v-else-if="getConflictLevel(destination) === 0" class="conflict-indicator available">
                    <span>Verfügbarer Zeitraum: {{ destination.duration }} zusammenhängende Tage gefunden</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    destinations: {
        type: Array,
        default: () => []
    },
    selectable: {
        type: Boolean,
        default: false
    },
    bookings: {
        type: Array,
        default: () => []
    },
    uniqueUsers: {
        type: Array,
        default: () => []
    },
    currentUser: {
        type: String,
        default: ''
    }
});

// Neues Event 'highlight-dates' zum Markieren von Zeiträumen im Kalender
const emit = defineEmits(['selection-change', 'delete', 'highlight-dates']);

const selectedItems = ref([]);
// Cache für die berechneten Konfliktlevel pro Ziel
const conflictLevelCache = ref({});

function isSelected(destination) {
    return selectedItems.value.some(item => item.id === destination.id);
}

function toggleSelection(destination) {
    if (isSelected(destination)) {
        selectedItems.value = selectedItems.value.filter(item => item.id !== destination.id);
    } else {
        selectedItems.value.push(destination);
    }
    emit('selection-change', selectedItems.value);
}

// Funktion zum Prüfen der Verfügbarkeit und Hervorheben im Kalender
function checkDestinationAndHighlight(destination) {
    console.log(`Prüfung für ${destination.name} ausgelöst`);

    // Entferne vorherige Caches für dieses Ziel
    if (destination && destination.id) {
        delete conflictLevelCache.value[destination.id];
    }

    // Berechne Verfügbarkeit und finde beste Periode - für das aktuelle Kalenderjahr
    const requiredDays = extractDuration(destination);

    // Bevorzugter Monat wird aus destination gelesen, wenn vorhanden
    const preferredMonth = destination.preferredMonth !== undefined ?
        parseInt(destination.preferredMonth, 10) : undefined;

    // Wir suchen im gesamten Kalenderjahr
    const currentYear = new Date().getFullYear();
    const yearEnd = new Date(currentYear, 11, 31);
    const lookAheadDays = Math.ceil((yearEnd - new Date()) / (1000 * 60 * 60 * 24)) + 1;

    const availablePeriods = findAvailablePeriods(props.uniqueUsers, requiredDays, lookAheadDays, preferredMonth);

    // Aktualisiere den Cache mit dem neuen Konfliktlevel
    const level = calculateConflictLevel(availablePeriods);
    if (destination && destination.id) {
        conflictLevelCache.value[destination.id] = level;
    }

    // Wenn es verfügbare Perioden gibt, sende das beste Ergebnis zur Hervorhebung
    if (availablePeriods.length > 0) {
        const bestPeriod = availablePeriods[0]; // Die beste Periode (mit geringsten Konflikten)

        // Generiere ein Array von Tagen zwischen Start- und Enddatum
        const highlightDates = getDatesInRange(bestPeriod.startDate, bestPeriod.endDate);

        console.log(`Markiere ${highlightDates.length} Tage im Kalender:`, highlightDates);
        console.log(`Zeitraum: ${bestPeriod.startDate} bis ${bestPeriod.endDate}`);

        // Sende die Daten an die übergeordnete Komponente zur Kalendermarkierung
        emit('highlight-dates', {
            destinationId: destination.id,
            destinationName: destination.name,
            dates: highlightDates,
            startDate: bestPeriod.startDate,
            endDate: bestPeriod.endDate,
            conflictRatio: bestPeriod.conflictRatio,
            color: 'green'
        });
    } else {
        console.log("Keine verfügbaren Zeiträume für Markierung gefunden");
        // Sende leeres Array, um vorherige Hervorhebungen zu entfernen
        emit('highlight-dates', {
            destinationId: destination.id,
            destinationName: destination.name,
            dates: []
        });
    }
}

// Hilfsfunktion zur Generierung aller Daten in einem Bereich
function getDatesInRange(startDateStr, endDateStr) {
    const dates = [];
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Sicherstellen, dass Enddate nach Startdate liegt
    if (endDate < startDate) return dates;

    let currentDate = new Date(startDate);

    // Durchlaufe alle Tage zwischen Start und Ende
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// Berechnet das Konfliktlevel aus den gefundenen Perioden
function calculateConflictLevel(availablePeriods) {
    // Wenn keine Zeiträume gefunden wurden: höchste Konfliktstufe
    if (availablePeriods.length === 0) {
        return 4;
    }

    // Wenn es eine konfliktfreie Periode gibt
    if (availablePeriods.some(period => period.conflictRatio === 0)) {
        return 0;
    }

    // Ansonsten basierend auf dem besten Konfliktverhältnis
    const bestConflictRatio = availablePeriods[0].conflictRatio;

    if (bestConflictRatio <= 0.25) return 1;
    if (bestConflictRatio <= 0.5) return 2;
    if (bestConflictRatio <= 0.75) return 3;
    return 4;
}

// Vereinfachte Funktion zur Dauer-Extraktion
function extractDuration(destination) {
    if (!destination) return 7;

    if (typeof destination.duration === 'number') {
        return destination.duration;
    }

    if (typeof destination.duration === 'string') {
        const parsedDuration = parseInt(destination.duration, 10);
        return isNaN(parsedDuration) ? 7 : parsedDuration;
    }

    return 7;
}

// Funktion zum Finden freier Zeiträume mit optionaler Monatspräferenz
function findAvailablePeriods(users, requiredDays, lookAheadDays = 365, preferredMonth = undefined) {
    // Wenn keine Buchungen oder keine Benutzer vorhanden sind, gibt es keine Konflikte
    if (!props.bookings || props.bookings.length === 0 || !users || users.length === 0) {
        return [{
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().getTime() + (requiredDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            conflictRatio: 0,
            conflictCount: 0,
            totalUsers: users.length || 0
        }];
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

        // Prüfe den aktuellen zusammenhängenden Zeitraum
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

            // Füge den Monat des Starttages hinzu, um später Präferenzen zu berücksichtigen
            const periodMonth = currentDate.getMonth();

            availablePeriods.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: endDatePeriod.toISOString().split('T')[0],
                conflictRatio: conflictRatio,
                conflictCount: maxConflictCount,
                totalUsers: usersToConsider.length,
                month: periodMonth
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sortiere zuerst nach Konflikten (niedrigste zuerst)
    availablePeriods.sort((a, b) => a.conflictRatio - b.conflictRatio);

    // Wenn es mehrere konfliktfreie Perioden gibt und eine Monatspräferenz besteht, berücksichtige diese
    // Achte darauf, dass alle konfliktfreien Perioden ihre Reihenfolge behalten
    if (preferredMonth !== undefined && availablePeriods.length > 1) {
        // Finde die niedrigste Konfliktrate
        const lowestConflictRatio = availablePeriods[0].conflictRatio;

        // Sammle alle Perioden mit dieser niedrigsten Konfliktrate
        const bestPeriods = availablePeriods.filter(p => p.conflictRatio === lowestConflictRatio);

        // Wenn mehrere Perioden die gleiche (niedrigste) Konfliktrate haben
        if (bestPeriods.length > 1) {
            // Suche nach Perioden im bevorzugten Monat
            const periodsInPreferredMonth = bestPeriods.filter(p => p.month === preferredMonth);

            // Wenn Perioden im bevorzugten Monat gefunden wurden, priorisiere diese
            if (periodsInPreferredMonth.length > 0) {
                // Entferne alle bestPeriods aus availablePeriods
                availablePeriods = availablePeriods.filter(p => p.conflictRatio !== lowestConflictRatio);
                // Füge die bevorzugten Perioden am Anfang hinzu
                availablePeriods.unshift(...periodsInPreferredMonth);
                // Füge die restlichen bestPeriods hinzu
                bestPeriods.filter(p => p.month !== preferredMonth)
                    .forEach(p => availablePeriods.splice(periodsInPreferredMonth.length, 0, p));
            }
        }
    }

    return availablePeriods;
}

// Konfliktabruf aus dem Cache (ohne automatische Berechnung)
function getConflictLevel(destination) {
    // Wenn keine ID vorhanden, können wir nicht cachen
    if (!destination || !destination.id) return 0;

    // Wenn nicht im Cache, gib Standardwert (nicht verfügbar) zurück
    return conflictLevelCache.value[destination.id] !== undefined
        ? conflictLevelCache.value[destination.id]
        : 0; // Standardmäßig 0, bis benutzer explizit prüft
}

// Generiere eine präzisere Konfliktmeldung
function getConflictMessage(destination) {
    const level = getConflictLevel(destination);

    if (level === 0) return "";

    // Keine automatische Neuberechnung der verfügbaren Perioden
    // Stattdessen statische Nachrichten basierend auf der letzten Berechnung

    const requiredDays = extractDuration(destination);

    if (level === 1) return `Leichter Konflikt: Einzelne Personen haben keine Zeit für ${requiredDays} zusammenhängende Tage`;
    if (level === 2) return `Mittlerer Konflikt: Etwa die Hälfte hat keine Zeit für ${requiredDays} zusammenhängende Tage`;
    if (level === 3) return `Hoher Konflikt: Die meisten haben keine Zeit für ${requiredDays} zusammenhängende Tage`;
    return `Kein zusammenhängender Zeitraum von ${requiredDays} Tagen verfügbar`;
}
</script>

<style scoped>
.destination-suggestions {
    width: 100%;
    max-width: 1200px;
    margin-top: 2rem;
}

h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
}

.destination-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.destination-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    cursor: pointer;
}

.destination-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

.destination-card.selected {
    border: 2px solid #000;
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
}

/* Verbesserte Konfliktstufen-Stile mit stärkerer Abstufung */
.destination-card.conflict-mild {
    background-color: rgba(235, 235, 235, 0.9);
}

.destination-card.conflict-medium {
    background-color: rgba(215, 215, 215, 0.9);
}

.destination-card.conflict-high {
    background-color: rgba(190, 190, 190, 0.9);
}

.destination-card.conflict-extreme {
    background-color: rgba(165, 165, 165, 0.9);
}

.conflict-indicator {
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    font-size: 0.85rem;
    color: #555;
    text-align: center;
}

.conflict-indicator.available {
    color: green;
    background-color: rgba(220, 255, 220, 0.7);
}

.selection-indicator {
    position: absolute;
    top: 1rem;
    right: 2.5rem;
}

/* Styles für den Reload-Button */
.reload-button {
    position: absolute;
    top: 0.5rem;
    right: 3rem;
    width: 24px;
    height: 24px;
    background-color: #575757;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.reload-button:hover {
    background-color: #333;
}

.reload-icon {
    width: 15px;
    height: 15px;
    stroke: white;
}

/* Rest der bestehenden Styles */
.destination-title {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #222;
}

.destination-details {
    display: flex;
    flex-direction: column;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.tag {
    background: #f0f0f0;
    color: #555;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.destination-notes {
    margin: 0.5rem 0 1rem;
    color: #555;
    font-size: 0.9rem;
    line-height: 1.5;
}

.suggestion-author {
    margin-top: auto;
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
    align-self: flex-end;
}

/* Styles für den Löschbutton */
.delete-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    background-color: #575757;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delete-button:hover {
    background-color: #c03a4e;
}

.delete-icon {
    font-size: 18px;
    line-height: 1;
    font-weight: bold;
}
</style>