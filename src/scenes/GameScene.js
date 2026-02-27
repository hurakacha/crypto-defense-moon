import { GAME, WAVE, WAYPOINTS, GRID, TOWERS } from '../config/constants.js'
import { WaveManager } from '../services/waveManager.js'
import { ScoreManager } from '../services/scoreManager.js'
import { GridManager } from '../services/gridManager.js'
import { TowerManager } from '../services/towerManager.js'

/**
 * GameScene — main gameplay loop.
 * Phase 2: grid system, tower placement, auto-shooting, shop UI, diverse waves.
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
    }

    create() {
        this.cameras.main.setBackgroundColor(GAME.BG_COLOR)

        // Initialize Play.fun SDK
        this.sdkReady = false;
        try {
            this.sdk = new OpenGameSDK({
                gameId: 'f4711bc3-80a6-43b8-b660-8ceecd53b2ab',
                apiKey: 'f4711bc3-80a6-43b8-b660-8ceecd53b2ab',
                ui: { usePointsWidget: true }
            })

            this.sdk.init().then(() => {
                console.log('Play.fun SDK ready!')
                this.sdkReady = true;
            }).catch(err => {
                console.error('Play.fun SDK init failed:', err)
            })
        } catch (e) {
            console.error('Play.fun SDK creation error:', e)
        }

        // Init Managers
        this.waveManager = new WaveManager(this)
        this.scoreManager = new ScoreManager(this)
        this.gridManager = new GridManager(this)
        this.towerManager = new TowerManager(this, this.gridManager)

        // Game State
        this.sol = GAME.STARTING_SOL
        this.baseHP = GAME.BASE_HP
        this.isGameOver = false
        this.isPlaying = false // New state to track if game has started after audio unlock
        this.selectedTowerKey = null

        this.enemies = this.physics.add.group()

        // Draw AAA 2D Background
        // Draw AAA 2D Background - Maintain aspect ratio while covering the 800x800 area
        const bg = this.add.image(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'map_bg').setDepth(-10)
        const scale = Math.max(GAME.WIDTH / bg.width, GAME.HEIGHT / bg.height)
        bg.setScale(scale)

        this.drawPath()

        // DEBUG: Set depth high enough to see if needed, but keeping commented out for release
        // this.gridManager.drawGrid()
        // this.input.on('pointerdown', (pointer) => {
        //     const cell = this.gridManager.pixelToGrid(pointer.x, pointer.y)
        //     console.log(`Point: x=${Math.round(pointer.x)}, y=${Math.round(pointer.y)} | Grid: col=${cell.col}, row=${cell.row}`)
        // })
        this.createHUD()
        this.createRangePreview()
        this.createShopUI()
        this.bindEvents()

        // Handle pointer move for range preview
        this.input.on('pointermove', (pointer) => {
            if (this.isGameOver || pointer.y > GAME.HEIGHT - 80 || !this.selectedTowerKey) {
                if (this.rangePreview) this.rangePreview.setVisible(false)
                return
            }

            const def = Object.values(TOWERS).find(t => t.key === this.selectedTowerKey)
            const cell = this.gridManager.pixelToGrid(pointer.x, pointer.y)
            const pos = this.gridManager.gridToPixel(cell.col, cell.row)

            // Center visual aids on the 2x2 footprint
            const centerX = pos.x + this.gridManager.tileSize / 2
            const centerY = pos.y + this.gridManager.tileSize / 2

            if (this.gridManager.canBuild(cell.col, cell.row)) {
                this.rangePreview.setPosition(centerX, centerY)
                this.rangePreview.setRadius(def.range)
                this.rangePreview.setStrokeStyle(1, def.color, 0.4)
                this.rangePreview.setFillStyle(def.color, 0.1)
                this.rangePreview.setVisible(true)

                this.cellHighlight.setPosition(centerX, centerY)
                this.cellHighlight.setFillStyle(0x00ff88, 0.4)
                this.cellHighlight.setVisible(true)
            } else {
                this.rangePreview.setVisible(false)

                this.cellHighlight.setPosition(centerX, centerY)
                this.cellHighlight.setFillStyle(0xff0000, 0.4)
                this.cellHighlight.setVisible(true)
            }
        })

        // Handle grid clicks for tower placement / deselection
        this.input.on('pointerdown', (pointer) => {
            // Ignore clicks on shop UI area at the bottom (dynamic calc)
            if (this.isGameOver || pointer.y > this.cameras.main.height - 100) return

            // Ignore if clicking on an existing tower (TowerManager handles that event)
            const cell = this.gridManager.pixelToGrid(pointer.x, pointer.y)
            if (this.gridManager.grid[cell.row] && this.gridManager.grid[cell.row][cell.col] === 2) {
                return // handled by towerManager click listener
            }

            // Hide upgrade UI if clicking empty space
            this.hideUpgradeUI()

            // If we have a tower selected to build and cell is free
            if (this.selectedTowerKey && this.gridManager.canBuild(cell.col, cell.row)) {
                const def = Object.values(TOWERS).find(t => t.key === this.selectedTowerKey)
                console.log(`Trying to build ${this.selectedTowerKey} at ${cell.col}, ${cell.row}. Cost: ${def.cost}, SOL: ${this.sol}`);
                if (this.sol >= def.cost) {
                    const res = this.towerManager.placeTower(this.selectedTowerKey, cell.col, cell.row)
                    if (res.success) {
                        this.sol -= res.cost
                        this.updateHUD()
                        this.selectedTowerKey = null
                        this.updateShopHighlight()
                        if (this.rangePreview) this.rangePreview.setVisible(false)
                        if (this.cellHighlight) this.cellHighlight.setVisible(false)

                        try {
                            if (this.cache.audio.exists('snd_build')) {
                                this.sound.play('snd_build', { volume: 0.5 })
                            }
                        } catch (e) { }
                    } else {
                        console.log('TowerManager placeTower failed:', res);
                    }
                } else {
                    console.log('Not enough SOL to build');
                    // Visual feedback: not enough SOL
                    this.cameras.main.shake(100, 0.005)
                }
            } else if (this.selectedTowerKey) {
                console.log(`Cannot build at ${cell.col}, ${cell.row}. canBuild returned false.`);
                // Deselect current tower to build
                this.selectedTowerKey = null
                this.updateShopHighlight()
                if (this.rangePreview) this.rangePreview.setVisible(false)
                if (this.cellHighlight) this.cellHighlight.setVisible(false)
            } else {
                // Deselect current tower to build
                this.selectedTowerKey = null
                this.updateShopHighlight()
                if (this.rangePreview) this.rangePreview.setVisible(false)
                if (this.cellHighlight) this.cellHighlight.setVisible(false)
            }
        })

        // auto-start first wave
        this.time.delayedCall(1000, () => this.waveManager.startNextWave())

        // Periodic point sync
        this.time.addEvent({
            delay: 30000,
            callback: () => {
                if (this.sdkReady && this.sdk) {
                    try {
                        this.sdk.savePoints()
                    } catch (e) { }
                }
            },
            loop: true
        })
    }

    update(time, delta) {
        if (this.isGameOver) return

        // Update towers (targeting, shooting)
        this.towerManager.update(time, this.enemies)

        // Check collisions
        this.towerManager.checkProjectileHits(this.enemies, this.damageEnemy.bind(this))

        // Check passives (mining rig SOL generation)
        this.towerManager.updatePassives(time)
    }

    // ─── Path ──────────────────────────────────────────────────────────

    drawPath() {
        const g = this.add.graphics().setDepth(1)

        // Define a path from direct pixel-based waypoints (scaled by 1.5)
        this.enemyPath = new Phaser.Curves.Path(WAYPOINTS[0].x, WAYPOINTS[0].y)

        for (let i = 1; i < WAYPOINTS.length; i++) {
            this.enemyPath.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y)
        }

        // Draw it implicitly (can comment out later for release)
        // g.lineStyle(4, 0xff0000, 0.6) // Red (Outer path)
        // this.enemyPath.draw(g)

        // draw base at the end
        const last = WAYPOINTS[WAYPOINTS.length - 1]
        this.add.image(last.x, last.y, 'base').setOrigin(0.5).setDepth(2)
    }

    // ─── HUD & UI ──────────────────────────────────────────────────────

    createHUD() {
        const style = { fontFamily: '"Georgia", serif', fontSize: '13px', color: '#ffddaa', fontStyle: 'bold' }

        // HUD Background boards (smaller, tighter)
        const topBg = this.add.rectangle(5, 5, 140, 75, 0x3a2010).setOrigin(0).setDepth(99)
        topBg.setStrokeStyle(2, 0x1f0900)

        const baseBg = this.add.rectangle(this.cameras.main.width - 120, 5, 115, 30, 0x3a2010).setOrigin(0).setDepth(99)
        baseBg.setStrokeStyle(2, 0x1f0900)

        this.hudWave = this.add.text(12, 12, '', style).setDepth(100)
        this.hudScore = this.add.text(12, 28, '', style).setDepth(100)
        this.hudHigh = this.add.text(12, 44, '', style).setDepth(100)
        this.hudSol = this.add.text(12, 60, '', { ...style, color: '#ffff00', fontSize: '15px' }).setDepth(100)

        this.hudBaseHP = this.add.text(this.cameras.main.width - 110, 12, '', { ...style, color: '#ff4444', fontSize: '14px' }).setDepth(100)

        this.updateHUD()

        // game-over overlay
        this.gameOverGroup = this.add.group()
        const x = GAME.WIDTH / 2
        const y = GAME.HEIGHT / 2
        const overlay = this.add.rectangle(x, y, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.85).setDepth(200)
        this.gameOverText = this.add.text(x, y - 40, 'KINGDOM FALLEN', { fontFamily: '"Georgia", serif', fontSize: '42px', color: '#ff2255', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201)
        this.gameOverScore = this.add.text(x, y + 10, '', { fontFamily: '"Georgia", serif', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(201)
        this.restartBtn = this.add.text(x, y + 80, '[ RETRY ]', { fontFamily: '"Georgia", serif', fontSize: '28px', color: '#ffff00', backgroundColor: '#3a2010', padding: { x: 30, y: 15 } }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })
        this.restartBtn.on('pointerup', () => this.restartGame())
        this.gameOverGroup.addMultiple([overlay, this.gameOverText, this.gameOverScore, this.restartBtn])
        this.gameOverGroup.setVisible(false)
    }

    updateHUD() {
        this.hudWave.setText(`WAVE: ${this.waveManager.currentWave}`)
        this.hudScore.setText(`SCORE: ${this.scoreManager.getScore()}`)
        this.hudHigh.setText(`HIGH: ${this.scoreManager.highScore}`)
        this.hudSol.setText(`$SOL: ${this.sol}`)
        this.hudBaseHP.setText(`BASE HP: ${this.baseHP}`)
    }

    createRangePreview() {
        this.rangePreview = this.add.circle(0, 0, 100).setDepth(6).setVisible(false)
        // footprints are now 2x2 (64x64)
        this.cellHighlight = this.add.rectangle(0, 0, GRID.TILE_SIZE * 2, GRID.TILE_SIZE * 2, 0xffffff, 0.3).setDepth(5).setVisible(false)
    }

    createShopUI() {
        // Lower the whole bar and thin it out to not overlap road
        const shopY = this.cameras.main.height - 35
        const shopWidth = this.cameras.main.width
        const bg = this.add.rectangle(shopWidth / 2, shopY + 10, shopWidth, 80, 0x3a2010).setDepth(150).setAlpha(0.7)
        bg.setStrokeStyle(4, 0x1f0900)

        // Add tooltip container (moved up to not overlap bar)
        this.tooltipPanel = this.add.container(shopWidth / 2, shopY - 70).setDepth(200).setVisible(false)
        const ttBg = this.add.rectangle(0, 0, 420, 56, 0x2a1505, 0.95).setStrokeStyle(2, 0xffaa00)
        this.ttTitle = this.add.text(-195, -22, '', { fontFamily: '"Georgia", serif', fontSize: '15px', color: '#ffffff', fontStyle: 'bold' })
        this.ttDesc = this.add.text(-195, -2, '', { fontFamily: '"Georgia", serif', fontSize: '13px', color: '#dddddd', wordWrap: { width: 400 } })
        this.tooltipPanel.add([ttBg, this.ttTitle, this.ttDesc])

        // Render tower buttons - Centered dynamically
        this.shopButtons = []
        const towerDefs = Object.values(TOWERS)
        const spacing = 72
        const totalWidth = (towerDefs.length - 1) * spacing
        let startX = (shopWidth - totalWidth) / 2

        towerDefs.forEach((towerDef, i) => {
            const x = startX + (i * spacing)

            // button bg - centered and thinned
            const btnBg = this.add.rectangle(x, shopY + 5, 58, 58, 0x5a3018).setDepth(151).setInteractive({ useHandCursor: true })
            btnBg.setStrokeStyle(2, 0x1f0900)
            btnBg.towerKey = towerDef.key

            // icon
            const icon = this.add.sprite(x, shopY - 5, towerDef.key).setDepth(152).setDisplaySize(48, 48)

            // cost text
            const costText = this.add.text(x, shopY + 28, `${towerDef.cost} SOL`, { fontFamily: '"Georgia", serif', fontSize: '12px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(152)

            btnBg.on('pointerdown', () => {
                if (this.sol >= towerDef.cost) {
                    this.selectedTowerKey = towerDef.key
                    this.updateShopHighlight()
                    this.hideUpgradeUI()
                } else {
                    this.cameras.main.shake(100, 0.005)
                }
            })

            btnBg.on('pointerover', () => {
                const titleText = towerDef.key.replace('_', ' ').toUpperCase() + ` (Cost: ${towerDef.cost} SOL)`
                this.ttTitle.setText(titleText)
                this.ttDesc.setText(towerDef.desc)
                this.tooltipPanel.setVisible(true)
                if (this.selectedTowerKey !== towerDef.key) {
                    btnBg.setStrokeStyle(2, 0xffaa00, 0.8)
                }
            })

            btnBg.on('pointerout', () => {
                this.tooltipPanel.setVisible(false)
                this.updateShopHighlight()
            })

            this.shopButtons.push({ bg: btnBg, key: towerDef.key })
        })
    }

    updateShopHighlight() {
        this.shopButtons.forEach(btn => {
            if (btn.key === this.selectedTowerKey) {
                btn.bg.setStrokeStyle(3, 0x00ff00, 1)
                btn.bg.setFillStyle(0x7a4028)
            } else {
                btn.bg.setStrokeStyle(2, 0x1f0900, 1)
                btn.bg.setFillStyle(0x5a3018)
            }
        })
    }

    // ─── Tower Upgrade UI ──────────────────────────────────────────────

    createUpgradeUI() {
        this.upgradeContainer = this.add.container(0, 0).setDepth(160).setVisible(false)

        const bg = this.add.rectangle(0, -60, 150, 80, 0x111122, 0.9).setStrokeStyle(1, 0x00ff88)
        const lbl = this.add.text(0, -85, 'UPGRADE', { fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#fff' }).setOrigin(0.5)
        this.upgradeCostText = this.add.text(0, -65, '', { fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#ff0' }).setOrigin(0.5)

        const upgBtn = this.add.rectangle(0, -40, 120, 20, 0x00ff88).setInteractive({ useHandCursor: true })
        const upgLbl = this.add.text(0, -40, 'CONFIRM', { fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#000' }).setOrigin(0.5)

        const sellBtn = this.add.rectangle(0, -15, 120, 20, 0xffaa00).setInteractive({ useHandCursor: true })
        this.sellLbl = this.add.text(0, -15, 'SELL (+0)', { fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#000' }).setOrigin(0.5)

        upgBtn.on('pointerdown', () => {
            if (!this.activeUpgradeTower) return
            const cost = this.towerManager.getUpgradeCost(this.activeUpgradeTower)
            if (cost && this.sol >= cost) {
                this.sol -= cost
                this.towerManager.upgradeTower(this.activeUpgradeTower)
                this.updateHUD()
                this.hideUpgradeUI()
            } else {
                this.cameras.main.shake(100, 0.005)
            }
        })

        sellBtn.on('pointerdown', () => {
            if (!this.activeUpgradeTower) return
            const data = this.activeUpgradeTower.towerData
            const def = Object.values(TOWERS).find(t => t.key === data.key)
            let totalSpent = def.cost
            for (let i = 1; i < data.level; i++) {
                totalSpent += Math.round(def.cost * 0.6 * i)
            }
            const refund = Math.floor(totalSpent / 2)
            this.sol += refund
            this.gridManager.removeTower(data.col, data.row)

            // Cleanup visually and remove from tower array
            if (this.activeUpgradeTower.rangeCircle) this.activeUpgradeTower.rangeCircle.destroy()
            this.towerManager.towers = this.towerManager.towers.filter(t => t !== this.activeUpgradeTower)
            this.activeUpgradeTower.destroy()

            this.updateHUD()
            this.hideUpgradeUI()
        })

        this.upgradeContainer.add([bg, lbl, this.upgradeCostText, upgBtn, upgLbl, sellBtn, this.sellLbl])
    }

    hideUpgradeUI() {
        this.activeUpgradeTower = null
        if (this.upgradeContainer) {
            this.upgradeContainer.setVisible(false)
        }
        // hide range circles handled by clicking empty grid
        if (this.towerManager && this.towerManager.towers) {
            this.towerManager.towers.forEach(t => {
                if (t && t.rangeCircle) t.rangeCircle.setVisible(false)
            })
        }
    }

    // ─── Events ────────────────────────────────────────────────────────

    bindEvents() {
        this.events.on('spawn-enemy', (data) => this.spawnEnemy(data))

        this.events.on('wave-complete', (data) => {
            this.scoreManager.setWave(data.wave)
            this.updateHUD()
            this.time.delayedCall(WAVE.DELAY_BETWEEN_WAVES_MS, () => {
                if (!this.isGameOver) this.waveManager.startNextWave()
            })
        })

        this.events.on('tower-selected', (tower) => {
            if (!tower) {
                this.hideUpgradeUI()
                return
            }
            // Show upgrade UI
            const cost = this.towerManager.getUpgradeCost(tower)
            if (cost) {
                this.activeUpgradeTower = tower
                this.upgradeCostText.setText(`Cost: ${cost} SOL`)
                this.upgradeContainer.setPosition(tower.x, tower.y)
                this.upgradeContainer.setVisible(true)
                this.selectedTowerKey = null // deselect build mode
                this.updateShopHighlight()
                if (this.rangePreview) this.rangePreview.setVisible(false)

                this.updateSellLabel(tower)
            } else {
                this.activeUpgradeTower = null
                this.upgradeCostText.setText('MAX LEVEL')
                this.upgradeContainer.setPosition(tower.x, tower.y)
                this.upgradeContainer.setVisible(true)

                this.updateSellLabel(tower)
            }
        })

        // Listen for passive SOL generation
        this.events.on('sol-generated', (amount) => {
            this.sol += amount
            this.updateHUD()
            // small pop text effect
            const text = this.add.text(GAME.WIDTH / 2, 50, `+${amount} SOL`, { fontFamily: '"Courier New", monospace', fontSize: '20px', color: '#ffff00' }).setDepth(200).setOrigin(0.5)
            this.tweens.add({ targets: text, y: 20, alpha: 0, duration: 1000, onComplete: () => text.destroy() })
        })
    }

    updateSellLabel(tower) {
        if (!tower || !this.sellLbl) return
        const data = tower.towerData
        const def = Object.values(TOWERS).find(t => t.key === data.key)
        let totalSpent = def.cost
        for (let i = 1; i < data.level; i++) {
            totalSpent += Math.round(def.cost * 0.6 * i)
        }
        const refund = Math.floor(totalSpent / 2)
        this.sellLbl.setText(`SELL (+${refund})`)
    }

    // ─── Enemy Spawning ────────────────────────────────────────────────

    spawnEnemy(data) {
        const activePath = this.enemyPath

        // Evaluate start position from curve
        const startPoint = activePath.getStartPoint()
        const enemy = this.physics.add.sprite(startPoint.x, startPoint.y, data.key).setDepth(15)

        // AAA Sprite Scaling - Optimized for Large 8-tile roads
        if (data.key === 'central_bank_whale') {
            enemy.setDisplaySize(240, 200).setOrigin(0.5, 0.6)
        } else {
            enemy.setDisplaySize(80, 80).setOrigin(0.5, 0.7)
        }

        enemy.enemyData = { ...data }
        enemy.moveSpeed = data.speed
        enemy.activePath = activePath

        // Adjust HP bar for larger sprites - Positioned higher
        const hpBarY = data.key === 'central_bank_whale' ? -130 : -80
        enemy.hpBarOffset = hpBarY
        enemy.hpBarBg = this.add.rectangle(enemy.x, enemy.y + hpBarY, 30, 4, 0x333333).setDepth(50)
        enemy.hpBar = this.add.rectangle(enemy.x, enemy.y + hpBarY, 30, 4, 0x00ff00).setDepth(51)

        this.enemies.add(enemy)

        // Init animation state
        enemy.baseScaleX = enemy.scaleX
        enemy.baseScaleY = enemy.scaleY
        enemy.animOffset = Math.random() * Math.PI * 2 // random phase

        this.startPathFollowing(enemy)
    }

    startPathFollowing(enemy) {
        const curveLength = enemy.activePath.getLength()
        const duration = (curveLength / enemy.moveSpeed) * 1000

        enemy.pathTween = this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: duration,
            ease: 'Linear',
            onUpdate: (tween) => {
                if (!enemy.active) return
                const t = tween.getValue()
                const point = enemy.activePath.getPoint(t)

                // 1. Directional Flipping (Inverted: most sprites face left by default)
                const nextT = Math.min(1, t + 0.01)
                const nextPoint = enemy.activePath.getPoint(nextT)
                if (nextPoint.x < point.x) enemy.setFlipX(false) // Faces left
                else if (nextPoint.x > point.x) enemy.setFlipX(true) // Faces right

                // 2. Procedural Animation (Slight Bobbing & Squash)
                const time = this.time.now / 1000
                const freq = 6 // Slowed down
                const amp = 2  // Reduced amplitude
                const bob = Math.sin(time * freq + enemy.animOffset) * amp

                // Squash and stretch (subtle)
                const squash = 1 + Math.sin(time * freq * 1.5 + enemy.animOffset) * 0.03
                enemy.setScale(enemy.baseScaleX * (2 - squash), enemy.baseScaleY * squash)

                enemy.setPosition(point.x, point.y + bob)

                // Ensure HP bar follows the bobbing
                this.updateEnemyHPBar(enemy)
            },
            onComplete: () => {
                if (enemy.active) {
                    this.enemyReachedBase(enemy)
                }
            }
        })
    }

    // ─── Enemy Logic ───────────────────────────────────────────────────

    damageEnemy(enemy, amount) {
        if (!enemy.active) return

        // Apply special logic (Hack attack invisibility logic, etc... kept simple for now)
        enemy.enemyData.hp -= amount

        if (enemy.enemyData.hp <= 0) {
            this.killEnemy(enemy)
        } else {
            this.updateEnemyHPBar(enemy)
        }
    }

    killEnemy(enemy) {
        this.sol += enemy.enemyData.reward
        this.scoreManager.addKill()
        this.destroyEnemy(enemy)
        this.waveManager.onEnemyRemoved()
        this.updateHUD()
    }

    enemyReachedBase(enemy) {
        this.baseHP--

        // Check for Short Seller ability
        if (enemy.enemyData.key === 'short_seller') {
            this.sol = Math.max(0, this.sol - 1)
        }

        this.destroyEnemy(enemy)
        this.waveManager.onEnemyRemoved()
        this.updateHUD()

        if (this.baseHP <= 0) {
            this.triggerGameOver()
        }
    }

    destroyEnemy(enemy) {
        if (enemy.hpBar) enemy.hpBar.destroy()
        if (enemy.hpBarBg) enemy.hpBarBg.destroy()
        this.tweens.killTweensOf(enemy)
        enemy.destroy()
    }

    updateEnemyHPBar(enemy) {
        if (!enemy.active || !enemy.hpBar) return
        const pct = Math.max(0, enemy.enemyData.hp / enemy.enemyData.maxHp)
        enemy.hpBar.width = 30 * pct
        enemy.hpBar.fillColor = pct > 0.5 ? 0x00ff00 : (pct > 0.25 ? 0xffaa00 : 0xff0000)
        const offsetY = enemy.hpBarOffset || -80
        enemy.hpBar.setPosition(enemy.x, enemy.y + offsetY)
        enemy.hpBarBg.setPosition(enemy.x, enemy.y + offsetY)
    }

    // ─── Game Over ─────────────────────────────────────────────────────

    triggerGameOver() {
        this.isGameOver = true
        this.scoreManager.checkHighScore()

        if (this.sdkReady && this.sdk) {
            try {
                this.sdk.savePoints()
            } catch (e) { }
        }

        this.enemies.getChildren().forEach((e) => this.destroyEnemy(e))

        const currentScore = this.scoreManager.getScore()
        const highScore = this.scoreManager.highScore
        this.gameOverScore.setText(`Score: ${currentScore} | High Score: ${highScore}`)

        this.gameOverGroup.setVisible(true)
    }

    restartGame() {
        this.waveManager.destroy()
        this.towerManager.destroy()
        this.scoreManager.reset()

        // Force off events to reset cleanly
        this.events.off('spawn-enemy')
        this.events.off('wave-complete')
        this.events.off('tower-selected')
        this.events.off('sol-generated')

        this.scene.restart()
    }
}
