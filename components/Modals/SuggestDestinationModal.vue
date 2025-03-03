<template>
    <div v-if="isOpen" class="modal-overlay">
        <div class="modal-content">
            <h2>Suggest Destination</h2>
            <form @submit.prevent="handleSubmit">
                <div>
                    <label for="destinationName">Ziel/Land:</label>
                    <input class="input" type="text" id="destinationName" v-model="destination.name" required />
                </div>
                <div>
                    <label for="travelType">Art der Reise:</label>
                    <input class="input" type="text" id="travelType" v-model="destination.type" required />
                </div>
                <div>
                    <label for="duration">Dauer:</label>
                    <input class="input" type="text" id="duration" v-model="destination.duration" required />
                </div>
                <div>
                    <label for="budget">Budget:</label>
                    <input class="input" type="text" id="budget" v-model="destination.budget" required />
                </div>
                <div>
                    <label for="notes">Sonstiges:</label>
                    <textarea class="textarea" id="notes" v-model="destination.notes" rows="3"></textarea>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">Abbrechen</button>
                    <button type="submit" class="btn">Vorschlagen</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'suggest']);

const destination = reactive({
    name: '',
    type: '',
    duration: '',
    budget: '',
    notes: ''
});

function handleSubmit() {
    emit('suggest', { ...destination });

    // Reset form
    destination.name = '';
    destination.type = '';
    destination.duration = '';
    destination.budget = '';
    destination.notes = '';
}
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
</style>
