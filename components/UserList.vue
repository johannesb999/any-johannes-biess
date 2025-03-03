<template>
    <div class="user-list-header">
        <ul>
            <li v-for="user in users" :key="user" @click="$emit('userFilterChange', user)"
                :class="{ active: activeFilter === user }">
                {{ user }}
            </li>
            <li v-if="activeFilter" @click="$emit('clearFilter')">show all</li>
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
.user-list-header {
    color: #fff;
    flex: 1;
}

.user-list-header ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    width: 60%;
}

.user-list-header li {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border: 0.2px solid #fff;
    border-radius: 1rem;
    font-size: 0.8rem;
    transition: background 0.3s ease;
}

.user-list-header li.active,
.user-list-header li:hover {
    background: #333;
}
</style>
