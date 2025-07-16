export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load minimal assets needed for loading screen
        this.load.image('loading-bg', 'assets/sprites/loading-bg.png');
    }

    create() {
        // Set up global game settings
        this.setupGameSettings();
        
        // Start the preload scene
        this.scene.start('PreloadScene');
    }

    setupGameSettings() {
        // Configure input - using the correct Phaser 3 API
        this.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.ESC
        ]);

        // Set up global game data
        this.game.registry.set('gameData', {
            score: 0,
            lives: 3,
            level: 1,
            highScore: this.loadHighScore()
        });

        // Set up audio settings
        this.sound.setVolume(0.5);
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('spaceshipAsteroidsHighScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (error) {
            console.warn('Could not load high score:', error);
            return 0;
        }
    }
} 