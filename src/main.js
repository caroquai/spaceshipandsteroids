import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig.js';

// Initialize the game
const game = new Phaser.Game(GameConfig);

// Make game globally accessible for debugging
window.game = game;

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.refresh();
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.scene.isActive('GameScene')) {
        game.scene.pause('GameScene');
    } else if (!document.hidden && game.scene.isPaused('GameScene')) {
        game.scene.resume('GameScene');
    }
});

// Export for potential use in other modules
export default game; 