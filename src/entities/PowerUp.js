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
        // Check if we're in stages 3+ for new power-ups
        const currentLevel = this.scene.gameData ? this.scene.gameData.level : 1;
        const isAdvancedStage = currentLevel >= 3;
        
        let types = ['health', 'rapidFire', 'shield', 'tripleShot', 'speedBoost', 'strongLaser'];
        
        // Add new power-ups for stages 3+
        if (isAdvancedStage) {
            types.push('napalmBomb', 'supportShips');
            // Make support ships more frequent by adding it multiple times
            types.push('supportShips', 'supportShips'); // 3x more frequent
        }
        
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
        let indicator;
        
        // Use images for specific power-ups, emoji for others
        if (this.type === 'speedBoost') {
            indicator = this.scene.add.image(this.x, this.y - 20, 'item_speed');
            indicator.setScale(0.5); // Scale down the image
        } else if (this.type === 'supportShips') {
            indicator = this.scene.add.image(this.x, this.y - 20, 'support_ship');
            indicator.setScale(0.4); // Scale down the image
        } else {
            indicator = this.scene.add.text(this.x, this.y - 20, this.getEmojiForType(), {
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5);
        }
        
        // Make indicator follow the power-up
        this.emojiIndicator = indicator;
        
        // Add floating animation
        this.scene.tweens.add({
            targets: indicator,
            y: indicator.y - 5,
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
            case 'napalmBomb':
                this.applyNapalmBomb(spaceship);
                break;
            case 'supportShips':
                this.applySupportShips(spaceship);
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
        spaceship.activateSpeedBoost(20000); // 20 seconds
        this.showNotification('🚀 Speed Boost!', 0x00ff00);
    }

    applyStrongLaser(spaceship) {
        spaceship.activateStrongLaser(20000); // 20 seconds
        this.showNotification('💪 Strong Laser!', 0xff6600);
    }

    applyNapalmBomb(spaceship) {
        // Destroy all enemies on screen
        this.destroyAllEnemies();
        this.showNotification('💥 NAPALM BOMB!', 0xff0000);
    }

    applySupportShips(spaceship) {
        spaceship.activateSupportShips(15000);
        this.showNotification('🛸 Support Ships!', 0x00ffff);
    }

    destroyAllEnemies() {
        if (!this.scene) return;
        
        // Create massive explosion effect
        this.createNapalmExplosion();
        
        // Destroy all asteroids
        if (this.scene.asteroids) {
            this.scene.asteroids.getChildren().forEach(asteroid => {
                if (asteroid && asteroid.active) {
                    this.scene.gameData.score += asteroid.getScoreValue();
                    this.scene.createExplosion(asteroid.x, asteroid.y);
                    asteroid.destroy();
                }
            });
        }
        
        // Destroy all UFOs
        if (this.scene.ufos) {
            this.scene.ufos.getChildren().forEach(ufo => {
                if (ufo && ufo.active) {
                    this.scene.gameData.score += ufo.getScoreValue();
                    this.scene.createExplosion(ufo.x, ufo.y);
                    ufo.destroy();
                }
            });
        }
        
        // Update score
        this.scene.game.registry.set('gameData', this.scene.gameData);
    }

    createNapalmExplosion() {
        if (!this.scene) return;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create massive screen-wide explosion effect
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);
            
            // Create large explosion with more particles
            for (let j = 0; j < 30; j++) {
                const particle = this.scene.add.circle(
                    x + Phaser.Math.Between(-40, 40),
                    y + Phaser.Math.Between(-40, 40),
                    Phaser.Math.FloatBetween(4, 12),
                    0xff6600
                );
                
                particle.setStrokeStyle(3, 0xffff00);
                
                this.scene.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(-80, 80),
                    y: particle.y + Phaser.Math.Between(-80, 80),
                    scale: 0,
                    alpha: 0,
                    duration: Phaser.Math.Between(1000, 1500),
                    ease: 'Power2',
                    onComplete: () => {
                        if (particle && particle.active) {
                            particle.destroy();
                        }
                    }
                });
            }
        }
        
        // Create shockwave effect
        const shockwave = this.scene.add.circle(
            width / 2,
            height / 2,
            10,
            0xff0000,
            0.8
        );
        
        this.scene.tweens.add({
            targets: shockwave,
            scale: 20,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                if (shockwave && shockwave.active) {
                    shockwave.destroy();
                }
            }
        });
        
        // Create screen flash effect
        const flash = this.scene.add.rectangle(
            0,
            0,
            width,
            height,
            0xff6600,
            0.3
        );
        flash.setOrigin(0);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                if (flash && flash.active) {
                    flash.destroy();
                }
            }
        });
        
        // Play explosion sound
        this.scene.playSound('blast', 0.8);
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
            case 'napalmBomb': return 0xff0000;
            case 'supportShips': return 0x00ffff;
            default: return 0x00ff00;
        }
    }

    getEmojiForType() {
        switch (this.type) {
            case 'health': return '❤️';
            case 'rapidFire': return '🔥';
            case 'shield': return '🛡️';
            case 'tripleShot': return '🔱';
            case 'speedBoost': return '🚀';
            case 'strongLaser': return '💪';
            case 'napalmBomb': return '💥';
            case 'supportShips': return '🛸';
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