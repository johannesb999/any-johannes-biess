<template>
    <div>
        <h1>Gruppe erstellen</h1>
        <form @submit.prevent="createGroup">
            <div>
                <label for="groupName">Gruppenname (optional):</label>
                <input type="text" id="groupName" v-model="groupName" />
            </div>
            <div>
                <label for="adminName">Admin Name:</label>
                <input type="text" id="adminName" v-model="adminName" required />
            </div>
            <div>
                <label for="passphrase">Passphrase:</label>
                <input type="text" id="passphrase" v-model="passphrase" required />
            </div>
            <button type="submit">Gruppe erstellen</button>
        </form>
        <div v-if="message">{{ message }}</div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const groupName = ref('');
const adminName = ref('');
const passphrase = ref('');
const message = ref('');

async function createGroup() {
    try {
        const res = await $fetch('/api/groups', {
            method: 'POST',
            body: {
                groupName: groupName.value,
                adminName: adminName.value,
                passphrase: passphrase.value
            }
        });
        message.value = res.message;
    } catch (error) {
        message.value = error.data?.error || 'Fehler beim Erstellen der Gruppe';
        console.error("Fehler:", error);
    }
}
</script>