import { BootScene } from '../scenes/BootScene.js';
import { PreloadScene } from '../scenes/PreloadScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export const GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300
        },
        max: {
            width: 1200,
            height: 900
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,
        powerPreference: 'high-performance'
    },
    audio: {
        disableWebAudio: false
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false
    },
    scene: [
        BootScene,
        PreloadScene,
        MenuScene,
        GameScene,
        GameOverScene
    ],
    callbacks: {
        boot: function (game) {
            console.log('Boot callback called');
            // Hide loading screen when game starts
            const loadingScreen = document.getElementById('loading-screen');
            console.log('Loading screen element:', loadingScreen);
            if (loadingScreen) {
                console.log('Hiding loading screen');
                loadingScreen.style.display = 'none';
                console.log('Loading screen display style after hiding:', loadingScreen.style.display);
            } else {
                console.log('Loading screen element not found');
            }
        }
    }
}; 