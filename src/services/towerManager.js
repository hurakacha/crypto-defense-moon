import { TOWERS, TOWER_UPGRADE_MULT } from '../config/constants.js'

/**
 * TowerManager — handles tower placement, targeting, shooting, and upgrades.
 * Each tower is a Phaser sprite with custom data attached.
 */
export class TowerManager {
    constructor(scene, gridManager) {
        this.scene = scene
        this.gridManager = gridManager
        this.towers = []
        this.projectiles = this.scene.physics.add.group()

        this.createTowerTextures()
    }

    /** Generate a 3D-like box texture for each tower type */
    createTowerTextures() {
        const towerList = Object.values(TOWERS)
        for (const tower of towerList) {
            if (this.scene.textures.exists(tower.key)) continue
            const g = this.scene.make.graphics({ add: false })
            const w = 32
            const h = 42

            const color = Phaser.Display.Color.IntegerToColor(tower.color)
            const darkColor = color.clone().darken(35).color

            // Front face (darker)
            g.fillStyle(darkColor, 1)
            g.fillRect(0, 16, w, 26)

            // Top face (lighter)
            g.fillStyle(color.color, 1)
            g.fillRect(0, 0, w, 16)

            // Details
            g.fillStyle(0x0a0a1a, 0.5)
            g.fillCircle(w / 2, 8, 4) // top hole
            g.fillStyle(0x00ffff, 0.4)
            g.fillRect(w / 2 - 4, 22, 8, 12) // front highlight

            g.generateTexture(tower.key, w, h)
            g.destroy()
        }
    }

    /**
     * Place a tower on the grid.
     * @param {string} towerKey — key from TOWERS (e.g. 'hodl_tower')
     * @param {number} col — grid column
     * @param {number} row — grid row
     * @returns {{ success: boolean, cost: number }} placement result
     */
    placeTower(towerKey, col, row) {
        const towerDef = this.getTowerDefByKey(towerKey)
        if (!towerDef) return { success: false, cost: 0 }
        if (!this.gridManager.canBuild(col, row)) return { success: false, cost: 0 }

        // For 2x2 towers, the visual 'pos' should be between tiles
        const pos = this.gridManager.gridToPixel(col, row)
        // Offset by half a tile down/right to center the 2x2 block (80x80 total area)
        const centerX = pos.x + this.gridManager.tileSize / 2
        const centerY = pos.y + this.gridManager.tileSize / 2

        const sprite = this.scene.add.sprite(centerX, centerY, towerKey)
            .setDepth(10)
            .setOrigin(0.5, 0.75)
            .setDisplaySize(80, 80)

        sprite.towerData = {
            key: towerKey,
            col,
            row,
            level: 1,
            damage: towerDef.damage,
            range: towerDef.range,
            fireRate: towerDef.fireRate,
            special: towerDef.special,
            projectile: towerDef.projectile,
            lastFired: 0,
        }

        // range circle (hidden by default)
        sprite.rangeCircle = this.scene.add.circle(centerX, centerY, towerDef.range)
            .setStrokeStyle(1, towerDef.color, 0.3)
            .setFillStyle(towerDef.color, 0.05)
            .setDepth(5)
            .setVisible(false)

        // click to show range / upgrade
        sprite.setInteractive({ useHandCursor: true })
        sprite.on('pointerdown', () => {
            this.onTowerClick(sprite)
        })

        this.gridManager.placeTower(col, row)
        this.towers.push(sprite)

        return { success: true, cost: towerDef.cost }
    }

    /** Toggle range circle on click */
    onTowerClick(tower) {
        // hide all other range circles
        for (const t of this.towers) {
            if (t !== tower && t.rangeCircle) t.rangeCircle.setVisible(false)
        }

        if (tower.rangeCircle) {
            tower.rangeCircle.setVisible(!tower.rangeCircle.visible)
        }

        this.scene.events.emit('tower-selected', tower)
    }

    /**
     * Main update loop — called every frame.
     * Each tower finds the closest enemy in range and fires.
     */
    update(time, enemies) {
        for (const tower of this.towers) {
            if (!tower.active) continue
            const data = tower.towerData

            // skip non-attacking towers (mining rig, stablecoin shield)
            if (data.damage === 0 || data.fireRate === 0) continue

            if (time - data.lastFired < data.fireRate) continue

            const target = this.findClosestEnemy(tower, enemies)
            if (!target) continue

            data.lastFired = time
            this.fireProjectile(tower, target)
        }

        // Update active projectiles to home in on targets
        for (const proj of this.projectiles.getChildren()) {
            if (proj.active) {
                if (proj.targetEnemy && proj.targetEnemy.active) {
                    this.scene.physics.moveToObject(proj, proj.targetEnemy, 400)
                    proj.rotation = Phaser.Math.Angle.Between(proj.x, proj.y, proj.targetEnemy.x, proj.targetEnemy.y)
                } else {
                    // target died, destroy projectile
                    proj.destroy()
                }
            }
        }
    }

    /** Find closest active enemy within tower range */
    findClosestEnemy(tower, enemies) {
        let closest = null
        let closestDist = Infinity

        const children = enemies.getChildren()
        for (const enemy of children) {
            if (!enemy.active) continue

            const dx = enemy.x - tower.x
            const dy = enemy.y - tower.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist <= tower.towerData.range && dist < closestDist) {
                closest = enemy
                closestDist = dist
            }
        }

        return closest
    }

    /** Create and launch a projectile toward target */
    fireProjectile(tower, target) {
        const projKey = tower.towerData.projectile || 'projectile'
        const proj = this.scene.physics.add.sprite(tower.x, tower.y, projKey)
            .setDepth(15)

        proj.damage = tower.towerData.damage
        proj.special = tower.towerData.special
        proj.targetEnemy = target
        proj.towerColor = tower.towerData.color // store color for particles

        this.projectiles.add(proj)

        // move toward target position
        const speed = 400
        this.scene.physics.moveToObject(proj, target, speed)
        proj.rotation = Phaser.Math.Angle.Between(tower.x, tower.y, target.x, target.y)

        // Play shoot sound (Temporarily disabled to prevent WebAudio crash)
        /*
        try {
            if (this.scene.cache.audio.exists('snd_shoot')) {
                this.scene.sound.play('snd_shoot', { volume: 0.15, rate: 0.9 + Math.random() * 0.2 })
            }
        } catch (e) { }
        */

        // auto-destroy after 2 seconds if missed
        this.scene.time.delayedCall(2000, () => {
            if (proj.active) proj.destroy()
        })
    }

    /**
     * Check projectile-enemy collisions.
     * Called from GameScene update.
     */
    checkProjectileHits(enemies, damageCallback) {
        const projectiles = this.projectiles.getChildren()
        const enemyList = enemies.getChildren()

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i]
            if (!proj || !proj.active) continue

            for (const enemy of enemyList) {
                if (!enemy.active) continue

                const dx = proj.x - enemy.x
                const dy = proj.y - enemy.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 16) {
                    // 1. Splash Damage
                    if (proj.special === 'splash') {
                        this.applySplash(enemy, proj.damage, enemyList)
                    }

                    // 2. Slow Effect (Staking Laser)
                    if (proj.special === 'slow_30') {
                        this.applySlow(enemy, 0.7, 1500) // 30% slow for 1.5s
                    }

                    // 3. Chain Lightning (Flash Loan Bolt)
                    if (proj.special === 'chain_5') {
                        this.applyChain(enemy, proj.damage, 5, enemyList)
                    }

                    // 5. Blind Effect (NFT Gallery)
                    if (proj.special === 'blind_10' && Math.random() < 0.1) {
                        this.applyBlind(enemy, 1000) // 1s stun
                    }

                    // 6. Ignore Armor (Token Burner)
                    let dmg = proj.damage
                    if (proj.special === 'ignore_armor') {
                        dmg *= 1.25 // 25% damage bonus as "pierce"
                    }

                    damageCallback(enemy, dmg)
                    this.createHitParticles(proj.x, proj.y, proj.towerColor)

                    proj.destroy()
                    break
                }
            }
        }
    }

    /** Splash: deal half damage to enemies within 50px of impact */
    applySplash(center, damage, enemyList) {
        const splashRadius = 60
        const splashDamage = Math.round(damage * 0.5)

        for (const enemy of enemyList) {
            if (!enemy.active || enemy === center) continue
            const dx = enemy.x - center.x
            const dy = enemy.y - center.y
            if (Math.sqrt(dx * dx + dy * dy) <= splashRadius) {
                // Apply damage directly through scene to handle health bars
                this.scene.damageEnemy(enemy, splashDamage)
            }
        }
    }

    /** Slow: reduce enemy movement speed via tween timeScale */
    applySlow(enemy, scale, duration) {
        if (!enemy.active || !enemy.pathTween) return

        // Visually indicate slow (blue tint)
        enemy.setTint(0x3366ff)
        enemy.pathTween.setTimeScale(scale)

        // Clear existing reset timer if any
        if (enemy.slowTimer) enemy.slowTimer.remove()

        enemy.slowTimer = this.scene.time.delayedCall(duration, () => {
            if (enemy.active) {
                enemy.clearTint()
                if (enemy.pathTween) enemy.pathTween.setTimeScale(1)
            }
        })
    }

    /** Chain: jump to N nearest enemies */
    applyChain(startEnemy, damage, jumps, enemyList) {
        let current = startEnemy
        let count = 0
        const chained = new Set([startEnemy])

        const interval = setInterval(() => {
            if (count >= jumps - 1) {
                clearInterval(interval)
                return
            }

            let next = null
            let nextDist = 120 // chain range

            for (const e of enemyList) {
                if (!e.active || chained.has(e)) continue
                const d = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y)
                if (d < nextDist) {
                    next = e
                    nextDist = d
                }
            }

            if (next) {
                // Visual bolt
                const bolt = this.scene.add.graphics()
                bolt.lineStyle(2, 0x66ffff, 0.8)
                bolt.lineBetween(current.x, current.y, next.x, next.y)
                this.scene.time.delayedCall(100, () => bolt.destroy())

                this.scene.damageEnemy(next, Math.round(damage * 0.7))
                chained.add(next)
                current = next
                count++
            } else {
                clearInterval(interval)
            }
        }, 50)
    }

    /** Sticky Zone: creates a lingering slow area */
    applyStickyZone(x, y, radius) {
        const zone = this.scene.add.circle(x, y, radius, 0xcc00ff, 0.15).setDepth(5)
        this.scene.tweens.add({ targets: zone, alpha: 0, duration: 3000, onComplete: () => zone.destroy() })

        // Check enemies inside zone periodically
        const check = setInterval(() => {
            if (!zone.active) {
                clearInterval(check)
                return
            }
            const enemies = this.scene.enemies.getChildren()
            for (const e of enemies) {
                if (!e.active) continue
                if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radius) {
                    this.applySlow(e, 0.5, 500) // heavy slow while in zone
                }
            }
        }, 200)

        this.scene.time.delayedCall(3000, () => clearInterval(check))
    }

    /** Blind: briefly stun enemy */
    applyBlind(enemy, duration) {
        if (!enemy.active || !enemy.pathTween) return

        enemy.setTint(0xffffff) // Flash white
        enemy.pathTween.pause()

        this.scene.time.delayedCall(duration, () => {
            if (enemy.active) {
                enemy.clearTint()
                if (enemy.pathTween) enemy.pathTween.resume()
            }
        })
    }

    /** Upgrade a tower: +15% damage and range per level, max 5 */
    upgradeTower(tower) {
        const data = tower.towerData
        if (data.level >= 5) return { success: false, cost: 0 }

        const def = this.getTowerDefByKey(data.key)
        const upgradeCost = Math.round(def.cost * 0.6 * data.level)

        data.level++
        data.damage = Math.round(def.damage * Math.pow(TOWER_UPGRADE_MULT, data.level - 1))
        data.range = Math.round(def.range * Math.pow(TOWER_UPGRADE_MULT, data.level - 1))

        // update range circle
        if (tower.rangeCircle) {
            tower.rangeCircle.setRadius(data.range)
        }

        return { success: true, cost: upgradeCost }
    }

    /** Get upgrade cost for a tower */
    getUpgradeCost(tower) {
        const data = tower.towerData
        if (data.level >= 5) return null
        const def = this.getTowerDefByKey(data.key)
        return Math.round(def.cost * 0.6 * data.level)
    }

    /** Lookup tower definition by key */
    getTowerDefByKey(key) {
        return Object.values(TOWERS).find((t) => t.key === key) || null
    }

    /** Handle Mining Rig passive SOL generation */
    updatePassives(time) {
        for (const tower of this.towers) {
            if (!tower.active) continue
            if (tower.towerData.special !== 'generate_sol') continue

            // generate 5 SOL every 8 seconds
            if (!tower.towerData.lastGenerate) tower.towerData.lastGenerate = time
            if (time - tower.towerData.lastGenerate >= 8000) {
                tower.towerData.lastGenerate = time
                this.scene.events.emit('sol-generated', 5)
            }
        }
    }

    /** Spawn a burst of particles at impact location depending on projectile type */
    createHitParticles(x, y, projectileKey) {
        let partKey = 'part_spark'
        if (projectileKey === 'proj_orb' || projectileKey === 'proj_magic') {
            partKey = 'part_magic'
        } else if (projectileKey === 'proj_arrow' || projectileKey === 'proj_spear') {
            partKey = 'part_blood'
        }

        const emitter = this.scene.add.particles(x, y, partKey, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            emitting: false
        }).setDepth(20)

        // fire a single burst of 10 particles
        emitter.explode(10)

        // auto destroy emitter after particles die out
        this.scene.time.delayedCall(350, () => {
            emitter.destroy()
        })
    }

    /** Clean up all towers */
    destroy() {
        for (const tower of this.towers) {
            if (tower.rangeCircle) tower.rangeCircle.destroy()
            tower.destroy()
        }
        this.towers = []
        this.projectiles.clear(true, true)
    }
}
