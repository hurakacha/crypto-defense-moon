import { SCORE, GAME } from '../config/constants.js'

/**
 * Tracks kills, wave, computes score, and persists High Score
 * in localStorage.
 *
 * Score formula: kills * 10 + wave * 100
 */
export class ScoreManager {
    constructor(sdk = null) {
        this.kills = 0
        this.currentWave = 0
        this.highScore = this.loadHighScore()
        this.sdk = sdk
    }

    /** Register a kill and return updated score */
    addKill() {
        this.kills++
        this.checkHighScore()
        if (this.sdk) {
            this.sdk.addPoints(SCORE.PER_KILL)
        }
        return this.getScore()
    }

    /** Update current wave tracker */
    setWave(wave) {
        this.currentWave = wave
        this.checkHighScore()
        if (this.sdk) {
            this.sdk.addPoints(SCORE.PER_WAVE)
        }
    }


    /** Compute live score from formula */
    getScore() {
        return (this.kills * SCORE.PER_KILL) + (this.currentWave * SCORE.PER_WAVE)
    }

    /** Save high score if current is better */
    checkHighScore() {
        const current = this.getScore()
        if (current > this.highScore) {
            this.highScore = current
            this.saveHighScore()
        }
    }

    /** Reset for new game (does NOT reset high score) */
    reset() {
        this.kills = 0
        this.currentWave = 0
    }

    // ─── LocalStorage ────────────────────────────────────────────────

    saveHighScore() {
        try {
            localStorage.setItem(GAME.HIGH_SCORE_KEY, String(this.highScore))
        } catch (err) {
            // localStorage may be unavailable in some contexts
            console.warn('Could not save high score:', err.message)
        }
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem(GAME.HIGH_SCORE_KEY)
            return saved ? parseInt(saved, 10) : 0
        } catch (err) {
            console.warn('Could not load high score:', err.message)
            return 0
        }
    }
}
