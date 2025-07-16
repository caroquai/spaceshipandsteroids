import { Spaceship } from '../entities/Spaceship.js';
import { Asteroid } from '../entities/Asteroid.js';
import { Bullet } from '../entities/Bullet.js';
import { PowerUp } from '../entities/PowerUp.js';
import { UFO } from '../entities/UFO.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.spaceship = null;
        this.asteroids = null;
        this.bullets = null;
        this.powerUps = null;
        this.ufos = null;
        this.particles = null;
        
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
        
        this.cursors = null;
        this.fireKey = null;
        
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 2000;
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 8000; // More frequent power-ups
        this.ufoSpawnTimer = 0;
        this.ufoSpawnInterval = 10000; // UFO spawn interval
        
        this.gameData = null;
    }

    create() {
        this.gameData = this.game.registry.get('gameData');
        this.resetGameData();
        
        this.setupBackground();
        this.setupGroups();
        this.setupUI();
        this.setupInput();
        this.setupAudio();
        
        this.spawnSpaceship();
        this.spawnInitialAsteroids();
        
        // Set up collisions AFTER entities are created
        this.setupCollisions();
        
        // Start UFO spawning from stage 2
        if (this.gameData.level >= 2) {
            this.spawnUFO();
        }
        
        // Start background music (only if available)
        this.startBackgroundMusic();
    }

    resetGameData() {
        this.gameData.score = 0;
        this.gameData.lives = 3;
        this.gameData.level = 1;
        this.game.registry.set('gameData', this.gameData);
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
    }

    setupGroups() {
        this.asteroids = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        this.ufos = this.physics.add.group();
        this.particles = this.add.group();
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
        
        // Setup avatar tutorial system
        this.setupAvatarTutorial();
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
            if (this.canFire && !this.spaceship.rapidFireEndTime) {
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
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create semi-transparent overlay
        this.avatarOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
        this.avatarOverlay.setOrigin(0);
        this.avatarOverlay.setVisible(false);
        this.avatarOverlay.setInteractive();
        
        // Create avatar sprite (will be positioned at bottom)
        this.avatarSprite = this.add.image(width / 2, height + 200, 'lady');
        this.avatarSprite.setScale(0.8);
        this.avatarSprite.setVisible(false);
        
        // Create text container
        this.avatarText = this.add.text(width / 2, height - 150, '', {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 100 },
            lineSpacing: 8
        }).setOrigin(0.5);
        this.avatarText.setVisible(false);
        
        // Create continue button
        this.avatarContinueButton = this.add.text(width / 2, height - 50, 'Continue', {
            fontSize: '24px',
            fill: '#00ff00',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.avatarContinueButton.setVisible(false);
        this.avatarContinueButton.setInteractive();
        this.avatarContinueButton.on('pointerdown', () => {
            this.hideAvatarTutorial();
        });
        
        // Add pulsing effect to continue button
        this.tweens.add({
            targets: this.avatarContinueButton,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    showAvatarTutorial(powerUpType) {
        if (this.avatarActive || this.explainedPowerUps.has(powerUpType)) return;
        
        this.avatarActive = true;
        this.explainedPowerUps.add(powerUpType);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Show overlay
        this.avatarOverlay.setVisible(true);
        
        // Show avatar with slide-in animation
        this.avatarSprite.setVisible(true);
        this.avatarSprite.setPosition(width / 2, height + 200);
        this.tweens.add({
            targets: this.avatarSprite,
            y: height - 100,
            duration: 800,
            ease: 'Power2'
        });
        
        // Show text with fade-in
        this.avatarText.setVisible(true);
        this.avatarText.setAlpha(0);
        this.avatarText.setText(this.getPowerUpExplanation(powerUpType));
        this.tweens.add({
            targets: this.avatarText,
            alpha: 1,
            duration: 500,
            delay: 400
        });
        
        // Show continue button with delay
        this.avatarContinueButton.setVisible(true);
        this.avatarContinueButton.setAlpha(0);
        this.tweens.add({
            targets: this.avatarContinueButton,
            alpha: 1,
            duration: 300,
            delay: 800
        });
        
        // Highlight the power-up
        this.highlightPowerUp(powerUpType);
    }

    hideAvatarTutorial() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Slide out avatar
        this.tweens.add({
            targets: this.avatarSprite,
            y: height + 200,
            duration: 600,
            ease: 'Power2'
        });
        
        // Fade out text and button
        this.tweens.add({
            targets: [this.avatarText, this.avatarContinueButton],
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
                this.avatarContinueButton.setVisible(false);
                this.avatarActive = false;
                
                // Reset overlay alpha
                this.avatarOverlay.setAlpha(0.5);
            }
        });
        
        // Remove power-up highlight
        this.removePowerUpHighlight();
    }

    getPowerUpExplanation(powerUpType) {
        switch (powerUpType) {
            case 'health':
                return "❤️ Health Power-up!\n\nThis red heart will restore one life to your ship. Collect it when your health is low to stay in the game longer!";
            case 'rapidFire':
                return "🔥 Rapid Fire Power-up!\n\nThis yellow power-up will make your ship fire bullets automatically at high speed for a limited time. Perfect for clearing waves of asteroids!";
            case 'shield':
                return "🛡️ Shield Power-up!\n\nThis cyan shield will protect your ship from all damage for a short time. You'll see a protective halo around your ship when it's active!";
            case 'tripleShot':
                return "🔱 Triple Shot Power-up!\n\nThis purple power-up will make your ship fire three bullets in a spread pattern instead of one. Great for hitting multiple targets!";
            case 'speedBoost':
                return "🛼 Speed Boost Power-up!\n\nThis green power-up will increase your ship's movement speed for a short time. Use it to dodge asteroids more easily!";
            case 'strongLaser':
                return "💪 Strong Laser Power-up!\n\nThis orange power-up will make your bullets much more powerful. They can pass through small and medium asteroids and destroy large ones instantly!";
            default:
                return "Power-up collected!";
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
            this.isFireKeyPressed = true;
            if (this.canFire && !this.spaceship.rapidFireEndTime) {
                this.spaceship.fire(); // Use spaceship's fire method instead
                this.canFire = false;
            }
        });
        
        // Reset fire flag when key is released
        this.input.keyboard.on('keyup-SPACE', () => {
            this.isFireKeyPressed = false;
            this.canFire = true;
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
        }
    }

    setupAudio() {
        // Audio is already set up in BootScene
    }

    spawnSpaceship() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.spaceship = new Spaceship(this, width / 2, height - 100);
        // Physics is already set up in the Spaceship constructor
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
        
        // Show avatar tutorial for new power-up types
        const powerUpType = powerUp.getType();
        if (!this.explainedPowerUps.has(powerUpType)) {
            // Delay the tutorial slightly to let the power-up appear first
            this.time.delayedCall(500, () => {
                this.showAvatarTutorial(powerUpType);
            });
        }
    }

    spawnUFO() {
        if (this.gameData.level < 2) return; // Only spawn UFOs from stage 2
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Only spawn UFOs with left to right movement
        let x, y;
        
        // Randomly choose left or right side to spawn from
        if (Math.random() < 0.5) {
            // Spawn from left side
            x = -50;
            y = Phaser.Math.Between(50, height - 50);
        } else {
            // Spawn from right side
            x = width + 50;
            y = Phaser.Math.Between(50, height - 50);
        }
        
        const ufo = new UFO(this, x, y);
        this.ufos.add(ufo);
    }

    // fireBullet() method removed - now using spaceship.fire() instead

    playSound(key, volume = 1.0) {
        try {
            if (this.cache.audio.exists(key)) {
                this.sound.play(key, { volume });
            }
        } catch (error) {
            console.log(`Audio file '${key}' not available`);
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
        
        // Update spawn timers
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
            
            // Increase UFO spawn frequency with level
            this.ufoSpawnInterval = Math.max(5000, 10000 - (this.gameData.level - 2) * 500);
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
        
        // Handle input
        this.handleInput();
        
        // Handle auto-fire for rapid fire power-up
        this.handleAutoFire(time, delta);
        
        // Update UI
        this.updateUI();
        
        // Check game over
        if (this.gameData.lives <= 0) {
            this.gameOver();
        }
    }

    handleInput() {
        if (!this.spaceship || this.spaceship.isDead) return;
        
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
        
        this.playSound('explosion', 0.6);
        this.createExplosion(spaceship.x, spaceship.y);
        
        if (this.gameData.lives <= 0) {
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
                
                this.playSound('explosion', 0.4);
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
                    
                    this.playSound('explosion', 0.4);
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
                
                this.playSound('explosion', 0.4);
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
        
        this.playSound('powerup', 0.5);
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
        
        this.playSound('explosion', 0.6);
        this.createExplosion(spaceship.x, spaceship.y);
        
        if (this.gameData.lives <= 0) {
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
            
            this.playSound('explosion', 0.4);
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
                
                this.playSound('explosion', 0.4);
                this.createExplosion(ufo.x, ufo.y);
                
                // Check for level up
                if (this.gameData.score >= this.gameData.level * 1000) {
                    this.levelUp();
                }
            }
        }
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
        
        // Increase difficulty
        this.asteroidSpawnInterval = Math.max(500, this.asteroidSpawnInterval - 100);
        
        // Clear existing asteroids and spawn new ones
        this.asteroids.clear(true, true);
        this.spawnInitialAsteroids();
        
        // Clear UFOs on level up
        if (this.ufos) {
            this.ufos.clear(true, true);
        }
        
        // Adjust UFO spawn interval for new level
        if (this.gameData.level >= 2) {
            this.ufoSpawnInterval = Math.max(5000, 10000 - (this.gameData.level - 2) * 500);
        }
        
        // Show level up effect
        this.createLevelUpEffect();
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
        
        this.playSound('gameOver', 0.7);
        this.sound.stopAll();
        
        this.scene.start('GameOverScene');
    }

    startBackgroundMusic() {
        try {
            // Check if the audio file exists before playing
            if (this.cache.audio.exists('background')) {
                this.sound.play('background', { loop: true, volume: 0.3 });
            }
        } catch (error) {
            console.log('Background music not available, continuing without audio');
        }
    }
} 