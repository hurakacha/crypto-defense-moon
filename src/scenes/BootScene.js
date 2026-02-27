import { ENEMIES, GRID } from '../config/constants.js'

/**
 * BootScene — generates placeholder textures so we can run
 * the game without any external assets.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' })
    }

    preload() {
        // Load AAA 2D assets
        this.load.image('map_bg', 'assets/images/map_bg.png')
        this.load.image('hodl_tower', 'assets/images/towers/tower_hodl.png')
        this.load.image('staking_laser', 'assets/images/towers/tower_laser.png')
        this.load.image('dex_cannon', 'assets/images/towers/tower_cannon.png')
        this.load.image('airdrop_drone', 'assets/images/towers/tower_drone.png')
        this.load.image('token_burner', 'assets/images/towers/tower_burner.png')
        this.load.image('nft_gallery', 'assets/images/towers/tower_gallery.png')
        this.load.image('stablecoin_shield', 'assets/images/towers/tower_shield.png')
        this.load.image('whale_harpoon', 'assets/images/towers/tower_harpoon.png')
        this.load.image('flash_loan_bolt', 'assets/images/towers/tower_lightning.png')
        this.load.image('mining_rig', 'assets/images/towers/tower_mine.png')

        // Enemy Sprites
        this.load.image('paper_hands', 'assets/images/enemies/paper_hands.png')
        this.load.image('fud_spreader', 'assets/images/enemies/fud_spreader.png')
        this.load.image('rug_pull', 'assets/images/enemies/rug_pull.png')
        this.load.image('bot_farm', 'assets/images/enemies/bot_farm.png')
        this.load.image('short_seller', 'assets/images/enemies/short_seller.png')
        this.load.image('central_bank_whale', 'assets/images/enemies/whale_boss.png')
        this.load.image('inflation_cloud', 'assets/images/enemies/inflation_cloud.png')
        this.load.image('sec_regulator', 'assets/images/enemies/sec_regulator.png')
        this.load.image('shitcoin_rain', 'assets/images/enemies/shitcoin_rain.png')
        this.load.image('hack_attack', 'assets/images/enemies/hack_attack.png')
        this.load.image('fomo_buyer', 'assets/images/enemies/fomo_buyer.png')
        this.load.image('dead_cat_bounce', 'assets/images/enemies/dead_cat_bounce.png')
        this.load.image('laundering_mixer', 'assets/images/enemies/laundering_mixer.png')
        this.load.image('base', 'assets/images/base.png')
    }

    create() {
        this.createEnemyTextures()
        this.createProjectileTextures()
        this.createParticleTextures()
        this.createBaseTexture()
        this.createSyntheticSounds()
        this.scene.start('GameScene')
    }

    /** pseudo-3D colored spheres for each enemy type */
    createEnemyTextures() {
        const enemyList = Object.values(ENEMIES)

        for (const enemy of enemyList) {
            // If we loaded a sprite for this enemy, skip texture generation
            if (this.textures.exists(enemy.key) ||
                ['paper_hands', 'fud_spreader', 'rug_pull', 'bot_farm', 'short_seller', 'central_bank_whale',
                    'inflation_cloud', 'sec_regulator', 'shitcoin_rain', 'hack_attack', 'fomo_buyer', 'dead_cat_bounce', 'laundering_mixer'].includes(enemy.key)) {
                continue
            }
            const g = this.make.graphics({ add: false })
            const color = Phaser.Display.Color.IntegerToColor(enemy.color)
            const darkColor = color.clone().darken(20).color

            // Base shadow sphere
            g.fillStyle(darkColor, 1)
            g.fillCircle(8, 8, 8)
            // Lighter main body offset
            g.fillStyle(color.color, 1)
            g.fillCircle(7, 7, 7)
            // Top left highlight
            g.fillStyle(0xffffff, 0.5)
            g.fillEllipse(5, 5, 4, 3)

            g.generateTexture(enemy.key, 16, 16)
            g.destroy()
        }
    }

    /** Varied shapes for different towers */
    createProjectileTextures() {
        // Arrow (HODL)
        let g = this.make.graphics({ add: false })
        g.fillStyle(0xddaa55, 1); g.fillRect(0, 2, 8, 2); g.fillStyle(0x888888, 1); g.fillTriangle(8, 0, 12, 3, 8, 5)
        g.generateTexture('proj_arrow', 12, 6); g.clear()

        // Laser (Staking)
        g.fillStyle(0x00ffff, 1); g.fillRect(0, 0, 14, 4); g.fillStyle(0xffffff, 1); g.fillRect(2, 1, 10, 2)
        g.generateTexture('proj_laser', 14, 4); g.clear()

        // Bomb (Cannon)
        g.fillStyle(0x222222, 1); g.fillCircle(6, 6, 6); g.fillStyle(0xff4400, 1); g.fillCircle(8, 3, 2)
        g.generateTexture('proj_bomb', 12, 12); g.clear()

        // Orb (Drone)
        g.fillStyle(0xcc00ff, 1); g.fillCircle(5, 5, 5); g.fillStyle(0xffffff, 0.6); g.fillCircle(3, 3, 2)
        g.generateTexture('proj_orb', 10, 10); g.clear()

        // Fire (Burner)
        g.fillStyle(0xff0000, 1); g.fillCircle(6, 6, 6); g.fillStyle(0xffff00, 1); g.fillCircle(6, 6, 3)
        g.generateTexture('proj_fire', 12, 12); g.clear()

        // Magic (Gallery)
        g.fillStyle(0xff00ff, 0.8); g.fillEllipse(6, 4, 6, 4); g.fillStyle(0xffffff, 1); g.fillEllipse(6, 4, 3, 2)
        g.generateTexture('proj_magic', 12, 8); g.clear()

        // Spear (Harpoon)
        g.fillStyle(0x777777, 1); g.fillRect(0, 2, 16, 2); g.fillStyle(0xcccccc, 1); g.fillTriangle(16, 0, 22, 3, 16, 5)
        g.generateTexture('proj_spear', 22, 6); g.clear()

        // Lightning (Flash Loan)
        g.lineStyle(2, 0x00ffff, 1); g.beginPath(); g.moveTo(0, 0); g.lineTo(5, 8); g.lineTo(10, 2); g.lineTo(15, 10); g.strokePath()
        g.generateTexture('proj_lightning', 15, 10); g.destroy()
    }

    /** Simple shapes used by the particle emitter for explosions */
    createParticleTextures() {
        let g = this.make.graphics({ add: false })

        // hit spark (yellow/white)
        g.fillStyle(0xffffaa, 1); g.fillCircle(3, 3, 3)
        g.generateTexture('part_spark', 6, 6); g.clear()

        // blood or red impact
        g.fillStyle(0xff2222, 1); g.fillCircle(4, 4, 4)
        g.generateTexture('part_blood', 8, 8); g.clear()

        // magic explosion
        g.fillStyle(0xcc00ff, 1); g.fillRect(0, 0, 6, 6)
        g.generateTexture('part_magic', 6, 6); g.destroy()
    }

    createBaseTexture() {
        if (this.textures.exists('base')) return
        const g = this.make.graphics({ add: false })
        const size = GRID.TILE_SIZE

        // Top face
        g.fillStyle(0xff5577, 1)
        g.fillRect(0, 0, size, size - 12)
        // Front face
        g.fillStyle(0xcc1133, 1)
        g.fillRect(0, size - 12, size, 12)

        g.generateTexture('base', size, size)
        g.destroy()
    }

    /** Generate basic retro sound effects using Web Audio API buffer and store in Phaser cache */
    createSyntheticSounds() {
        try {
            const ctx = this.sound.context;
            if (!ctx) return;
            const sampleRate = ctx.sampleRate

            // 1. Shoot Sound (Pew)
            const shootLen = sampleRate * 0.1 // 100ms
            const shootBuf = ctx.createBuffer(1, shootLen, sampleRate)
            const shootData = shootBuf.getChannelData(0)
            for (let i = 0; i < shootLen; i++) {
                // descending square wave
                const freq = 600 - (i / shootLen) * 400
                const time = i / sampleRate
                shootData[i] = Math.sign(Math.sin(2 * Math.PI * freq * time)) * Math.exp(-i / (sampleRate * 0.05)) * 0.1
            }
            this.cache.audio.add('snd_shoot', shootBuf)

            // 2. Hit Sound (Thud/Explosion)
            const hitLen = sampleRate * 0.2 // 200ms
            const hitBuf = ctx.createBuffer(1, hitLen, sampleRate)
            const hitData = hitBuf.getChannelData(0)
            for (let i = 0; i < hitLen; i++) {
                // white noise + exponential decay
                hitData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.05)) * 0.15
            }
            this.cache.audio.add('snd_hit', hitBuf)

            // 3. Build Sound (Click)
            const buildLen = sampleRate * 0.05 // 50ms
            const buildBuf = ctx.createBuffer(1, buildLen, sampleRate)
            const buildData = buildBuf.getChannelData(0)
            for (let i = 0; i < buildLen; i++) {
                const freq = 800 + (i / buildLen) * 200
                const time = i / sampleRate
                buildData[i] = Math.sin(2 * Math.PI * freq * time) * Math.exp(-i / (sampleRate * 0.01)) * 0.1
            }
            this.cache.audio.add('snd_build', buildBuf)

            // Removed ctx.close() because it invalidates the audio buffers for future plays
        } catch (e) {
            console.warn("Could not generate synthetic sounds:", e)
        }
    }
}
