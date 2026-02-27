import { GAME } from './constants.js'
import { BootScene } from '../scenes/BootScene.js'
import { GameScene } from '../scenes/GameScene.js'

export const gameConfig = {
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    backgroundColor: GAME.BG_COLOR,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME.WIDTH,
        height: GAME.HEIGHT,
        expandParent: true
    },
    pixelArt: false,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    scene: [BootScene, GameScene],
}
