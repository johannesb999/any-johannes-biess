#!/usr/bin/env node

/**
 * Diagnose-Skript zur Fehlerbehebung bei Build-Problemen
 * Führe es mit `node scripts/diagnose-build.js` aus
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Nuxt Build-Diagnose ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Prüfe Umgebungsvariablen
console.log('\n=== Umgebungsvariablen ===');
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    console.log(`${envVar}: ${value ? '✅ Vorhanden' : '❌ Fehlt'} ${value ? `(Länge: ${value.length})` : ''}`);
}

// Prüfe package.json
console.log('\n=== package.json ===');
try {
    const packageJson = require('../package.json');
    console.log('Nuxt Version:', packageJson.dependencies?.nuxt || 'nicht gefunden');
    console.log('Build-Skript:', packageJson.scripts?.build || 'nicht gefunden');
    console.log('Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    console.log('DevDependencies:', Object.keys(packageJson.devDependencies || {}).length);
} catch (error) {
    console.error('Fehler beim Lesen von package.json:', error.message);
}

// Prüfe nuxt.config.ts
console.log('\n=== nuxt.config.ts ===');
try {
    if (fs.existsSync(path.join(__dirname, '..', 'nuxt.config.ts'))) {
        const nuxtConfig = fs.readFileSync(path.join(__dirname, '..', 'nuxt.config.ts'), 'utf8');
        console.log('Datei existiert:', true);
        console.log('Dateilänge:', nuxtConfig.length);
        console.log('Hat runtimeConfig:', nuxtConfig.includes('runtimeConfig') ? '✅ Ja' : '❌ Nein');
        console.log('Hat SUPABASE_URL:', nuxtConfig.includes('SUPABASE_URL') ? '✅ Ja' : '❌ Nein');
    } else {
        console.error('nuxt.config.ts nicht gefunden!');
    }
} catch (error) {
    console.error('Fehler beim Lesen von nuxt.config.ts:', error.message);
}

// Teste Build-Umgebung
console.log('\n=== Build-Umgebung testen ===');
try {
    console.log('$ npm --version');
    console.log(execSync('npm --version', { encoding: 'utf8' }).trim());

    console.log('\n$ node -e "console.log(\'Node kann JavaScript ausführen\')"');
    console.log(execSync('node -e "console.log(\'Node kann JavaScript ausführen\')"', { encoding: 'utf8' }).trim());
} catch (error) {
    console.error('Fehler bei Build-Umgebungstests:', error.message);
}

// Plattenplatz prüfen
console.log('\n=== Plattenplatz ===');
try {
    if (process.platform === 'linux' || process.platform === 'darwin') {
        console.log(execSync('df -h /', { encoding: 'utf8' }));
    } else if (process.platform === 'win32') {
        console.log(execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' }));
    }
} catch (error) {
    console.error('Fehler beim Prüfen des Plattenplatzes:', error.message);
}

console.log('\n=== Empfehlungen ===');
console.log('1. Stelle sicher, dass alle Umgebungsvariablen korrekt gesetzt sind');
console.log('2. Prüfe, ob genügend Speicherplatz vorhanden ist');
console.log('3. Teste den Build lokal mit npm run build');
console.log('4. Bei GitHub Actions: Prüfe die Secrets und Environment Variables');
