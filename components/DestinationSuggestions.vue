<template>
    <div v-if="destinations.length > 0" class="destination-suggestions">
        <h3>Vorgeschlagene Ziele</h3>
        <div class="destination-cards">
            <div v-for="(destination, index) in destinations" :key="index" class="destination-card">
                <h4 class="destination-title">{{ destination.name }}</h4>
                <div class="destination-details">
                    <div class="tags-container">
                        <div class="tag">{{ destination.type }}</div>
                        <div class="tag">{{ destination.duration }}</div>
                        <div class="tag">{{ destination.budget }}</div>
                    </div>
                    <p v-if="destination.notes" class="destination-notes">{{ destination.notes }}</p>
                    <div class="suggestion-author">Vorgeschlagen von {{ destination.author }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    destinations: {
        type: Array,
        default: () => []
    }
});
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
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.destination-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

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
</style>
