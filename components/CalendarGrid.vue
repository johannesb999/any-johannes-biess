<template>
    <div class="months-grid">
        <div v-for="(month, mIndex) in months" :key="mIndex" class="month">
            <div class="month-title">{{ monthNames[mIndex] }}</div>
            <div class="weeks">
                <div v-for="(week, wIndex) in month.weeks" :key="wIndex" class="week">
                    <div v-for="(day, dIndex) in week" :key="dIndex" class="day" :class="{ empty: !day }"
                        :style="getDayStyle(day)" @click="isActive ? $emit('daySelected', day) : null">
                        <span v-if="day">{{ day.getDate() }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
    currentDisplayYear: {
        type: Number,
        required: true
    },
    monthNames: {
        type: Array,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    selectedDates: {
        type: Array,
        default: () => []
    },
    deselectedDates: {
        type: Array,
        default: () => []
    },
    myBookedDates: {
        type: Set,
        default: () => new Set()
    },
    otherBookingCount: {
        type: Object,
        default: () => ({})
    },
    placeholderDates: {
        type: Array,
        default: () => []
    },
    maxBookingsPerDay: {
        type: Number,
        default: 1
    },
    bookingColorConfig: {
        type: Object,
        default: () => ({
            minOpacity: 0.2,
            maxOpacity: 0.9,
            baseColor: 'rgb(80, 80, 80)'
        })
    }
});

const emit = defineEmits(['daySelected']);

const months = computed(() => {
    const result = [];
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(props.currentDisplayYear, m, 1);
        const lastDay = new Date(props.currentDisplayYear, m + 1, 0);
        const cells = [];
        // Anzahl leerer Felder vor dem 1. des Monats
        const emptyBefore = firstDay.getDay();
        for (let i = 0; i < emptyBefore; i++) {
            cells.push(null);
        }
        // Tage des Monats
        for (let d = 1; d <= lastDay.getDate(); d++) {
            cells.push(new Date(props.currentDisplayYear, m, d));
        }
        // Auffüllen auf ein Vielfaches von 7
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
        }
        result.push({ weeks });
    }
    return result;
});

// Styling für die Tage
function getDayStyle(day) {
    if (!day) return {};
    const dateStr = dayjs(day).format('YYYY-MM-DD');

    // Wenn kein aktiver Calendar, zeigen wir nur Platzhalter-Tage
    if (!props.isActive) {
        if (props.placeholderDates.includes(dateStr)) {
            return { background: '#ccc', border: "0.5px solid #cfcfcf" };
        }
        return { background: '#fff', border: "0.5px solid #cfcfcf" };
    }

    // Neue Auswahl (noch nicht in DB)
    if (props.selectedDates.includes(dateStr)) {
        return { background: '#000', color: '#fff', border: "0.5px solid #000" };
    }

    // Eigene DB-Buchungen (grau + dicker schwarzer Rahmen), sofern nicht zur Freigabe markiert
    if (props.myBookedDates.has(dateStr) && !props.deselectedDates.includes(dateStr)) {
        return { background: '#ccc', border: "2px solid #000", color: "#000" };
    }

    // Buchungen anderer Nutzer - mit gradueller Färbung
    const count = props.otherBookingCount[dateStr] || 0;
    if (count > 0) {
        // Dynamische Opazität
        const opacityRange = props.bookingColorConfig.maxOpacity - props.bookingColorConfig.minOpacity;
        const normalizedCount = Math.min(count / props.maxBookingsPerDay, 1);
        const opacity = props.bookingColorConfig.minOpacity + (normalizedCount * opacityRange);

        return {
            background: props.bookingColorConfig.baseColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba'),
            border: "0.5px solid #cfcfcf",
            color: opacity > 0.6 ? '#fff' : '#000'
        };
    }

    // Standard
    return { background: '#fff', border: "0.5px solid #cfcfcf" };
}
</script>

<style scoped>
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
</style>
