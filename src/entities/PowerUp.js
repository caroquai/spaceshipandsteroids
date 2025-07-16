export class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'powerup');
        
        this.scene = scene;
        this.isDead = false;
        
        // Power-up properties
        this.type = this.getRandomType();
        this.lifetime = 10000; // milliseconds
        this.maxLifetime = this.lifetime;
        this.createdTime = scene.time.now;
        
        // Movement
        this.bobSpeed = 2.0;
        this.bobAmount = 5;
        this.bobTimer = 0;
        
        // Visual effects
        this.rotationSpeed = 1.0;
        this.pulseTimer = 0;
        this.pulseSpeed = 3.0;
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Now set up physics body after it's been added
        this.setCircle(8);
        this.setCollideWorldBounds(false);
        
        // Set up visual effects
        this.setupVisualEffects();
    }

    getRandomType() {
        const types = ['health', 'rapidFire', 'shield', 'tripleShot', 'speedBoost', 'strongLaser'];
        return types[Phaser.Math.Between(0, types.length - 1)];
    }

    setupVisualEffects() {
        // Set tint based on type
        this.setTint(this.getColorForType());
        
        // Add glow effect
        this.setPipeline('Light2D');
        
        // Add emoji indicator
        this.createEmojiIndicator();
    }
    
    createEmojiIndicator() {
        const emoji = this.scene.add.text(this.x, this.y - 20, this.getEmojiForType(), {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);
        
        // Make emoji follow the power-up
        this.emojiIndicator = emoji;
        
        // Add floating animation
        this.scene.tweens.add({
            targets: emoji,
            y: emoji.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update lifetime
        this.lifetime -= delta;
        if (this.lifetime <= 0) {
            this.destroy();
            return;
        }

        // Update bobbing motion
        this.bobTimer += delta * this.bobSpeed / 1000;
        const bobOffset = Math.sin(this.bobTimer) * this.bobAmount;
        this.y += bobOffset * delta / 1000;

        // Update rotation
        this.rotation += this.rotationSpeed * delta / 1000;

        // Update pulse effect
        this.pulseTimer += delta * this.pulseSpeed / 1000;
        const pulse = Math.sin(this.pulseTimer) * 0.2 + 0.8;
        this.setAlpha(pulse);
        
        // Update scale based on lifetime (but keep collision body consistent)
        const lifetimeScale = this.lifetime / this.maxLifetime;
        this.setScale(lifetimeScale);
        
        // Update physics body to match scale
        if (this.body) {
            this.body.setCircle(8 * lifetimeScale);
        }
        
        // Update emoji position
        if (this.emojiIndicator) {
            this.emojiIndicator.x = this.x;
            this.emojiIndicator.y = this.y - 20;
            this.emojiIndicator.setScale(lifetimeScale);
        }
    }

    apply(spaceship) {
        if (!spaceship || this.isDead) return;

        // Mark as dead immediately to prevent multiple applications
        this.isDead = true;

        switch (this.type) {
            case 'health':
                this.applyHealth(spaceship);
                break;
            case 'rapidFire':
                this.applyRapidFire(spaceship);
                break;
            case 'shield':
                this.applyShield(spaceship);
                break;
            case 'tripleShot':
                this.applyTripleShot(spaceship);
                break;
            case 'speedBoost':
                this.applySpeedBoost(spaceship);
                break;
            case 'strongLaser':
                this.applyStrongLaser(spaceship);
                break;
        }

        // Create sparkle effect
        this.createSparkleEffect();
        
        // Destroy immediately after applying
        this.destroy();
    }

    applyHealth(spaceship) {
        // Heal the ship's health (this will also update game lives)
        spaceship.heal(1);
        
        // Update game lives to match ship health
        if (this.scene && this.scene.gameData) {
            this.scene.gameData.lives = spaceship.getHealth();
            this.scene.game.registry.set('gameData', this.scene.gameData);
        }
        
        this.showNotification('❤️ +1 Life!', 0x00ff00);
    }

    applyRapidFire(spaceship) {
        spaceship.activateRapidFire(10000);
        this.showNotification('🔥 Rapid Fire!', 0xffff00);
    }

    applyShield(spaceship) {
        spaceship.activateShield(20000);
        this.showNotification('🛡️ Shield Active!', 0x00ffff);
    }

    applyTripleShot(spaceship) {
        spaceship.activateTripleShot(20000);
        this.showNotification('🔱 Triple Shot!', 0xff00ff);
    }

    applySpeedBoost(spaceship) {
        spaceship.activateSpeedBoost(8000);
        this.showNotification('🚀 Speed Boost!', 0x00ff00);
    }

    applyStrongLaser(spaceship) {
        spaceship.activateStrongLaser(12000);
        this.showNotification('💪 Strong Laser!', 0xff6600);
    }

    showNotification(text, color) {
        if (!this.scene) return;
        
        const notification = this.scene.add.text(this.x, this.y - 30, text, {
            fontSize: '16px',
            fill: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: notification,
            y: notification.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                notification.destroy();
            }
        });
    }

    createSparkleEffect() {
        // Create simple sparkle effect
        for (let i = 0; i < 5; i++) {
            const sparkle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-8, 8),
                this.y + Phaser.Math.Between(-8, 8),
                Phaser.Math.FloatBetween(1, 2),
                this.getColorForType()
            );
            
            this.scene.tweens.add({
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

    getColorForType() {
        switch (this.type) {
            case 'health': return 0xff0000;
            case 'rapidFire': return 0xffff00;
            case 'shield': return 0x00ffff;
            case 'tripleShot': return 0xff00ff;
            case 'speedBoost': return 0x00ff00;
            case 'strongLaser': return 0xff6600;
            default: return 0x00ff00;
        }
    }

    getEmojiForType() {
        switch (this.type) {
            case 'health': return '❤️';
            case 'rapidFire': return '🔥';
            case 'shield': return '🛡️';
            case 'tripleShot': return '🔱';
            case 'speedBoost': return '🛼';
            case 'strongLaser': return '💪';
            default: return '❓';
        }
    }

    destroy() {
        this.isDead = true;
        
        // Clean up emoji indicator
        if (this.emojiIndicator) {
            this.emojiIndicator.destroy();
            this.emojiIndicator = null;
        }
        
        super.destroy();
    }

    // Getters
    getType() {
        return this.type;
    }

    getRemainingLifetime() {
        return this.lifetime;
    }

    getLifetimePercentage() {
        return this.lifetime / this.maxLifetime;
    }

    isActive() {
        return !this.isDead && this.lifetime > 0;
    }
} 