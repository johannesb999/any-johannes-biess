import { ref, computed } from 'vue';
import dayjs from 'dayjs';

export function useCalendarData() {
    const currentRealYear = dayjs().year();
    const currentDisplayYear = ref(currentRealYear);

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    const months = computed(() => {
        const result = [];
        for (let m = 0; m < 12; m++) {
            const firstDay = new Date(currentDisplayYear.value, m, 1);
            const lastDay = new Date(currentDisplayYear.value, m + 1, 0);
            const cells = [];
            // Anzahl leerer Felder vor dem 1. des Monats
            const emptyBefore = firstDay.getDay();
            for (let i = 0; i < emptyBefore; i++) {
                cells.push(null);
            }
            // Tage des Monats
            for (let d = 1; d <= lastDay.getDate(); d++) {
                cells.push(new Date(currentDisplayYear.value, m, d));
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

    function nextYear() {
        currentDisplayYear.value++;
    }

    function prevYear() {
        if (currentDisplayYear.value > currentRealYear) {
            currentDisplayYear.value--;
        }
    }

    return {
        currentRealYear,
        currentDisplayYear,
        monthNames,
        months,
        nextYear,
        prevYear
    };
}
