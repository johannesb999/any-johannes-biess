<template>
    <div>
        <!-- Button für vorheriges Jahr -->
        <div v-if="showPrevButton" class="year-nav-container year-nav-top-container">
            <div class="year-nav-top" @click="$emit('prevYear')">
                <span class="year-nav-text">{{ currentYear - 1 }}</span>
            </div>
        </div>

        <!-- Button für nächstes Jahr -->
        <div class="year-nav-container year-nav-bottom-container">
            <div class="year-nav-bottom" @click="$emit('nextYear')">
                <span class="year-nav-text">{{ currentYear + 1 }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    currentYear: {
        type: Number,
        required: true
    },
    currentRealYear: {
        type: Number,
        required: true
    },
    showPrevButton: {
        type: Boolean,
        default: true
    }
});

defineEmits(['prevYear', 'nextYear']);
</script>

<style scoped>
.year-nav-container {
    display: flex;
    justify-content: center;
    width: 100%;
}

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

.year-nav-text {
    font-size: 1rem;
    margin: 0 0.5rem;
}
</style>
