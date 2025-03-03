<template>
    <div v-if="isOpen" class="modal-overlay">
        <div class="modal-content">
            <h2>Join Calendar</h2>
            <form @submit.prevent="$emit('join', { passphrase, username })">
                <div>
                    <label for="joinPassphrase">Passphrase: </label>
                    <input class="input" type="text" id="joinPassphrase" v-model="passphrase" required />
                </div>
                <div>
                    <label for="joinUserName">Your Name: </label>
                    <input class="input" type="text" id="joinUserName" v-model="username" required />
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">cancel</button>
                    <button type="submit" class="btn">join</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    initialPassphrase: {
        type: String,
        default: ''
    }
});

const passphrase = ref('');
const username = ref('');

defineEmits(['close', 'join']);

watch(() => props.initialPassphrase, (newVal) => {
    if (newVal) passphrase.value = newVal;
});

// Initialize passphrase if passed in props
watch(() => props.isOpen, (isOpen) => {
    if (isOpen && props.initialPassphrase) {
        passphrase.value = props.initialPassphrase;
    }
});
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

.modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    width: 300px;
    text-align: center;
}

.input {
    height: 1.5rem;
    width: 100%;
    border-radius: 0.5rem;
    border: 0.5px solid #bcbcbc;
}

.modal-content form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
}

.modal-buttons {
    display: flex;
    justify-content: space-around;
}

.btn {
    padding: 1rem 2rem;
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
