import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

export function useBookings(userPassphrase, currentUser, currentDisplayYear, filterUser) {
    const bookings = ref([]);
    const placeholderDates = ref([]);
    const selectedDates = ref([]);
    const deselectedDates = ref([]);

    // Computed properties für Buchungen - als Array statt Set zurückgeben
    const myBookedDates = computed(() => {
        const dates = new Set();
        bookings.value.forEach(entry => {
            if (entry.username === currentUser.value && entry.unavailabledates) {
                entry.unavailabledates.forEach(d => dates.add(d));
            }
        });
        return Array.from(dates); // In ein Array umwandeln statt ein Set zurückzugeben
    });

    // Gefilterte Bookings für die Anzeige
    const filteredBookings = computed(() => {
        if (!filterUser.value) return bookings.value;
        return bookings.value.filter(booking => booking.username === filterUser.value);
    });

    // Buchungs-Anzahl pro Tag berechnen (berücksichtigt den Filter)
    const otherBookingCount = computed(() => {
        const counts = {};

        // Wenn ein Filter aktiv ist, nur die Buchungen des gefilterten Nutzers zählen
        const bookingsToCount = filterUser.value ? filteredBookings.value : bookings.value;

        bookingsToCount.forEach(entry => {
            if (entry.unavailabledates) {
                entry.unavailabledates.forEach(d => {
                    counts[d] = (counts[d] || 0) + 1;
                });
            }
        });

        return counts;
    });

    const maxBookingsPerDay = computed(() => {
        let max = 1;
        for (const day in otherBookingCount.value) {
            if (otherBookingCount.value[day] > max) {
                max = otherBookingCount.value[day];
            }
        }
        return max;
    });

    const hasChanges = computed(() => {
        return selectedDates.value.length > 0 || deselectedDates.value.length > 0;
    });

    function generateRandomPlaceholderDates() {
        const dates = [];
        const dateIntensities = {}; // Stufen: 1 (leicht grau) bis 5 (dunkelgrau)

        // 1. Zufällige einzelne Tage (etwa 80 Tage)
        const individualDays = 80;
        for (let i = 0; i < individualDays; i++) {
            const month = Math.floor(Math.random() * 12);
            const maxDay = new Date(currentDisplayYear.value, month + 1, 0).getDate();
            const day = Math.floor(Math.random() * maxDay) + 1;
            const dateStr = dayjs(new Date(currentDisplayYear.value, month, day)).format('YYYY-MM-DD');

            // Vermeiden von Duplikaten
            if (!dates.includes(dateStr)) {
                dates.push(dateStr);
                dateIntensities[dateStr] = Math.floor(Math.random() * 5) + 1; // Zufällige Intensität zwischen 1-5
            }
        }

        // 2. Mehrere zusammenhängende Zeitspannen (2-3 Wochen)
        const numRanges = 4;
        for (let i = 0; i < numRanges; i++) {
            // Wähle einen zufälligen Startmonat und -tag
            const startMonth = Math.floor(Math.random() * 12);
            const startMaxDay = new Date(currentDisplayYear.value, startMonth + 1, 0).getDate();
            const startDay = Math.floor(Math.random() * startMaxDay) + 1;

            // Bestimme die Länge der Zeitspanne (10-21 Tage)
            const rangeLength = Math.floor(Math.random() * 12) + 10;

            // Generiere die Zeitspanne
            const intensity = Math.floor(Math.random() * 3) + 3; // Höhere Intensität für Blöcke (3-5)
            let currentDate = dayjs(new Date(currentDisplayYear.value, startMonth, startDay));

            for (let j = 0; j < rangeLength; j++) {
                const dateStr = currentDate.format('YYYY-MM-DD');
                if (!dates.includes(dateStr)) {
                    dates.push(dateStr);
                    dateIntensities[dateStr] = intensity;
                }
                currentDate = currentDate.add(1, 'day');
            }
        }

        // 3. Zwei volle Monate markieren
        const fullMonths = [
            Math.floor(Math.random() * 6), // Ein Monat in der ersten Jahreshälfte
            Math.floor(Math.random() * 6) + 6 // Ein Monat in der zweiten Jahreshälfte
        ];

        fullMonths.forEach(month => {
            const daysInMonth = new Date(currentDisplayYear.value, month + 1, 0).getDate();
            const intensity = Math.floor(Math.random() * 2) + 4; // Fast maximale Intensität (4-5)

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = dayjs(new Date(currentDisplayYear.value, month, day)).format('YYYY-MM-DD');
                if (!dates.includes(dateStr)) {
                    dates.push(dateStr);
                    dateIntensities[dateStr] = intensity;
                }
            }
        });

        placeholderDates.value = dates;
        placeholderIntensities.value = dateIntensities;
    }

    // Speichere die Intensitäten für verschiedene Graustufen
    const placeholderIntensities = ref({});

    // Methoden
    function fetchBookings() {
        if (!userPassphrase.value) {
            bookings.value = [];
            return;
        }

        return $fetch(`/api/entries/${userPassphrase.value}`)
            .then(res => { bookings.value = res.entries || []; })
            .catch(err => {
                console.error("Error fetching bookings:", err);
                bookings.value = [];
            });
    }

    function toggleDaySelection(day) {
        if (!day || !userPassphrase.value) return;
        const dateStr = dayjs(day).format('YYYY-MM-DD');

        // a) Falls bereits neu ausgewählt -> entfernen
        if (selectedDates.value.includes(dateStr)) {
            selectedDates.value = selectedDates.value.filter(d => d !== dateStr);
            return;
        }

        // b) Falls bereits in DB (eigene Buchung), dann togglen wir Freigabe
        // Jetzt mit .includes() statt .has(), da myBookedDates ein Array ist
        if (myBookedDates.value.includes(dateStr)) {
            if (!deselectedDates.value.includes(dateStr)) {
                deselectedDates.value.push(dateStr);
            } else {
                deselectedDates.value = deselectedDates.value.filter(d => d !== dateStr);
            }
            return;
        }

        // c) Sonst: Neue Auswahl
        if (selectedDates.value.length === 0) {
            // 1. Klick -> push
            selectedDates.value.push(dateStr);
        } else if (selectedDates.value.length === 1) {
            // 2. Klick -> Zeitspanne
            let start = dayjs(selectedDates.value[0]);
            let end = dayjs(dateStr);
            if (end.isBefore(start)) [start, end] = [end, start];

            const range = [];
            let cur = start;
            while (cur.isSameOrBefore(end)) {
                range.push(cur.format('YYYY-MM-DD'));
                cur = cur.add(1, 'day');
            }
            selectedDates.value = range;
        } else {
            // Schon mehr als 1 Tag drin -> reset auf diesen einen Tag
            selectedDates.value = [dateStr];
        }
    }

    function getDayStyle(day) {
        if (!day) return {};
        const dateStr = dayjs(day).format('YYYY-MM-DD');

        // Wenn kein aktiver Calendar, zeigen wir nur Platzhalter-Tage mit verschiedenen Graustufen
        if (!userPassphrase.value) {
            if (placeholderDates.value.includes(dateStr)) {
                const intensity = placeholderIntensities.value[dateStr] || 1;
                // Opacity basierend auf der Intensität berechnen (0.2 bis 0.9)
                const opacity = 0.1 + (intensity * 0.16); // Werte skalieren von ~0.2 bis ~0.9
                return {
                    background: `rgba(80, 80, 80, ${opacity})`,
                    border: "0.5px solid #cfcfcf",
                    color: opacity > 0.6 ? '#fff' : '#000' // Textfarbe abhängig vom Hintergrund
                };
            }
            // Standard für leere Tage - EXPLIZITE SCHWARZE TEXTFARBE
            return {
                background: '#fff',
                border: "0.5px solid #cfcfcf",
                color: "#000" // Explizit schwarze Schrift für leere Tage
            };
        }

        // Neue Auswahl (noch nicht in DB)
        if (selectedDates.value.includes(dateStr)) {
            return { background: '#000', color: '#fff', border: "0.5px solid #000" };
        }

        // Eigene DB-Buchungen (grau + dicker schwarzer Rahmen), sofern nicht zur Freigabe markiert
        // Jetzt mit .includes() statt .has(), da myBookedDates ein Array ist
        if (myBookedDates.value.includes(dateStr) && !deselectedDates.value.includes(dateStr)) {
            return { background: '#ccc', border: "2px solid #000", color: "#000" };
        }

        // Freigabe-markierte Tage - EXPLIZIT SCHWARZE TEXTFARBE
        if (deselectedDates.value.includes(dateStr)) {
            return {
                background: '#fff',
                border: "0.5px solid #cfcfcf",
                color: "#000" // Explizit schwarze Schrift für freigegebene Tage
            };
        }

        // Buchungen anderer Nutzer - mit gradueller Färbung basierend auf der Anzahl der Buchungen
        const count = otherBookingCount.value[dateStr] || 0;
        if (count > 0) {
            // Dynamische Opazität basierend auf der Anzahl der Buchungen im Verhältnis zum Maximum
            const opacityRange = 0.9 - 0.2;
            const normalizedCount = Math.min(count / maxBookingsPerDay.value, 1);
            const opacity = 0.2 + (normalizedCount * opacityRange);

            // Wenn Filter aktiv, dunklere Farbe für gefilterte Tage
            const baseColor = filterUser.value ? 'rgb(40, 40, 40)' : 'rgb(80, 80, 80)';

            return {
                background: `rgba(${baseColor.match(/\d+/g).join(', ')}, ${opacity})`,
                border: "0.5px solid #cfcfcf",
                color: opacity > 0.6 ? '#fff' : '#000' // Weiß bei dunklem Hintergrund, sonst schwarz
            };
        }

        // Standard für normale Tage - EXPLIZIT SCHWARZE TEXTFARBE
        return {
            background: '#fff',
            border: "0.5px solid #cfcfcf",
            color: "#000" // Explizit schwarze Schrift für alle normalen Tage
        };
    }

    async function submitBooking() {
        try {
            // a) Neue Buchungen hinzufügen
            if (selectedDates.value.length) {
                await $fetch('/api/entries', {
                    method: 'POST',
                    body: {
                        groupPassphrase: userPassphrase.value,
                        userName: currentUser.value,
                        unavailableDates: selectedDates.value
                    }
                });
            }
            // b) Eigene Buchungen entfernen
            if (deselectedDates.value.length) {
                await $fetch('/api/entries/remove', {
                    method: 'POST',
                    body: {
                        groupPassphrase: userPassphrase.value,
                        userName: currentUser.value,
                        unavailableDates: deselectedDates.value
                    }
                });
            }
            // Reset
            selectedDates.value = [];
            deselectedDates.value = [];
            await fetchBookings();
        } catch (error) {
            console.error("Fehler beim Absenden der Buchung:", error);
        }
    }

    // Initialisierung
    generateRandomPlaceholderDates();

    // Rückgabe der relevanten Werte und Funktionen
    return {
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
    };
}
