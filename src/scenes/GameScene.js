import { Spaceship } from '../entities/Spaceship.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Bullet } from '../entities/Bullet.js';
import { PowerUp } from '../entities/PowerUp.js';
import { UFO } from '../entities/UFO.js';
import { Boss } from '../entities/Boss.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.spaceship = null;
        this.asteroids = null;
        this.bullets = null;
        this.powerUps = null;
        this.ufos = null;
        this.particles = null;
        this.boss = null;
        this.bossGroup = null;
        
        this.scoreText = null;
        this.livesText = null;
        this.levelText = null;
        this.powerUpTimers = null;
        
        // Avatar tutorial system
        this.avatarOverlay = null;
        this.avatarSprite = null;
        this.avatarText = null;
        this.avatarContinueButton = null;
        this.avatarActive = false;
        this.explainedPowerUps = new Set();
        this.gamePaused = false; // Custom pause flag
        
        // Dynamic background system
        this.venusBackground = null;
        this.backgroundTransitionActive = false;
        this.engineBoostActive = false;
        
        this.cursors = null;
        this.fireKey = null;
        
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 2000;
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 8000; // More frequent power-ups
        this.ufoSpawnTimer = 0;
        this.ufoSpawnInterval = 10000; // UFO spawn interval
        
        this.gameData = null;
        this.bossStage = false;
    }

    create() {
        console.log('=== GAMESCENE CREATE METHOD STARTED ===');
        try {
            console.log('GameScene created - starting create method');
            this.gameData = this.game.registry.get('gameData');
            console.log('Game data retrieved');
            this.resetGameData();
            console.log('Game data reset');
        
        this.setupBackground();
        console.log('Background setup complete');
        this.setupGroups();
        console.log('Groups setup complete');
        this.setupUI();
        console.log('UI setup complete');
        this.setupInput();
        console.log('Input setup complete');
        this.setupAudio();
        console.log('Audio setup complete');
        
        this.spawnSpaceship();
        console.log('Spaceship spawned - entrance animation will start');
        
        // Set up collisions AFTER entities are created
        this.setupCollisions();
        console.log('Collisions setup complete');
        
        // Start UFO spawning from stage 2
        if (this.gameData.level >= 2) {
            this.spawnUFO();
        }
        
        // Start background music (only if available)
        this.startBackgroundMusic();
        console.log('Background music started');
        
        console.log('About to set up avatar tutorial...');
        // Set up avatar tutorial system
        this.setupAvatarTutorial();
        console.log('Avatar tutorial setup complete');
        
        console.log('GameScene create method completed successfully');
        } catch (error) {
            console.error('Error in GameScene create method:', error);
        }
    }

    resetGameData() {
        this.gameData.score = 0;
        this.gameData.lives = 3;
        this.gameData.level = 1;
        this.game.registry.set('gameData', this.gameData);
        
        // Reset explained power-ups so tutorial shows for each new game
        this.explainedPowerUps.clear();
        this.avatarActive = false; // Reset avatar tutorial state
        console.log('Reset explained power-ups and avatar state, tutorial will show for new power-ups');
    }

    setupBackground() {
        // Add starfield background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0);
        
        // Create starfield groups for different layers
        this.starfieldLayers = {
            far: this.add.group(),
            medium: this.add.group(),
            near: this.add.group()
        };
        
        // Far stars (small, slow movement)
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, this.cameras.main.width),
                Phaser.Math.Between(0, this.cameras.main.height),
                Phaser.Math.FloatBetween(0.4, 1),
                0xffffff
            );
            star.setAlpha(0.5); // More visible
            star.speed = 0.5; // Slow movement
            this.starfieldLayers.far.add(star);
        }
        
        // Medium stars (medium size, medium movement)
        for (let i = 0; i < 30; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, this.cameras.main.width),
                Phaser.Math.Between(0, this.cameras.main.height),
                Phaser.Math.FloatBetween(0.6, 1.2),
                0xffffff
            );
            star.setAlpha(0.4); // More visible
            star.speed = 1; // Medium movement
            this.starfieldLayers.medium.add(star);
        }
        
        // Near stars (larger, faster movement)
        for (let i = 0; i < 20; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, this.cameras.main.width),
                Phaser.Math.Between(0, this.cameras.main.height),
                Phaser.Math.FloatBetween(1, 1.8),
                0xffffff
            );
            star.setAlpha(0.3); // More visible
            star.speed = 2; // Fast movement
            this.starfieldLayers.near.add(star);
        }
        
        // Add twinkling effect to some stars
        this.starfieldLayers.far.getChildren().forEach((star, index) => {
            if (index % 3 === 0) { // Every 3rd star twinkles
                this.tweens.add({
                    targets: star,
                    alpha: 0.8, // Brighter when twinkling
                    duration: Phaser.Math.Between(2500, 5000), // Slightly faster twinkling
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
        
        // Initialize Venus background (hidden initially)
        this.venusBackground = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height + 300, // Start below screen
            'venus_bg'
        );
        this.venusBackground.setScale(1);
        this.venusBackground.setDepth(0); // Same depth as starfield but behind game objects
        this.venusBackground.setVisible(false);
        this.venusBackground.setAlpha(0.6); // More transparency to blend with stars
        console.log('Venus background created:', this.venusBackground);
        console.log('Venus background texture exists:', this.textures.exists('venus_bg'));
        console.log('Venus background initial position:', this.venusBackground.x, this.venusBackground.y);
    }

    updateStarfield(delta) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Update each starfield layer
        Object.values(this.starfieldLayers).forEach(layer => {
            layer.getChildren().forEach(star => {
                // Move stars downward (creating upward flight motion effect)
                star.y += star.speed * (delta / 16); // Normalize by 16ms (60fps)
                
                // Wrap stars around when they go off screen
                if (star.y > height + 10) {
                    star.y = -10;
                    star.x = Phaser.Math.Between(0, width);
                }
            });
        });
        
        // Update Venus background if it's visible and transitioning
        if (this.venusBackground && this.venusBackground.visible && this.backgroundTransitionActive) {
            // The background movement is handled by the tween animation
            // This is just for any additional effects if needed
        }
    }

    setupGroups() {
        this.asteroids = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        this.ufos = this.physics.add.group();
        this.particles = this.add.group();
        this.bossGroup = this.physics.add.group();
        this.bossBullets = this.physics.add.group(); // Separate group for boss bullets
    }

    setupUI() {
        const width = this.cameras.main.width;
        
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        this.livesText = this.add.text(20, 50, 'Lives: 3', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        this.levelText = this.add.text(20, 80, 'Level: 1', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // Power-up timers
        this.setupPowerUpTimers();
        
        // Mobile controls (only show on mobile)
        if (this.sys.game.device.touch) {
            this.setupMobileControls();
        }
    }

    setupPowerUpTimers() {
        const width = this.cameras.main.width;
        
        this.powerUpTimers = {
            rapidFire: this.add.text(width - 200, 20, '', {
                fontSize: '18px',
                fill: '#ffff00'
            }),
            shield: this.add.text(width - 200, 45, '', {
                fontSize: '18px',
                fill: '#00ffff'
            }),
            speedBoost: this.add.text(width - 200, 70, '', {
                fontSize: '18px',
                fill: '#00ff00'
            }),
            strongLaser: this.add.text(width - 200, 95, '', {
                fontSize: '18px',
                fill: '#ff6600'
            }),
            tripleShot: this.add.text(width - 200, 120, '', {
                fontSize: '18px',
                fill: '#ff00ff'
            })
        };
    }

    setupMobileControls() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Joystick area
        const joystickArea = this.add.circle(100, height - 100, 60, 0x4a90e2, 0.3);
        joystickArea.setInteractive();
        
        // Fire button
        const fireButton = this.add.circle(width - 100, height - 100, 50, 0xe74c3c, 0.8);
        fireButton.setInteractive();
        fireButton.on('pointerdown', () => {
            this.isFireKeyPressed = true;
            if (this.canFire && this.spaceship && this.spaceship.canControl && !this.spaceship.entranceAnimationActive && !this.spaceship.rapidFireEndTime) {
                this.spaceship.fire(); // Use spaceship's fire method instead
                this.canFire = false;
            }
        });
        
        fireButton.on('pointerup', () => {
            this.isFireKeyPressed = false;
            this.canFire = true;
        });
        
        this.add.text(width - 100, height - 100, 'FIRE', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    setupAvatarTutorial() {
        try {
            console.log('setupAvatarTutorial called');
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            console.log('Creating avatar tutorial UI elements...');
        
        // Create semi-transparent overlay
        this.avatarOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
        this.avatarOverlay.setOrigin(0);
        this.avatarOverlay.setVisible(false); // Start invisible to avoid dimming the game
        this.avatarOverlay.setInteractive();
        this.avatarOverlay.setDepth(1000); // Set high depth to render on top
        console.log('Overlay created:', this.avatarOverlay);
        console.log('this.avatarOverlay after assignment:', this.avatarOverlay);
        
        // Create avatar sprite (positioned on the left side)
        this.avatarSprite = this.add.image(150, height + 200, 'lady');
        this.avatarSprite.setScale(0.4);
        this.avatarSprite.setVisible(false);
        this.avatarSprite.setDepth(1001); // Set high depth to render on top
        
        // Create text container (positioned to the right of the avatar)
        this.avatarText = this.add.text(350, height - 150, '', {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'left',
            wordWrap: { width: width - 400 }, // Reduced width to avoid overlap
            lineSpacing: 8
        }).setOrigin(0, 0.5); // Left-aligned text
        this.avatarText.setVisible(false);
        this.avatarText.setDepth(1002); // Set high depth to render on top
        
        // Create continue button background
        this.avatarContinueButtonBg = this.add.rectangle(width / 2, height - 50, 200, 50, 0x00ff00, 0.8);
        this.avatarContinueButtonBg.setStrokeStyle(3, 0xffffff);
        this.avatarContinueButtonBg.setVisible(false);
        this.avatarContinueButtonBg.setInteractive();
        this.avatarContinueButtonBg.setDepth(1003); // Set high depth to render on top
        
        // Create continue button text
        this.avatarContinueButton = this.add.text(width / 2, height - 50, 'Continue', {
            fontSize: '24px',
            fill: '#000000',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.avatarContinueButton.setVisible(false);
        this.avatarContinueButton.setDepth(1004); // Set high depth to render on top
        
        // Force add all elements to the scene's display list
        this.add.existing(this.avatarOverlay);
        this.add.existing(this.avatarSprite);
        this.add.existing(this.avatarText);
        this.add.existing(this.avatarContinueButtonBg);
        this.add.existing(this.avatarContinueButton);
        
        console.log('All UI elements explicitly added to scene display list');
        
        // Make both button elements interactive
        this.avatarContinueButtonBg.on('pointerdown', () => {
            this.hideAvatarTutorial();
        });
        this.avatarContinueButton.on('pointerdown', () => {
            this.hideAvatarTutorial();
        });
        
        // Add hover effects
        this.avatarContinueButtonBg.on('pointerover', () => {
            this.avatarContinueButtonBg.setFillStyle(0x00ff00, 1);
            this.avatarContinueButtonBg.setStrokeStyle(3, 0xffff00);
        });
        
        this.avatarContinueButtonBg.on('pointerout', () => {
            this.avatarContinueButtonBg.setFillStyle(0x00ff00, 0.8);
            this.avatarContinueButtonBg.setStrokeStyle(3, 0xffffff);
        });
        
        // Add pulsing effect to continue button
        this.tweens.add({
            targets: [this.avatarContinueButtonBg, this.avatarContinueButton],
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        console.log('Avatar tutorial UI elements created successfully');
        console.log('Final UI elements state:', {
            avatarOverlay: this.avatarOverlay,
            avatarSprite: this.avatarSprite,
            avatarText: this.avatarText,
            avatarContinueButton: this.avatarContinueButton,
            avatarContinueButtonBg: this.avatarContinueButtonBg
        });
        } catch (error) {
            console.error('Error in setupAvatarTutorial:', error);
        }
    }

    showAvatarTutorial(powerUpType) {
        console.log(`showAvatarTutorial called with powerUpType: ${powerUpType}`);
        console.log('Current state:', {
            avatarActive: this.avatarActive,
            explainedPowerUps: Array.from(this.explainedPowerUps),
            hasPowerUpType: this.explainedPowerUps.has(powerUpType)
        });
        
        if (this.avatarActive || this.explainedPowerUps.has(powerUpType)) {
            console.log('Tutorial skipped - already active or already explained');
            return;
        }
        
        console.log('Setting up avatar tutorial...');
        this.avatarActive = true;
        this.explainedPowerUps.add(powerUpType);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Show UI elements BEFORE pausing the scene
        console.log('Showing UI elements before pause...');
        
        // Show overlay
        this.avatarOverlay.setVisible(true);
        console.log('Overlay set visible');
        console.log('Overlay position:', this.avatarOverlay.x, this.avatarOverlay.y);
        console.log('Overlay size:', this.avatarOverlay.width, this.avatarOverlay.height);
        console.log('Overlay visible:', this.avatarOverlay.visible);
        console.log('Overlay alpha:', this.avatarOverlay.alpha);
        console.log('Overlay depth:', this.avatarOverlay.depth);
        
        // Show avatar with slide-in animation (from left side)
        this.avatarSprite.setVisible(true);
        this.avatarSprite.setPosition(150, height + 200);
        console.log('Avatar sprite visible:', this.avatarSprite.visible);
        console.log('Avatar sprite position:', this.avatarSprite.x, this.avatarSprite.y);
        console.log('Avatar sprite depth:', this.avatarSprite.depth);
        
        // Show text with fade-in
        this.avatarText.setVisible(true);
        this.avatarText.setAlpha(0);
        this.avatarText.setText(this.getPowerUpExplanation(powerUpType));
        console.log('Avatar text visible:', this.avatarText.visible);
        console.log('Avatar text position:', this.avatarText.x, this.avatarText.y);
        console.log('Avatar text depth:', this.avatarText.depth);
        console.log('Avatar text content:', this.avatarText.text);
        
        // Show continue button with delay
        this.avatarContinueButtonBg.setVisible(true);
        this.avatarContinueButton.setVisible(true);
        this.avatarContinueButtonBg.setAlpha(0);
        this.avatarContinueButton.setAlpha(0);
        console.log('Continue button visible:', this.avatarContinueButton.visible);
        console.log('Continue button position:', this.avatarContinueButton.x, this.avatarContinueButton.y);
        console.log('Continue button depth:', this.avatarContinueButton.depth);
        console.log('Continue button text:', this.avatarContinueButton.text);
        
        console.log('UI elements state after showing:', {
            avatarOverlay: this.avatarOverlay,
            avatarSprite: this.avatarSprite,
            avatarText: this.avatarText,
            avatarContinueButton: this.avatarContinueButton,
            avatarContinueButtonBg: this.avatarContinueButtonBg
        });
        
        // Check if elements are in the scene's display list
        console.log('Display list check:');
        console.log('Overlay in display list:', this.children.list.includes(this.avatarOverlay));
        console.log('Avatar sprite in display list:', this.children.list.includes(this.avatarSprite));
        console.log('Avatar text in display list:', this.children.list.includes(this.avatarText));
        console.log('Continue button in display list:', this.children.list.includes(this.avatarContinueButton));
        console.log('Continue button bg in display list:', this.children.list.includes(this.avatarContinueButtonBg));
        
        // Add animations AFTER showing elements
        this.tweens.add({
            targets: this.avatarSprite,
            y: height - 100, // Keep same vertical position
            duration: 800,
            ease: 'Power2'
        });
        
        this.tweens.add({
            targets: this.avatarText,
            alpha: 1,
            duration: 500,
            delay: 400
        });
        
        this.tweens.add({
            targets: [this.avatarContinueButtonBg, this.avatarContinueButton],
            alpha: 1,
            duration: 300,
            delay: 800,
            onComplete: () => {
                // Game is already paused by avatarActive flag in update method
                console.log('Continue button animation complete, game paused by avatarActive flag');
            }
        });
        
        // Force a render update to ensure UI elements are visible
        this.events.emit('render');
        console.log('Forced render update after showing UI elements');
        
        // Highlight the power-up
        this.highlightPowerUp(powerUpType);
    }

    hideAvatarTutorial() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Slide out avatar to the left
        this.tweens.add({
            targets: this.avatarSprite,
            x: -200, // Slide out to the left
            duration: 600,
            ease: 'Power2'
        });
        
        // Fade out text and button
        this.tweens.add({
            targets: [this.avatarText, this.avatarContinueButtonBg, this.avatarContinueButton],
            alpha: 0,
            duration: 300,
            ease: 'Power2'
        });
        
        // Fade out overlay
        this.tweens.add({
            targets: this.avatarOverlay,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                this.avatarOverlay.setVisible(false);
                this.avatarSprite.setVisible(false);
                this.avatarText.setVisible(false);
                this.avatarContinueButtonBg.setVisible(false);
                this.avatarContinueButton.setVisible(false);
                this.avatarActive = false;
                
                // Reset overlay alpha
                this.avatarOverlay.setAlpha(0.5);
                
                // Game will resume automatically when avatarActive is set to false
                console.log('Avatar tutorial hidden, game will resume');
            }
        });
        
        // Remove power-up highlight
        this.removePowerUpHighlight();
    }
    
    startVenusBackgroundTransition() {
        if (this.backgroundTransitionActive) return;
        
        console.log('Starting Venus background transition for level:', this.gameData.level);
        this.backgroundTransitionActive = true;
        
        // Play Venus lady voice
        this.playSound('venus_lady', 0.8);
        
        // Show Venus background
        if (this.venusBackground) {
            console.log('Venus background found, making visible');
            this.venusBackground.setVisible(true);
            this.venusBackground.setDepth(0); // Same depth as starfield but behind game objects
            console.log('Venus background position:', this.venusBackground.x, this.venusBackground.y);
            console.log('Venus background visible:', this.venusBackground.visible);
            console.log('Venus background depth:', this.venusBackground.depth);
        } else {
            console.error('Venus background not found!');
        }
        
        // Make starfield slightly more transparent to show Venus background
        Object.values(this.starfieldLayers).forEach(layer => {
            layer.getChildren().forEach(star => {
                this.tweens.add({
                    targets: star,
                    alpha: 0.7, // Keep stars more visible (70% instead of 30%)
                    duration: 1000,
                    ease: 'Power2'
                });
            });
        });
        
        // Start engine boost effect
        this.startEngineBoostEffect();
        
        // Animate Venus background moving up
        this.tweens.add({
            targets: this.venusBackground,
            y: this.cameras.main.height / 2,
            duration: 4000, // 4 seconds to reach position
            ease: 'Power2',
            onComplete: () => {
                this.backgroundTransitionActive = false;
                this.stopEngineBoostEffect();
                
                // Restore stars to full brightness
                Object.values(this.starfieldLayers).forEach(layer => {
                    layer.getChildren().forEach(star => {
                        this.tweens.add({
                            targets: star,
                            alpha: 1.0, // Full brightness
                            duration: 500,
                            ease: 'Power2'
                        });
                    });
                });
                
                console.log('Venus background transition complete');
            }
        });
    }
    
    startEngineBoostEffect() {
        this.engineBoostActive = true;
        
        // Create intense engine boost particles
        const boostTimer = this.time.addEvent({
            delay: 50, // Every 50ms
            callback: () => {
                if (!this.engineBoostActive || !this.spaceship) return;
                
                // Create multiple boost particles
                for (let i = 0; i < 8; i++) {
                    const particle = this.add.circle(
                        this.spaceship.x + Phaser.Math.Between(-15, 15),
                        this.spaceship.y + 20 + Phaser.Math.Between(0, 10),
                        Phaser.Math.FloatBetween(2, 6),
                        0xff6600
                    );
                    
                    // Add glow effect
                    particle.setStrokeStyle(2, 0xffff00);
                    
                    // Animate particle
                    this.tweens.add({
                        targets: particle,
                        y: particle.y + 60,
                        x: particle.x + Phaser.Math.Between(-20, 20),
                        scale: 0,
                        alpha: 0,
                        duration: Phaser.Math.Between(300, 600),
                        ease: 'Power2',
                        onComplete: () => {
                            if (particle && particle.active) {
                                particle.destroy();
                            }
                        }
                    });
                }
                
                // Create additional smaller particles
                for (let i = 0; i < 15; i++) {
                    const smallParticle = this.add.circle(
                        this.spaceship.x + Phaser.Math.Between(-10, 10),
                        this.spaceship.y + 25 + Phaser.Math.Between(0, 15),
                        Phaser.Math.FloatBetween(1, 3),
                        0xffff00
                    );
                    
                    this.tweens.add({
                        targets: smallParticle,
                        y: smallParticle.y + 40,
                        x: smallParticle.x + Phaser.Math.Between(-15, 15),
                        scale: 0,
                        alpha: 0,
                        duration: Phaser.Math.Between(200, 400),
                        ease: 'Power2',
                        onComplete: () => {
                            if (smallParticle && smallParticle.active) {
                                smallParticle.destroy();
                            }
                        }
                    });
                }
            },
            loop: true
        });
        
        // Store timer for cleanup
        this.engineBoostTimer = boostTimer;
    }
    
    stopEngineBoostEffect() {
        this.engineBoostActive = false;
        
        if (this.engineBoostTimer) {
            this.engineBoostTimer.destroy();
            this.engineBoostTimer = null;
        }
    }

    getPowerUpExplanation(powerUpType) {
        switch (powerUpType) {
            case 'health':
                return "❤️ Hey! I'm Skyler! 👋\n\nYou found a health power-up! This red heart restores one life to your ship. Save it for when you're low on health! 💔";
            case 'rapidFire':
                return "🔥 OMG! I'm Skyler! 👋\n\nRapid fire power-up! Your ship will fire bullets automatically at high speed. Perfect for clearing asteroid waves! 💪";
            case 'shield':
                return "🛡️ Hey! Skyler here! 👋\n\nShield power-up! You'll be invincible for a short time with a protective halo around your ship! ✨";
            case 'tripleShot':
                return "🔱 Hello! I'm Skyler! 👋\n\nTriple shot power-up! Fire three bullets in a spread pattern instead of one. Great for hitting multiple targets! 🔫";
            case 'speedBoost':
                return "🛼 Yo! Skyler here! 👋\n\nSpeed boost power-up! Your ship will zoom around faster, perfect for dodging asteroids! 😄";
            case 'strongLaser':
                return "💪 Hey! I'm Skyler! 👋\n\nStrong laser power-up! Your bullets can punch through small asteroids and destroy large ones instantly! 💥";
            default:
                return "Hey! Skyler here! 👋\n\nYou found a mysterious power-up! Even I'm not sure what this one does! ✨";
        }
    }

    highlightPowerUp(powerUpType) {
        // Find all power-ups of this type and add a highlight effect
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp.getType() === powerUpType) {
                // Add a bright glow effect
                powerUp.setTint(0xffffff);
                powerUp.setAlpha(1);
                
                // Add pulsing effect
                this.tweens.add({
                    targets: powerUp,
                    scale: 1.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    removePowerUpHighlight() {
        // Remove highlight effects from all power-ups
        this.powerUps.getChildren().forEach(powerUp => {
            powerUp.clearTint();
            powerUp.setAlpha(0.8);
            this.tweens.killTweensOf(powerUp);
            powerUp.setScale(1);
        });
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // WASD keys
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Fire control flags
        this.canFire = true;
        this.isFireKeyPressed = false;
        
        // Set up fire events
        this.input.keyboard.on('keydown-SPACE', () => {
            // Check if avatar tutorial is active first
            if (this.avatarActive) {
                this.hideAvatarTutorial();
                return;
            }
            
            this.isFireKeyPressed = true;
            if (this.canFire && this.spaceship && this.spaceship.canControl && !this.spaceship.entranceAnimationActive && !this.spaceship.rapidFireEndTime && !this.spaceship.isDead) {
                this.spaceship.fire(); // Use spaceship's fire method instead
                this.canFire = false;
            }
        });
        
        // Reset fire flag when key is released
        this.input.keyboard.on('keyup-SPACE', () => {
            this.isFireKeyPressed = false;
            this.canFire = true;
        });
        
        // Add V key for testing Venus background
        this.input.keyboard.on('keydown-V', () => {
            console.log('V key pressed - testing Venus background');
            this.startVenusBackgroundTransition();
        });
    }

    setupCollisions() {
        // Only set up collisions if entities exist
        if (this.spaceship && this.asteroids && this.bullets && this.powerUps) {
            // Spaceship vs Asteroids
            this.physics.add.overlap(this.spaceship, this.asteroids, this.handleSpaceshipAsteroidCollision, null, this);
            
            // Bullets vs Asteroids - use overlap but handle strong laser specially
            this.physics.add.overlap(this.bullets, this.asteroids, this.handleBulletAsteroidCollision, null, this);
            
            // Spaceship vs PowerUps
            this.physics.add.overlap(this.spaceship, this.powerUps, this.handleSpaceshipPowerUpCollision, null, this);
            
            // UFO collisions (only if UFOs exist)
            if (this.ufos) {
                // Spaceship vs UFOs
                this.physics.add.overlap(this.spaceship, this.ufos, this.handleSpaceshipUFOCollision, null, this);
                
                // Bullets vs UFOs
                this.physics.add.overlap(this.bullets, this.ufos, this.handleBulletUFOCollision, null, this);
            }
            
            // Boss collisions (only if boss exists)
            if (this.bossGroup) {
                // Bullets vs Boss
                this.physics.add.overlap(this.bullets, this.bossGroup, this.handleBulletBossCollision, null, this);
            }
            
            // Boss bullets vs Spaceship (only if boss bullets exist)
            if (this.bossBullets) {
                this.physics.add.overlap(this.spaceship, this.bossBullets, this.handleSpaceshipBossBulletCollision, null, this);
            }
            
            // Bullets vs Boss Bullets (only if boss bullets exist)
            if (this.bossBullets) {
                this.physics.add.overlap(this.bullets, this.bossBullets, this.handleBulletBossBulletCollision, null, this);
            }
        }
    }

    setupAudio() {
        // Audio is already set up in BootScene
        console.log('Audio setup - checking audio context...');
        console.log('Sound manager state:', this.sound);
        console.log('Available sounds in cache:', Object.keys(this.cache.audio.entries));
        
        // Test if audio is working by playing a short sound
        this.time.delayedCall(2000, () => {
            console.log('Testing audio system with a test sound...');
            this.playSound('laser_standard', 0.05);
        });
    }

    spawnSpaceship() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create spaceship at bottom of screen (off-screen)
        this.spaceship = new Spaceship(this, width / 2, height + 100);
        
        // Disable player control during entrance animation
        this.spaceship.entranceAnimationActive = true;
        this.spaceship.canControl = false;
        
        // Set initial velocity (fast upward movement)
        this.spaceship.setVelocity(0, -400);
        
        // Create rocket burst effect
        this.createRocketBurstEffect();
        
        // Start entrance animation
        this.startSpaceshipEntrance();
    }

    createRocketBurstEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create multiple rocket burst particles
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                width / 2 + Phaser.Math.Between(-20, 20),
                height + 80 + Phaser.Math.Between(0, 40),
                Phaser.Math.FloatBetween(2, 6),
                0xff6600
            );
            
            // Add glow effect
            particle.setStrokeStyle(2, 0xffff00);
            
            // Animate particle
            this.tweens.add({
                targets: particle,
                y: height + 200,
                x: particle.x + Phaser.Math.Between(-30, 30),
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
        
        // Create additional smaller particles for more intense effect
        for (let i = 0; i < 25; i++) {
            const smallParticle = this.add.circle(
                width / 2 + Phaser.Math.Between(-15, 15),
                height + 90 + Phaser.Math.Between(0, 30),
                Phaser.Math.FloatBetween(1, 3),
                0xffff00
            );
            
            this.tweens.add({
                targets: smallParticle,
                y: height + 150,
                x: smallParticle.x + Phaser.Math.Between(-20, 20),
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(200, 400),
                ease: 'Power2',
                onComplete: () => {
                    if (smallParticle && smallParticle.active) {
                        smallParticle.destroy();
                    }
                }
            });
        }
    }

    startSpaceshipEntrance() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const targetY = height - 100; // Final position
        
        // Create continuous rocket burst effect during movement
        const rocketBurstTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.spaceship && this.spaceship.entranceAnimationActive) {
                    this.createContinuousRocketBurst();
                }
            },
            loop: true
        });
        
        // Main entrance animation
        this.tweens.add({
            targets: this.spaceship,
            y: targetY,
            duration: 3000, // 3 seconds total
            ease: 'Power2',
            onUpdate: (tween) => {
                // Gradually slow down the ship
                const progress = tween.progress;
                const currentVelocity = -400 * (1 - progress * 0.8); // Slow down to 20% of initial speed
                this.spaceship.setVelocity(0, currentVelocity);
            },
            onComplete: () => {
                // Stop the ship
                this.spaceship.setVelocity(0, 0);
                
                // Stop rocket burst effect
                rocketBurstTimer.destroy();
                
                // Create final landing effect
                this.createLandingEffect();
                
                // Enable player control
                this.spaceship.entranceAnimationActive = false;
                this.spaceship.canControl = true;
                
                // Start spawning asteroids and other game elements
                this.spawnInitialAsteroids();
                
                console.log('Spaceship entrance animation complete - player control enabled');
            }
        });
    }

    createContinuousRocketBurst() {
        if (!this.spaceship) return;
        
        // Create rocket burst particles behind the ship
        for (let i = 0; i < 3; i++) {
            const particle = this.add.circle(
                this.spaceship.x + Phaser.Math.Between(-8, 8),
                this.spaceship.y + 20 + Phaser.Math.Between(0, 10),
                Phaser.Math.FloatBetween(1, 3),
                0xff6600
            );
            
            this.tweens.add({
                targets: particle,
                y: particle.y + 30,
                x: particle.x + Phaser.Math.Between(-5, 5),
                scale: 0,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
    }

    createLandingEffect() {
        if (!this.spaceship) return;
        
        // Create landing impact effect
        for (let i = 0; i < 20; i++) {
            const impactParticle = this.add.circle(
                this.spaceship.x + Phaser.Math.Between(-25, 25),
                this.spaceship.y + 15 + Phaser.Math.Between(0, 20),
                Phaser.Math.FloatBetween(1, 4),
                0x00ffff
            );
            
            this.tweens.add({
                targets: impactParticle,
                y: impactParticle.y + Phaser.Math.Between(20, 40),
                x: impactParticle.x + Phaser.Math.Between(-15, 15),
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2',
                onComplete: () => {
                    if (impactParticle && impactParticle.active) {
                        impactParticle.destroy();
                    }
                }
            });
        }
        
        // Create a brief flash effect around the ship
        const flash = this.add.circle(
            this.spaceship.x,
            this.spaceship.y,
            40,
            0x00ffff,
            0.3
        );
        
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                if (flash && flash.active) {
                    flash.destroy();
                }
            }
        });
    }

    spawnInitialAsteroids() {
        const count = 5 + Math.floor(this.gameData.level / 2);
        
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid();
        }
    }

    spawnAsteroid() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        let x, y;
        const side = Phaser.Math.Between(0, 2); // Only 3 sides: top, left, right
        
        switch (side) {
            case 0: // Top
                x = Phaser.Math.Between(0, width);
                y = -50;
                break;
            case 1: // Right
                x = width + 50;
                y = Phaser.Math.Between(0, height);
                break;
            case 2: // Left
                x = -50;
                y = Phaser.Math.Between(0, height);
                break;
        }
        
        const sizes = ['large', 'medium', 'small'];
        const size = sizes[Phaser.Math.Between(0, 2)];
        
        const asteroid = new Asteroid(this, x, y, size);
        this.asteroids.add(asteroid);
        
        // Set velocity towards center
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = Phaser.Math.Angle.Between(x, y, centerX, centerY);
        const speed = Phaser.Math.Between(50, 150) * (1 + this.gameData.level * 0.1);
        
        asteroid.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    spawnPowerUp() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(50, height - 50);
        
        const powerUp = new PowerUp(this, x, y);
        this.powerUps.add(powerUp);
        
        // Get power-up type
        const powerUpType = powerUp.getType();
        
        // Check if this power-up type has been explained before
        if (this.explainedPowerUps.has(powerUpType)) {
            // Play item_appear sound for subsequent appearances
            this.playSound('item_appear', 0.6);
        } else {
            // Play avatar tutorial sound for first appearance
            if (powerUpType === 'health') {
                this.playSound('skyler_heart', 0.8);
            } else if (powerUpType === 'rapidFire') {
                this.playSound('skyler_rapidfire', 0.8);
            } else if (powerUpType === 'shield') {
                this.playSound('skyler_shield', 0.8);
            } else if (powerUpType === 'tripleShot') {
                this.playSound('skyler_trippleshot', 0.8);
            } else if (powerUpType === 'speedBoost') {
                this.playSound('skyler_speed', 0.8);
            } else if (powerUpType === 'strongLaser') {
                this.playSound('skyler_stronglaser', 0.8);
            } else if (powerUpType === 'napalmBomb') {
                this.playSound('skyler_mysterious', 0.8);
            } else if (powerUpType === 'supportShips') {
                this.playSound('skyler_mysterious', 0.8);
            }
        }
        
        // Show avatar tutorial for new power-up types
        if (!this.explainedPowerUps.has(powerUpType)) {
            // Delay the tutorial slightly to let the power-up appear first
            this.time.delayedCall(500, () => {
                this.showAvatarTutorial(powerUpType);
            });
        }
        
        // Check for existing power-ups on first spawn
        if (this.powerUps.getChildren().length === 1) {
            this.checkExistingPowerUpsForTutorial();
        }
    }

    spawnUFO() {
        if (this.gameData.level < 2) return; // Only spawn UFOs from stage 2
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Spawn UFOs from top of screen for zig-zag movement
        const x = Phaser.Math.Between(50, width - 50);
        const y = -50; // Start above the screen
        
        const ufo = new UFO(this, x, y);
        this.ufos.add(ufo);
    }

    // fireBullet() method removed - now using spaceship.fire() instead

    playSound(key, volume = 1.0) {
        try {
            console.log(`Attempting to play sound: ${key} at volume ${volume}`);
            if (this.cache.audio.exists(key)) {
                console.log(`Sound ${key} exists in cache, playing...`);
                const sound = this.sound.play(key, { volume });
                if (sound) {
                    sound.once('complete', () => {
                        console.log(`Sound ${key} completed playing`);
                    });
                    sound.once('error', (error) => {
                        console.log(`Sound ${key} error:`, error);
                    });
                }
            } else {
                console.log(`Sound ${key} not found in cache`);
            }
        } catch (error) {
            console.log(`Audio file '${key}' not available:`, error);
        }
    }

    playAsteroidBlastSound(size) {
        switch (size) {
            case 'large':
                this.playSound('asteroid_large_blast', 0.6);
                break;
            case 'medium':
                this.playSound('asteroid_medium_blast', 0.5);
                break;
            case 'small':
                this.playSound('asteroid_small_blast', 0.4);
                break;
            default:
                this.playSound('explosion', 0.4);
        }
    }

    update(time, delta) {
        if (!this.spaceship || this.spaceship.isDead) return;
        
        // Pause game during avatar tutorial
        if (this.avatarActive) {
            // Only update starfield during avatar tutorial
            this.updateStarfield(delta);
            return;
        }
        
        // Update the spaceship (this handles invulnerability timer, etc.)
        this.spaceship.update(time, delta);
        
        // Update starfield movement
        this.updateStarfield(delta);
        
        // Update spawn timers (only if not in boss stage)
        if (!this.bossStage) {
            this.asteroidSpawnTimer += delta;
            this.powerUpSpawnTimer += delta;
            this.ufoSpawnTimer += delta;
            
            // Spawn new asteroids
            if (this.asteroidSpawnTimer >= this.asteroidSpawnInterval) {
                this.spawnAsteroid();
                this.asteroidSpawnTimer = 0;
            }
            
            // Spawn power-ups
            if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
                this.spawnPowerUp();
                this.powerUpSpawnTimer = 0;
            }
            
            // Spawn UFOs (only from stage 2)
            if (this.gameData.level >= 2 && this.ufoSpawnTimer >= this.ufoSpawnInterval) {
                this.spawnUFO();
                this.ufoSpawnTimer = 0;
                
                // Increase UFO spawn frequency with level (more generous for stages 6-10)
                if (this.gameData.level >= 6 && this.gameData.level <= 10) {
                    // Gentler UFO spawn rate for Venus stages
                    this.ufoSpawnInterval = Math.max(6000, 10000 - (this.gameData.level - 6) * 400);
                } else if (this.gameData.level >= 4) {
                    // More aggressive spawn rate after stage 4 (but not for Venus stages)
                    this.ufoSpawnInterval = Math.max(2000, 8000 - (this.gameData.level - 4) * 800);
                } else {
                    // Normal spawn rate for stages 2-3
                    this.ufoSpawnInterval = Math.max(5000, 10000 - (this.gameData.level - 2) * 500);
                }
            }
        }
        
        // Update all asteroids for rotation
        this.asteroids.getChildren().forEach(asteroid => {
            if (asteroid && asteroid.update) {
                asteroid.update(time, delta);
            }
        });
        
        // Update all bullets
        this.bullets.getChildren().forEach(bullet => {
            if (bullet && bullet.update) {
                bullet.update(time, delta);
            }
        });
        
        // Update all power-ups
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp && powerUp.update) {
                powerUp.update(time, delta);
            }
        });
        
        // Update all UFOs
        this.ufos.getChildren().forEach(ufo => {
            if (ufo && ufo.update) {
                ufo.update(time, delta);
            }
        });
        
        // Update boss bullets
        if (this.bossBullets) {
            this.bossBullets.getChildren().forEach(bullet => {
                if (bullet && bullet.update) {
                    bullet.update(time, delta);
                }
            });
        }
        
        // Update boss
        if (this.boss && this.boss.update) {
            this.boss.update(time, delta);
        }
        
        // Handle input
        this.handleInput();
        
        // Handle auto-fire for rapid fire power-up
        this.handleAutoFire(time, delta);
        
        // Update UI
        this.updateUI();
        
        // Game over is handled in collision handlers to ensure sound plays at the right time
    }

    handleInput() {
        if (!this.spaceship || this.spaceship.isDead) return;
        
        // Don't handle input during entrance animation
        if (this.spaceship.entranceAnimationActive || !this.spaceship.canControl) return;
        
        let velocityX = 0;
        let velocityY = 0;
        const speed = this.spaceship.maxSpeed; // Use spaceship's current max speed
        
        // Check cursor keys
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = speed;
        }
        
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = speed;
        }
        
        this.spaceship.setVelocity(velocityX, velocityY);
    }

    handleAutoFire(time, delta) {
        if (!this.spaceship || this.spaceship.isDead) return;
        
        // Don't auto-fire during entrance animation
        if (this.spaceship.entranceAnimationActive || !this.spaceship.canControl) return;
        
        // Check if rapid fire is active
        if (this.spaceship.rapidFireEndTime && this.spaceship.rapidFireEndTime > time) {
            // Auto-fire when rapid fire is active
            this.spaceship.fire();
        }
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.gameData.score}`);
        this.livesText.setText(`Lives: ${this.gameData.lives}`);
        this.levelText.setText(`Level: ${this.gameData.level}`);
        
        // Update power-up timers
        this.updatePowerUpTimers();
    }

    updatePowerUpTimers() {
        if (!this.spaceship || !this.powerUpTimers) return;
        
        const currentTime = this.time.now;
        
        // Rapid Fire Timer
        if (this.spaceship.rapidFireEndTime && this.spaceship.rapidFireEndTime > currentTime) {
            const remaining = Math.ceil((this.spaceship.rapidFireEndTime - currentTime) / 1000);
            this.powerUpTimers.rapidFire.setText(`🔥 Rapid Fire: ${remaining}s`);
            this.powerUpTimers.rapidFire.setVisible(true);
        } else {
            this.powerUpTimers.rapidFire.setVisible(false);
        }
        
        // Shield Timer
        if (this.spaceship.shieldEndTime && this.spaceship.shieldEndTime > currentTime) {
            const remaining = Math.ceil((this.spaceship.shieldEndTime - currentTime) / 1000);
            this.powerUpTimers.shield.setText(`🛡️ Shield: ${remaining}s`);
            this.powerUpTimers.shield.setVisible(true);
        } else {
            this.powerUpTimers.shield.setVisible(false);
        }
        
        // Speed Boost Timer
        if (this.spaceship.speedBoostEndTime && this.spaceship.speedBoostEndTime > currentTime) {
            const remaining = Math.ceil((this.spaceship.speedBoostEndTime - currentTime) / 1000);
            this.powerUpTimers.speedBoost.setText(`🛼 Speed: ${remaining}s`);
            this.powerUpTimers.speedBoost.setVisible(true);
        } else {
            this.powerUpTimers.speedBoost.setVisible(false);
        }
        
        // Strong Laser Timer
        if (this.spaceship.strongLaserEndTime && this.spaceship.strongLaserEndTime > currentTime) {
            const remaining = Math.ceil((this.spaceship.strongLaserEndTime - currentTime) / 1000);
            this.powerUpTimers.strongLaser.setText(`💪 Strong Laser: ${remaining}s`);
            this.powerUpTimers.strongLaser.setVisible(true);
        } else {
            this.powerUpTimers.strongLaser.setVisible(false);
        }
        
        // Triple Shot Timer
        if (this.spaceship.tripleShotEndTime && this.spaceship.tripleShotEndTime > currentTime) {
            const remaining = Math.ceil((this.spaceship.tripleShotEndTime - currentTime) / 1000);
            this.powerUpTimers.tripleShot.setText(`🔱 Triple Shot: ${remaining}s`);
            this.powerUpTimers.tripleShot.setVisible(true);
        } else {
            this.powerUpTimers.tripleShot.setVisible(false);
        }
    }

    handleSpaceshipAsteroidCollision(spaceship, asteroid) {
        if (!spaceship || !asteroid || spaceship.isDead || asteroid.isDead) return;
        
        // Check if shield is active
        if (spaceship.shieldActive) {
            // Shield absorbs the hit - no damage taken
            asteroid.destroy();
            this.playSound('powerup', 0.3); // Play shield absorb sound
            this.createShieldAbsorbEffect(spaceship.x, spaceship.y);
            return;
        }
        
        spaceship.takeDamage();
        asteroid.destroy();
        
        // Update game lives to match ship health
        this.gameData.lives = spaceship.getHealth();
        this.game.registry.set('gameData', this.gameData);
        
        console.log(`Ship hit by asteroid! Lives remaining: ${this.gameData.lives}`);
        
        this.playSound('blast', 0.6);
        this.createExplosion(spaceship.x, spaceship.y);
        
        if (this.gameData.lives <= 0) {
            this.playSound('ship_destroyed', 0.7);
            this.gameOver();
        }
    }

    handleBulletAsteroidCollision(bullet, asteroid) {
        if (!bullet || !asteroid || bullet.isDead || asteroid.isDead) return;
        
        // Handle strong laser behavior
        if (bullet.isStrongLaser) {
            console.log(`Strong laser hit ${asteroid.size} asteroid`);
            
            // Strong laser destroys large asteroids instantly
            if (bullet.shouldDestroyLargeAsteroid(asteroid)) {
                console.log('Strong laser destroying large asteroid instantly');
                bullet.destroy();
                asteroid.destroy();
                
                this.gameData.score += asteroid.getScoreValue();
                this.game.registry.set('gameData', this.gameData);
                
                // Play different blast sound based on asteroid size
                this.playAsteroidBlastSound(asteroid.size);
                this.createExplosion(asteroid.x, asteroid.y);
                
                // Check for level up
                if (this.gameData.score >= this.gameData.level * 1000) {
                    this.levelUp();
                }
            }
            // Strong laser passes through small and medium asteroids
            else if (bullet.canPassThrough(asteroid)) {
                console.log(`Strong laser passing through ${asteroid.size} asteroid`);
                
                // Store current velocity before taking damage
                const currentVelocityX = asteroid.body.velocity.x;
                const currentVelocityY = asteroid.body.velocity.y;
                
                asteroid.takeDamage();
                
                // Restore velocity to prevent stopping
                if (asteroid.active && !asteroid.isDead) {
                    asteroid.setVelocity(currentVelocityX, currentVelocityY);
                }
                
                if (asteroid.isDead) {
                    this.gameData.score += asteroid.getScoreValue();
                    this.game.registry.set('gameData', this.gameData);
                    
                    // Play different blast sound based on asteroid size
                    this.playAsteroidBlastSound(asteroid.size);
                    this.createExplosion(asteroid.x, asteroid.y);
                    
                    // Check for level up
                    if (this.gameData.score >= this.gameData.level * 1000) {
                        this.levelUp();
                    }
                }
                // Bullet continues flying (doesn't get destroyed)
                console.log('Strong laser bullet continues flying');
                
                // Don't destroy the bullet - let it continue flying through
                // The bullet will naturally continue its trajectory
            }
        } else {
            // Normal bullet behavior
            bullet.destroy();
            asteroid.takeDamage();
            
            if (asteroid.isDead) {
                this.gameData.score += asteroid.getScoreValue();
                this.game.registry.set('gameData', this.gameData);
                
                // Play different blast sound based on asteroid size
                this.playAsteroidBlastSound(asteroid.size);
                this.createExplosion(asteroid.x, asteroid.y);
                
                // Check for level up
                if (this.gameData.score >= this.gameData.level * 1000) {
                    this.levelUp();
                }
            }
        }
    }

    handleSpaceshipPowerUpCollision(spaceship, powerUp) {
        if (!spaceship || !powerUp || spaceship.isDead || powerUp.isDead) return;
        
        // Store position before applying (since powerUp will be destroyed)
        const powerUpX = powerUp.x;
        const powerUpY = powerUp.y;
        
        powerUp.apply(spaceship);
        
        this.playSound('item_collected', 0.6);
        this.createPowerUpEffect(powerUpX, powerUpY);
    }

    handleSpaceshipUFOCollision(spaceship, ufo) {
        if (!spaceship || !ufo || spaceship.isDead || ufo.isDead) return;
        
        // Check if shield is active
        if (spaceship.shieldActive) {
            // Shield absorbs the hit - no damage taken
            ufo.destroy();
            this.playSound('powerup', 0.3); // Play shield absorb sound
            this.createShieldAbsorbEffect(spaceship.x, spaceship.y);
            return;
        }
        
        spaceship.takeDamage();
        ufo.destroy();
        
        // Update game lives to match ship health
        this.gameData.lives = spaceship.getHealth();
        this.game.registry.set('gameData', this.gameData);
        
        console.log(`Ship hit by UFO! Lives remaining: ${this.gameData.lives}`);
        
        this.playSound('blast', 0.6);
        this.createExplosion(spaceship.x, spaceship.y);
        
        if (this.gameData.lives <= 0) {
            this.playSound('ship_destroyed', 0.7);
            this.gameOver();
        }
    }

    handleBulletUFOCollision(bullet, ufo) {
        if (!bullet || !ufo || bullet.isDead || ufo.isDead) return;
        
        // Handle strong laser behavior with UFOs
        if (bullet.isStrongLaser) {
            // Strong laser destroys UFOs instantly
            bullet.destroy();
            ufo.destroy();
            
            this.gameData.score += ufo.getScoreValue();
            this.game.registry.set('gameData', this.gameData);
            
            // Play UFO blast sound
            this.playSound('ufo_blast', 0.5);
            this.createExplosion(ufo.x, ufo.y);
            
            // Check for level up
            if (this.gameData.score >= this.gameData.level * 1000) {
                this.levelUp();
            }
        } else {
            // Normal bullet behavior
            bullet.destroy();
            ufo.takeDamage();
            
            if (ufo.isDead) {
                this.gameData.score += ufo.getScoreValue();
                this.game.registry.set('gameData', this.gameData);
                
                // Play UFO blast sound
                this.playSound('ufo_blast', 0.5);
                this.createExplosion(ufo.x, ufo.y);
                
                // Check for level up
                if (this.gameData.score >= this.gameData.level * 1000) {
                    this.levelUp();
                }
            }
        }
    }

    handleBulletBossCollision(bullet, boss) {
        if (!bullet || !boss || bullet.isDead || boss.isDead) return;
        
        // Destroy the bullet
        bullet.destroy();
        
        // Deal damage to boss
        boss.takeDamage(1);
        
        // Add score for hitting boss
        this.gameData.score += 10;
        this.game.registry.set('gameData', this.gameData);
    }
    
    handleSpaceshipBossBulletCollision(spaceship, bossBullet) {
        if (!spaceship || !bossBullet || spaceship.isDead || bossBullet.isDead) return;
        
        // Destroy boss bullet
        bossBullet.destroy();
        
        // Check if spaceship has shield
        if (spaceship.hasShield) {
            // Create shield absorb effect
            this.createShieldAbsorbEffect(spaceship.x, spaceship.y);
            this.playSound('shield_absorb', 0.4);
            return; // Shield protects from damage
        }
        
        // Spaceship takes damage
        spaceship.takeDamage();
        
        // Update game lives to match ship health
        this.gameData.lives = spaceship.getHealth();
        this.game.registry.set('gameData', this.gameData);
        
        console.log(`Ship hit by boss bullet! Lives remaining: ${this.gameData.lives}`);
        
        // Create explosion effect
        this.createExplosion(spaceship.x, spaceship.y);
        
        // Play sound
        this.playSound('blast', 0.6);
        
        // Check if game over
        if (this.gameData.lives <= 0) {
            this.playSound('ship_destroyed', 0.7);
            this.gameOver();
        }
    }
    
    handleBulletBossBulletCollision(bullet, bossBullet) {
        if (!bullet || !bossBullet || bullet.isDead || bossBullet.isDead) return;
        
        // Destroy player bullet
        bullet.destroy();
        
        // Destroy boss bullet
        bossBullet.takeDamage();
        
        // Add score
        this.gameData.score += bossBullet.getScoreValue();
        this.game.registry.set('gameData', this.gameData);
    }

    createExplosion(x, y) {
        // Create simple explosion effect without particles for now
        // Create multiple small circles that fade out
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-20, 20),
                Phaser.Math.FloatBetween(1, 3),
                0xff4500
            );
            
            this.tweens.add({
                targets: particle,
                scale: 0,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    createPowerUpEffect(x, y) {
        // Create simple power-up effect without particles
        for (let i = 0; i < 5; i++) {
            const sparkle = this.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1, 2),
                0x00ff00
            );
            
            this.tweens.add({
                targets: sparkle,
                scale: 0,
                alpha: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }
    }

    createShieldAbsorbEffect(x, y) {
        // Create shield absorb effect
        for (let i = 0; i < 8; i++) {
            const sparkle = this.add.circle(
                x + Phaser.Math.Between(-15, 15),
                y + Phaser.Math.Between(-15, 15),
                Phaser.Math.FloatBetween(1, 3),
                0x00ffff
            );
            
            this.tweens.add({
                targets: sparkle,
                scale: 0,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }
        
        // Create shield ripple effect
        const ripple = this.add.circle(
            x,
            y,
            20,
            0x00ffff,
            0.4
        );
        
        this.tweens.add({
            targets: ripple,
            scale: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                ripple.destroy();
            }
        });
    }

    levelUp() {
        this.gameData.level++;
        this.game.registry.set('gameData', this.gameData);
        
        this.playSound('levelUp', 0.6);
        
        // Check if this is stage 5 (boss stage)
        if (this.gameData.level === 5) {
            this.startBossStage();
            return;
        }
        
        // Check if this is stages 6-10 (Venus background stages)
        if (this.gameData.level >= 6 && this.gameData.level <= 10) {
            // Start Venus background transition
            this.startVenusBackgroundTransition();
        }
        
        // Handle difficulty scaling for different stages
        if (this.gameData.level >= 6 && this.gameData.level <= 10) {
            // Venus stages: Reset to stage 3 difficulty, then gradually increase
            if (this.gameData.level === 6) {
                // Reset to stage 3 difficulty (1500ms spawn interval)
                this.asteroidSpawnInterval = 1500;
                this.ufoSpawnInterval = 12000; // Stage 3 UFO spawn rate
                this.powerUpSpawnInterval = 8000; // Stage 3 power-up rate
            } else {
                // Gradually increase difficulty from stage 6 onwards
                const stageOffset = this.gameData.level - 6;
                this.asteroidSpawnInterval = Math.max(800, 1500 - (stageOffset * 100));
                this.ufoSpawnInterval = Math.max(6000, 12000 - (stageOffset * 1000));
                this.powerUpSpawnInterval = Math.max(4000, 8000 - (stageOffset * 500));
            }
        } else {
            // Normal difficulty increase for other stages
            this.asteroidSpawnInterval = Math.max(500, this.asteroidSpawnInterval - 100);
            
            // Adjust UFO spawn interval for normal stages
            if (this.gameData.level >= 2) {
                this.ufoSpawnInterval = Math.max(5000, 10000 - (this.gameData.level - 2) * 500);
            }
        }
        
        // Smooth stage transition instead of clearing everything
        this.startSmoothStageTransition();
        
        // Clear UFOs on level up (these can be cleared immediately)
        if (this.ufos) {
            this.ufos.clear(true, true);
        }
        
        // Show level up effect
        this.createLevelUpEffect();
    }

    startBossStage() {
        this.bossStage = true;
        
        // Gradually remove all sprites
        this.graduallyRemoveSprites();
        
        // Play boss sound
        this.playSound('boss_appear', 0.7);
        
        // Spawn boss after a delay
        this.time.delayedCall(2000, () => {
            this.spawnBoss();
        });
    }

    graduallyRemoveSprites() {
        // Get all existing entities
        const asteroids = this.asteroids.getChildren();
        const ufos = this.ufos.getChildren();
        const powerUps = this.powerUps.getChildren();
        
        // Gradually fade out asteroids
        asteroids.forEach((asteroid, index) => {
            const delay = (index / asteroids.length) * 1500;
            this.time.delayedCall(delay, () => {
                if (asteroid && asteroid.active) {
                    this.tweens.add({
                        targets: asteroid,
                        alpha: 0,
                        scale: 0.5,
                        duration: 800,
                        ease: 'Power2',
                        onComplete: () => {
                            if (asteroid && asteroid.active) {
                                asteroid.destroy();
                            }
                        }
                    });
                }
            });
        });
        
        // Clear UFOs and power-ups immediately
        this.ufos.clear(true, true);
        this.powerUps.clear(true, true);
    }

    spawnBoss() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Play boss lady voice sound
        this.playSound('boss_ladyvoice_1', 0.8);
        
        // Create boss at top of screen
        this.boss = new Boss(this, width / 2, -100);
        this.bossGroup.add(this.boss);
        
        // Add boss to scene's display list
        this.add.existing(this.boss);
    }

    completeBossStage() {
        // Create warp effect
        this.createWarpEffect();
        
        // Play boss completion sound
        this.playSound('winning_stage', 0.8);
        
        // Transition to stage 6 after warp effect
        this.time.delayedCall(3000, () => {
            this.bossStage = false;
            this.gameData.level = 6;
            this.game.registry.set('gameData', this.gameData);
            
            // Clear boss
            if (this.boss) {
                this.boss.destroy();
                this.boss = null;
            }
            
            // Start normal stage 6
            this.startSmoothStageTransition();
        });
    }

    createWarpEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create multiple expanding circles for warp effect
        for (let i = 0; i < 5; i++) {
            const circle = this.add.circle(
                width / 2,
                height / 2,
                10,
                0x00ffff,
                0.8
            );
            
            this.tweens.add({
                targets: circle,
                radius: Math.max(width, height),
                alpha: 0,
                duration: 2000,
                delay: i * 200,
                ease: 'Power2',
                onComplete: () => {
                    if (circle && circle.active) {
                        circle.destroy();
                    }
                }
            });
        }
        
        // Add some particle effects
        for (let i = 0; i < 50; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.FloatBetween(1, 4),
                0x00ffff
            );
            
            this.tweens.add({
                targets: particle,
                x: width / 2,
                y: height / 2,
                scale: 0,
                alpha: 0,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
    }

    startSmoothStageTransition() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Get existing asteroids
        const existingAsteroids = this.asteroids.getChildren();
        
        // Phase 1: Gradually fade out existing asteroids (1.5 seconds)
        existingAsteroids.forEach((asteroid, index) => {
            // Stagger the fade out for a wave effect
            const delay = (index / existingAsteroids.length) * 1500;
            
            this.time.delayedCall(delay, () => {
                if (asteroid && asteroid.active) {
                    // Create fade out effect
                    this.tweens.add({
                        targets: asteroid,
                        alpha: 0,
                        scale: 0.5,
                        duration: 800,
                        ease: 'Power2',
                        onComplete: () => {
                            if (asteroid && asteroid.active) {
                                asteroid.destroy();
                            }
                        }
                    });
                }
            });
        });
        
        // Phase 2: Start spawning new asteroids after a brief delay (0.5 seconds)
        this.time.delayedCall(500, () => {
            this.spawnNewStageAsteroids();
        });
    }

    spawnNewStageAsteroids() {
        const count = 5 + Math.floor(this.gameData.level / 2);
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Spawn new asteroids with staggered timing and fade-in effects
        for (let i = 0; i < count; i++) {
            const delay = i * 200; // Stagger spawns by 200ms
            
            this.time.delayedCall(delay, () => {
                this.spawnAsteroidWithEffect();
            });
        }
    }

    spawnAsteroidWithEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        let x, y;
        const side = Phaser.Math.Between(0, 2); // Only 3 sides: top, left, right
        
        switch (side) {
            case 0: // Top
                x = Phaser.Math.Between(0, width);
                y = -50;
                break;
            case 1: // Right
                x = width + 50;
                y = Phaser.Math.Between(0, height);
                break;
            case 2: // Left
                x = -50;
                y = Phaser.Math.Between(0, height);
                break;
        }
        
        const sizes = ['large', 'medium', 'small'];
        const size = sizes[Phaser.Math.Between(0, 2)];
        
        const asteroid = new Asteroid(this, x, y, size);
        this.asteroids.add(asteroid);
        
        // Start with 0 alpha and scale for fade-in effect
        asteroid.setAlpha(0);
        asteroid.setScale(0.3);
        
        // Set velocity towards center
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = Phaser.Math.Angle.Between(x, y, centerX, centerY);
        const speed = Phaser.Math.Between(50, 150) * (1 + this.gameData.level * 0.1);
        
        asteroid.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Create fade-in and scale effect
        this.tweens.add({
            targets: asteroid,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                // Create a subtle glow effect when fully visible
                this.createAsteroidGlowEffect(asteroid);
            }
        });
    }

    createAsteroidGlowEffect(asteroid) {
        // Create a subtle glow effect around the asteroid
        const glow = this.add.circle(
            asteroid.x,
            asteroid.y,
            asteroid.radius + 5,
            0xffffff,
            0.2
        );
        
        // Make the glow follow the asteroid
        this.tweens.add({
            targets: glow,
            scale: 1.2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                if (glow && glow.active) {
                    glow.destroy();
                }
            }
        });
    }

    createLevelUpEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const levelText = this.add.text(width / 2, height / 2, `LEVEL ${this.gameData.level}!`, {
            fontSize: '48px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        levelText.setShadow(0, 0, 10, '#00ff00', true);
        
        this.tweens.add({
            targets: levelText,
            scale: 1.5,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                levelText.destroy();
            }
        });
    }

    createFireworksEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create multiple firework bursts across the screen
        const fireworkPositions = [
            { x: width * 0.2, y: height * 0.3 },
            { x: width * 0.8, y: height * 0.4 },
            { x: width * 0.5, y: height * 0.6 },
            { x: width * 0.3, y: height * 0.7 },
            { x: width * 0.7, y: height * 0.5 }
        ];
        
        // Create firework bursts with different colors
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff];
        
        fireworkPositions.forEach((pos, index) => {
            // Delay each firework burst
            this.time.delayedCall(index * 200, () => {
                this.createFireworkBurst(pos.x, pos.y, colors[index % colors.length]);
            });
        });
        
        // Create additional random firework bursts throughout the 3 seconds
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(500 + i * 300, () => {
                const randomX = Phaser.Math.Between(50, width - 50);
                const randomY = Phaser.Math.Between(50, height - 50);
                const randomColor = colors[Phaser.Math.Between(0, colors.length - 1)];
                this.createFireworkBurst(randomX, randomY, randomColor);
            });
        }
    }

    createFireworkBurst(x, y, color) {
        // Create the initial firework rocket
        const rocket = this.add.circle(x, y, 3, color);
        
        // Animate the rocket shooting up
        this.tweens.add({
            targets: rocket,
            y: y - 100,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                rocket.destroy();
                this.createFireworkExplosion(x, y - 100, color);
            }
        });
    }

    createFireworkExplosion(x, y, color) {
        // Create multiple particles for the explosion
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(30, 80);
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            
            const particle = this.add.circle(
                x,
                y,
                Phaser.Math.FloatBetween(2, 4),
                color
            );
            
            // Animate particle expanding outward
            this.tweens.add({
                targets: particle,
                x: particleX,
                y: particleY,
                scale: 0,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Create a bright flash at the explosion center
        const flash = this.add.circle(x, y, 20, 0xffffff, 0.8);
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    gameOver() {
        // Save high score
        if (this.gameData.score > this.gameData.highScore) {
            this.gameData.highScore = this.gameData.score;
            try {
                localStorage.setItem('spaceshipAsteroidsHighScore', this.gameData.score.toString());
            } catch (error) {
                console.warn('Could not save high score:', error);
            }
        }
        
        this.game.registry.set('gameData', this.gameData);
        
        // Stop engine boost effect if active
        this.stopEngineBoostEffect();
        
        // Stop all game sounds except background music
        // Note: game over sound is already playing from collision handler
        this.sound.stopAll();
        
        // Create fireworks effect
        this.createFireworksEffect();
        
        // Show "GAME OVER" text with fireworks
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        gameOverText.setShadow(0, 0, 15, '#ff0000', true);
        
        // Animate the game over text
        this.tweens.add({
            targets: gameOverText,
            scale: 1.2,
            duration: 1500,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
        
        // Wait 3 seconds, then transition to game over scene
        this.time.delayedCall(3000, () => {
            this.scene.start('GameOverScene');
        });
    }

    startBackgroundMusic() {
        try {
            // Check if the audio file exists before playing
            if (this.cache.audio.exists('gameMusic')) {
                this.sound.play('gameMusic', { loop: true, volume: 0.3 });
            } else if (this.cache.audio.exists('background')) {
                // Fallback to old background music if available
                this.sound.play('background', { loop: true, volume: 0.3 });
            }
        } catch (error) {
            console.log('Background music not available, continuing without audio');
        }
    }

    checkExistingPowerUpsForTutorial() {
        console.log('checkExistingPowerUpsForTutorial called');
        console.log('Power-ups count:', this.powerUps.getChildren().length);
        
        // Check if there are any power-ups already on screen that need tutorial
        const existingPowerUpTypes = new Set();
        
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp && powerUp.getType) {
                const type = powerUp.getType();
                existingPowerUpTypes.add(type);
                console.log('Found power-up type:', type);
            }
        });
        
        console.log('Existing power-up types:', Array.from(existingPowerUpTypes));
        console.log('Explained power-ups:', Array.from(this.explainedPowerUps));
        
        // Show tutorial for any power-up types that haven't been explained yet
        for (const powerUpType of existingPowerUpTypes) {
            if (!this.explainedPowerUps.has(powerUpType)) {
                console.log(`Found existing power-up type: ${powerUpType}, showing tutorial`);
                // Delay slightly to let the game settle
                this.time.delayedCall(1000, () => {
                    this.showAvatarTutorial(powerUpType);
                });
                break; // Only show tutorial for the first unexpained power-up type
            }
        }
    }
} 