export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log('MenuScene created');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
        
        // Title
        const title = this.add.text(width / 2, height / 3, 'SPACESHIP vs ASTEROIDS', {
            fontSize: '48px',
            fill: '#4a90e2',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add glow effect
        title.setShadow(0, 0, 10, '#4a90e2', true);
        
        // Subtitle
        this.add.text(width / 2, height / 3 + 60, 'Survive the asteroid field!', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Start button
        const startButton = this.add.text(width / 2, height / 2 + 50, 'START GAME', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#4a90e2',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        startButton.setInteractive();
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#4a90e2', backgroundColor: '#ffffff' });
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff', backgroundColor: '#4a90e2' });
        });
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // High score
        const gameData = this.game.registry.get('gameData');
        if (gameData.highScore > 0) {
            this.add.text(width / 2, height / 2 + 120, `High Score: ${gameData.highScore}`, {
                fontSize: '20px',
                fill: '#ffff00'
            }).setOrigin(0.5);
        }
        
        // Controls
        this.add.text(width / 2, height - 100, 'Controls:', {
            fontSize: '18px',
            fill: '#4a90e2'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height - 70, 'Desktop: WASD/Arrow Keys to move, Space to fire', {
            fontSize: '14px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height - 50, 'Mobile: Use touch controls', {
            fontSize: '14px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        // Add some animated stars in the background
        this.createStarField();
        
        // Add keyboard support
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
    
    createStarField() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                1,
                0xffffff
            );
            
            // Animate stars
            this.tweens.add({
                targets: star,
                alpha: 0,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
} 