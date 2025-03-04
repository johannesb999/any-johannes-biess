<template>
    <div class="user-list">
        <ul>
            <li v-for="user in users" :key="user" @click="$emit('userFilterChange', user)"
                :class="{ active: activeFilter === user }">
                {{ user }}
            </li>
            <li v-if="activeFilter" @click="$emit('clearFilter')" class="show-all">Alle anzeigen</li>
        </ul>
    </div>
</template>

<script setup>
defineProps({
    users: {
        type: Array,
        required: true
    },
    activeFilter: {
        type: String,
        default: ''
    }
});

defineEmits(['userFilterChange', 'clearFilter']);
</script>

<style scoped>
.user-list {
    color: #fff;
    max-width: 70%;
    width: 60%;
}

.user-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

}

.user-list li {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 1rem;
    font-size: 0.8rem;
    transition: all 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-list li:hover {
    background: rgba(255, 255, 255, 0.2);
}

.user-list li.active {
    background: #fff;
    color: #000;
    border-color: #fff;
    font-weight: bold;
}

.user-list li.show-all {
    font-style: italic;
    background: rgba(255, 255, 255, 0.2);

}
</style>
