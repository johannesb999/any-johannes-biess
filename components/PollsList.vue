<template>
    <div v-if="polls.length > 0" class="polls-container">
        <h3>Aktive Umfragen</h3>
        <div class="polls-list">
            <div v-for="poll in polls" :key="poll.id" class="poll-card">
                <!-- Dezenter Löschbutton - nur für den Ersteller -->
                <div v-if="currentUser === poll.createdBy" class="delete-poll-button"
                    @click.stop="$emit('delete-poll', poll)" title="Umfrage löschen">
                    <span class="delete-icon">×</span>
                </div>

                <!-- Header mit normaler Textformatierung -->
                <div class="poll-header">
                    <h4>Erstellt von {{ poll.createdBy }}</h4>
                    <div class="poll-end-date">
                        Endet am {{ formatDateSimple(poll.endDate) }}
                    </div>
                </div>

                <!-- Destinationen -->
                <div class="poll-items">
                    <div v-for="(destination, index) in poll.destinations" :key="index" class="poll-item"
                        :class="{ selected: isDestinationSelected(poll, destination) }"
                        @click="toggleDestinationVote(poll, destination)">
                        <div class="vote-checkbox">
                            <div class="checkbox" :class="{ 'checked': isDestinationSelected(poll, destination) }">
                            </div>
                        </div>
                        <div class="poll-item-content">
                            <div class="poll-item-header">
                                <h5>{{ destination.name }}</h5>
                                <div class="vote-count" :title="getVoterNames(poll, destination)">
                                    {{ getVoteCount(poll, destination) }} Stimmen
                                </div>
                            </div>
                            <div class="poll-item-details">
                                <span class="detail-tag">{{ destination.type }}</span>
                                <span class="detail-tag">{{ destination.duration }} Tage</span>
                                <span class="detail-tag">{{ destination.budget }}</span>
                            </div>
                            <p v-if="destination.notes" class="poll-item-notes">{{ destination.notes }}</p>
                        </div>
                    </div>
                </div>

                <div class="poll-footer">
                    <button class="btn" @click="submitVote(poll)" :disabled="!hasVoteChanges(poll)">
                        Abstimmen
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
    polls: {
        type: Array,
        default: () => []
    },
    currentUser: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['vote', 'delete-poll']);

// Store für temporäre Auswahlen vor dem Speichern
const tempSelections = ref({});

// Sehr einfache Datumsformatierung ohne komplexe Logik
function formatDateSimple(date) {
    if (!date) return "Kein Datum";

    try {
        return new Date(date).toLocaleDateString('de-DE');
    } catch (e) {
        return date || "Kein Datum";
    }
}

function isDestinationSelected(poll, destination) {
    if (!poll || !destination) return false;

    // Wenn temporäre Auswahl existiert
    if (tempSelections.value[poll.id]) {
        return tempSelections.value[poll.id].some(d => d.id === destination.id);
    }

    // Wenn keine temporäre Auswahl, prüfe ob der User bereits abgestimmt hat
    const userVote = findUserVote(poll);
    if (userVote && userVote.selected_destinations) {
        return userVote.selected_destinations.some(d => d.id === destination.id);
    }

    return false;
}

function findUserVote(poll) {
    if (!poll || !poll.votes) return null;
    return poll.votes.find(vote => vote.username === props.currentUser);
}

function toggleDestinationVote(poll, destination) {
    if (!poll || !destination) return;

    // Initialisiere die temporäre Auswahl für diesen Poll
    if (!tempSelections.value[poll.id]) {
        tempSelections.value[poll.id] = [];

        // Wenn der User bereits abgestimmt hat, starte mit seiner aktuellen Auswahl
        const userVote = findUserVote(poll);
        if (userVote && userVote.selected_destinations) {
            tempSelections.value[poll.id] = [...userVote.selected_destinations];
        }
    }

    const selections = tempSelections.value[poll.id];
    const index = selections.findIndex(d => d.id === destination.id);

    if (index >= 0) {
        // Entfernen
        selections.splice(index, 1);
    } else {
        // Hinzufügen
        selections.push(destination);
    }
}

function getVoteCount(poll, destination) {
    if (!poll || !destination || !poll.votes) return 0;

    let count = 0;
    poll.votes.forEach(vote => {
        if (vote.selected_destinations &&
            Array.isArray(vote.selected_destinations) &&
            vote.selected_destinations.some(d => d.id === destination.id)) {
            count++;
        }
    });
    return count;
}

function getVoterNames(poll, destination) {
    if (!poll || !destination || !poll.votes) return "Keine Stimmen";

    const voters = poll.votes.filter(vote => {
        return vote.selected_destinations &&
            Array.isArray(vote.selected_destinations) &&
            vote.selected_destinations.some(d => d.id === destination.id);
    }).map(vote => vote.username);

    return voters.length > 0 ? voters.join(", ") : "Keine Stimmen";
}

// Prüfen, ob sich die Auswahl geändert hat
function hasVoteChanges(poll) {
    if (!poll) return false;
    return !!tempSelections.value[poll.id];
}

function submitVote(poll) {
    if (!poll || !tempSelections.value[poll.id]) return;

    emit('vote', {
        pollId: poll.id,
        selectedDestinations: tempSelections.value[poll.id]
    });

    // Zurücksetzen nach dem Absenden
    delete tempSelections.value[poll.id];
}

// Aktualisiere Auswahlen, wenn sich Polls ändern
watch(() => props.polls, () => {
    tempSelections.value = {};
}, { deep: true });
</script>

<style scoped>
.polls-container {
    width: 100%;
    max-width: 1200px;
    margin-top: 2rem;
    margin-bottom: 3rem;
}

h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
}

.polls-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.poll-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
}

.poll-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
    margin-bottom: 1rem;
}

.poll-header h4 {
    margin: 0;
    font-size: 1.2rem;
}

.poll-end-date {
    color: #666;
    font-size: 0.9rem;
}

.poll-items {

    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.poll-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.poll-item:hover {
    background-color: #f9f9f9;
}

.poll-item.selected {
    background-color: #f0f0f0;
}

.vote-checkbox {
    margin-top: 0.3rem;
}

.checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.checkbox.checked {
    background-color: #000;
    border-color: #000;
}

.checkbox.checked::after {
    content: '✓';
    color: white;
    font-size: 14px;
}

.poll-item-content {
    flex: 1;
}

.poll-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

h5 {
    margin: 0;
    font-size: 1.1rem;
}

.vote-count {
    font-size: 0.85rem;
    color: #666;
    background-color: #eee;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    cursor: help;
}

.poll-item-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.detail-tag {
    background: #f0f0f0;
    color: #555;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.8rem;
}

.poll-item-notes {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: #666;
}

.poll-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

.btn {
    padding: 0.7rem 1.5rem;
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

/* Dezenter Löschbutton, ähnlich wie bei Destinations */
.delete-poll-button {
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

.delete-poll-button:hover {
    background-color: #c03a4e;
    transform: scale(1.1);
}

.delete-icon {
    font-size: 18px;
    line-height: 1;
    font-weight: bold;
}
</style>