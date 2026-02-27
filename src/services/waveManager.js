import { WAVE, ENEMIES } from '../config/constants.js'

/**
 * Manages wave progression: which enemies spawn, how many,
 * and exponential HP scaling.
 */
export class WaveManager {
    constructor(scene) {
        this.scene = scene
        this.currentWave = 0
        this.isActive = false
        this.spawnQueue = []
        this.spawnTimer = null
        this.enemiesAlive = 0

        // event bus lives on the scene so other systems can listen
        this.events = scene.events
    }

    /**
     * Exponential HP scaling: HP_BASE * 1.07^(wave-1)
     * @param {number} hpMultiplier — enemy-type-specific multiplier
     * @returns {number} final HP for this enemy in the current wave
     */
    getScaledHP(hpMultiplier) {
        const waveScale = WAVE.HP_BASE * Math.pow(WAVE.HP_GROWTH_RATE, this.currentWave - 1)
        return Math.round(waveScale * hpMultiplier)
    }

    buildSpawnQueue() {
        const queue = []
        const count = WAVE.BASE_ENEMIES_COUNT + (this.currentWave - 1) * WAVE.ENEMIES_GROWTH

        for (let i = 0; i < count; i++) {
            let type = ENEMIES.PAPER_HANDS

            // Gradually introduce harder enemies as waves progress
            if (this.currentWave >= 2 && Math.random() < 0.3) type = ENEMIES.FUD_SPREADER
            if (this.currentWave >= 3 && Math.random() < 0.2) type = ENEMIES.BOT_FARM
            if (this.currentWave >= 4 && Math.random() < 0.15) type = ENEMIES.SHITCOIN_RAIN
            if (this.currentWave >= 5 && Math.random() < 0.1) type = ENEMIES.FOMO_BUYER
            if (this.currentWave >= 6 && Math.random() < 0.1) type = ENEMIES.SHORT_SELLER
            if (this.currentWave >= 7 && Math.random() < 0.08) type = ENEMIES.INFLATION_CLOUD
            if (this.currentWave >= 8 && Math.random() < 0.05) type = ENEMIES.DEAD_CAT_BOUNCE
            if (this.currentWave >= 9 && Math.random() < 0.05) type = ENEMIES.LAUNDERING_MIXER

            // Occasional tanks and special units
            if (this.currentWave >= 5 && i % 10 === 0) type = ENEMIES.SEC_REGULATOR
            if (this.currentWave >= 7 && i % 12 === 0) type = ENEMIES.RUG_PULL
            if (this.currentWave >= 8 && i % 15 === 0) type = ENEMIES.HACK_ATTACK

            queue.push({
                ...type,
                hp: this.getScaledHP(type.hp),
                maxHp: this.getScaledHP(type.hp),
            })
        }

        // Boss every N waves
        if (this.currentWave > 0 && this.currentWave % WAVE.BOSS_EVERY_N_WAVES === 0) {
            const boss = ENEMIES.CENTRAL_BANK_WHALE
            queue.push({
                ...boss,
                hp: this.getScaledHP(boss.hp),
                maxHp: this.getScaledHP(boss.hp),
            })
        }

        return queue
    }

    /**
     * Start the next wave. Increments counter, builds queue, begins spawning.
     */
    startNextWave() {
        this.currentWave++
        this.isActive = true
        this.spawnQueue = this.buildSpawnQueue()
        this.enemiesAlive = 0

        this.events.emit('wave-start', {
            wave: this.currentWave,
            enemyCount: this.spawnQueue.length,
        })

        this.scheduleNextSpawn()
    }

    /** Internal: pops one enemy from queue and emits spawn event */
    scheduleNextSpawn() {
        if (this.spawnQueue.length === 0) return

        this.spawnTimer = this.scene.time.delayedCall(WAVE.SPAWN_INTERVAL_MS, () => {
            if (this.spawnQueue.length === 0) return

            const enemyData = this.spawnQueue.shift()
            this.enemiesAlive++
            this.events.emit('spawn-enemy', enemyData)
            this.scheduleNextSpawn()
        })
    }

    /**
     * Called when an enemy dies or reaches the base.
     * When all enemies are gone the wave is complete.
     */
    onEnemyRemoved() {
        this.enemiesAlive--

        if (this.enemiesAlive <= 0 && this.spawnQueue.length === 0) {
            this.isActive = false
            this.events.emit('wave-complete', { wave: this.currentWave })
        }
    }

    /** Clean up timers on scene shutdown */
    destroy() {
        if (this.spawnTimer) this.spawnTimer.remove(false)
    }
}
