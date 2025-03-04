<template>
    <div v-if="isOpen" class="modal-overlay">
        <div class="modal-content poll-modal">
            <h2>Create Poll</h2>
            <div class="selected-destinations">
                <h3>Selected Destinations</h3>
                <div class="destination-items">
                    <div v-for="(destination, index) in selectedDestinations" :key="index" class="destination-item">
                        <div class="destination-name">{{ destination.name }}</div>
                        <div class="destination-tags">
                            <span class="mini-tag">{{ destination.type }}</span>
                            <span class="mini-tag">{{ destination.duration }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <form @submit.prevent="handleSubmit">
                <div>
                    <label for="pollEndDate">End Date for Poll:</label>
                    <input class="input" type="date" id="pollEndDate" v-model="endDate" required :min="minDate" />
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
                    <button type="submit" class="btn">Create Poll</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    selectedDestinations: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['close', 'create-poll']);

const endDate = ref('');

// Mindestdatum ist heute
const minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
});

function handleSubmit() {
    emit('create-poll', {
        destinations: props.selectedDestinations,
        endDate: endDate.value
    });

    // Reset form
    endDate.value = '';
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

.modal-content.poll-modal {
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    width: 500px;
    max-width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    text-align: left;
}

h2,
h3 {
    text-align: center;
    margin-bottom: 1.5rem;
}

.selected-destinations {
    margin-bottom: 2rem;
}

.destination-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.destination-item {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 0.8rem;
}

.destination-name {
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.destination-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.mini-tag {
    background: #e0e0e0;
    color: #444;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    font-size: 0.7rem;
}

.input {
    width: 100%;
    height: 2.5rem;
    border-radius: 0.5rem;
    border: 0.5px solid #bcbcbc;
    padding: 0.5rem;
    margin-top: 0.25rem;
    margin-bottom: 1.5rem;
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
