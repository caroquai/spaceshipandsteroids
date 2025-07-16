export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const gameData = this.game.registry.get('gameData');
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
        
        // Game Over text
        const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
            fontSize: '64px',
            fill: '#e74c3c',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        gameOverText.setShadow(0, 0, 15, '#e74c3c', true);
        
        // Final score
        this.add.text(width / 2, height / 2, `Final Score: ${gameData.score}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // High score
        if (gameData.score >= gameData.highScore) {
            this.add.text(width / 2, height / 2 + 40, 'NEW HIGH SCORE!', {
                fontSize: '24px',
                fill: '#ffff00',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        } else {
            this.add.text(width / 2, height / 2 + 40, `High Score: ${gameData.highScore}`, {
                fontSize: '20px',
                fill: '#ffff00'
            }).setOrigin(0.5);
        }
        
        // Level reached
        this.add.text(width / 2, height / 2 + 80, `Level Reached: ${gameData.level}`, {
            fontSize: '20px',
            fill: '#4a90e2'
        }).setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.text(width / 2, height - 150, 'PLAY AGAIN', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#4a90e2',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        restartButton.setInteractive();
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ fill: '#4a90e2', backgroundColor: '#ffffff' });
        });
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ fill: '#ffffff', backgroundColor: '#4a90e2' });
        });
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Menu button
        const menuButton = this.add.text(width / 2, height - 100, 'MAIN MENU', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        
        menuButton.setInteractive();
        menuButton.on('pointerover', () => {
            menuButton.setStyle({ fill: '#666666', backgroundColor: '#ffffff' });
        });
        menuButton.on('pointerout', () => {
            menuButton.setStyle({ fill: '#ffffff', backgroundColor: '#666666' });
        });
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Add keyboard support
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
        
        // Play game over sound safely
        this.playSound('gameOver', 0.7);
        
        // Add some particle effects
        this.createGameOverEffects();
    }
    
    createGameOverEffects() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create falling debris effect
        for (let i = 0; i < 30; i++) {
            const debris = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(-50, 0),
                Phaser.Math.FloatBetween(1, 3),
                0x8B4513
            );
            
            this.tweens.add({
                targets: debris,
                y: height + 50,
                x: debris.x + Phaser.Math.Between(-50, 50),
                rotation: Phaser.Math.Between(0, Math.PI * 2),
                duration: Phaser.Math.Between(3000, 6000),
                ease: 'Linear',
                onComplete: () => {
                    debris.destroy();
                }
            });
        }
        
        // Create simple explosion effect
        for (let i = 0; i < 20; i++) {
            const explosion = this.add.circle(
                width / 2 + Phaser.Math.Between(-30, 30),
                height / 2 + Phaser.Math.Between(-30, 30),
                Phaser.Math.FloatBetween(1, 3),
                0xff4500
            );
            
            this.tweens.add({
                targets: explosion,
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(1000, 2000),
                ease: 'Power2',
                onComplete: () => {
                    explosion.destroy();
                }
            });
        }
    }

    playSound(key, volume = 1.0) {
        try {
            if (this.cache.audio.exists(key)) {
                this.sound.play(key, { volume });
            }
        } catch (error) {
            console.log(`Audio file '${key}' not available`);
        }
    }
} 