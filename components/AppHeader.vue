<template>
    <div>
        <!-- Before Calendar Activation: Big Title & Header -->
        <div v-if="!isActive" class="title">DATEPLAN</div>
        <header v-if="!isActive" class="main-header">
            <div class="header-buttons">
                <button class="btn" @click="$emit('openCreateModal')">Create Calendar</button>
                <button class="btn" @click="$emit('openJoinModal')">Join Calendar</button>
            </div>
        </header>

        <!-- When Calendar Active: Small Logo & Passphrase -->
        <div v-if="isActive" class="logo">DATEPLAN</div>
        <div v-if="isActive" class="passphrase-display" @click="$emit('copyPassphrase')">
            <div class="passphrase-text">Passphrase: {{ passphrase }}</div>
            <div class="user-name-display">Angemeldet als: {{ username }}</div>
            <div class="copy-hint" v-if="showCopyHint">Kopiert!</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    isActive: {
        type: Boolean,
        default: false
    },
    isCalendarHeader: {
        type: Boolean,
        default: false
    },
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

defineEmits(['openCreateModal', 'openJoinModal', 'copyPassphrase']);
</script>

<style scoped>
.title {
    font-size: clamp(4rem, 19vw, 19rem);
    font-weight: bold;
    margin-bottom: 5rem;
    color: #131313;
    text-align: justify;
    white-space: nowrap;
    line-height: 65%;
}

.title::after {
    content: "";
    display: inline-block;
    width: 100%;
}

.logo {
    position: absolute;
    top: 1rem;
    left: 1rem;
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

.main-header {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
}

.header-buttons {
    display: flex;
    gap: 1rem;
}

.btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    background: #000;
    color: #fff;
    box-shadow: 0 7px 10px rgba(0, 0, 0, 0.119);
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s ease;
}

.btn:hover {
    background: #333;
}
</style>
