<template>
    <div class="app-header">
        <div class="logo">ANY</div>

        <!-- User List wurde entfernt -->

        <div class="passphrase-display" @click="$emit('copyPassphrase')">
            <div class="passphrase-text">{{ passphrase }}</div>
            <div class="user-name-display">{{ username }}</div>
            <div v-if="showCopyHint" class="copy-hint">Passphrase copied!</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    passphrase: {
        type: String,
        default: ''
    },
    username: {
        type: String,
        default: ''
    },
    showCopyHint: {
        type: Boolean,
        default: false
    }
});

defineEmits(['copyPassphrase']);
</script>

<style scoped>
.app-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    margin-bottom: 2rem;
    padding: 1rem;
}

.logo {
    font-size: 2rem;
    font-weight: bold;
    color: #000;
}

.passphrase-display {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding-bottom: 2rem;
    font-size: 1rem;
    color: #555;
    background: rgba(255, 255, 255, 0.7);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background 0.3s ease;
}

.passphrase-display:hover {
    background: rgba(255, 255, 255, 0.9);
}

.passphrase-text {
    font-weight: bold;
}

.user-name-display {
    font-size: 0.85rem;
    margin-top: 0.25rem;
    color: #777;
}

.copy-hint {
    position: absolute;
    bottom: -25px;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 0.8rem;
}
</style>
