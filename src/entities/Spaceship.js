import { Bullet } from './Bullet.js';

export class Spaceship extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spaceship');
        
        this.scene = scene;
        this.isDead = false;
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 1000; // Reduced from 2000ms to 1000ms (1 second)
        this.invulnerabilityTimer = 0;
        
        // Control flags for entrance animation
        this.entranceAnimationActive = false;
        this.canControl = true;
        
        // Movement
        this.maxSpeed = 200;
        this.baseMaxSpeed = 200;
        this.acceleration = 400;
        this.friction = 0.95;
        
        // Shooting
        this.fireRate = 200; // milliseconds
        this.lastFireTime = 0;
        this.bulletSpeed = 400;
        this.strongLaserActive = false;
        
        // Power-up timer properties
        this.rapidFireEndTime = 0;
        this.shieldEndTime = 0;
        this.shieldActive = false;
        this.shieldHalo = null;
        this.speedBoostEndTime = 0;
        this.strongLaserEndTime = 0;
        this.tripleShotEndTime = 0;
        
        // Visual effects
        this.engineTrailTimer = 0;
        this.engineTrailInterval = 100;
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Now set up physics body after it's been added
        this.setCircle(12);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(true);
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= delta;
            
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
                this.setAlpha(1);
            } else {
                // Flash when invulnerable
                this.setAlpha(time % 200 < 100 ? 0.5 : 1);
            }
        }

        // Only update engine trail and apply friction if not in entrance animation
        if (!this.entranceAnimationActive) {
            // Update engine trail
            this.engineTrailTimer += delta;
            if (this.engineTrailTimer >= this.engineTrailInterval) {
                this.createEngineTrail();
                this.engineTrailTimer = 0;
            }

            // Apply friction only when player can control
            if (this.canControl) {
                this.setVelocity(
                    this.body.velocity.x * this.friction,
                    this.body.velocity.y * this.friction
                );
            }
        }
        
        // Update power-up visual effects
        this.updatePowerUpVisuals(time);
        
        // Update shield halo position to follow the ship
        if (this.shieldHalo && this.shieldHalo.active) {
            this.shieldHalo.setPosition(this.x, this.y);
        }
    }

    updatePowerUpVisuals(time) {
        // Create visual effects for active power-ups
        // Rapid fire effect - disabled to prevent yellow dot accumulation
        // if (this.rapidFireEndTime && this.rapidFireEndTime > time) {
        //     // Rapid fire effect - occasional yellow sparkles (reduced frequency)
        //     if (time % 1000 < 30) {
        //         this.createPowerUpSparkle(0xffff00);
        //     }
        // }
        
        if (this.shieldEndTime && this.shieldEndTime > time) {
            // Shield effect - make ship invisible
            this.setAlpha(0.3);
        } else if (!this.invulnerable) {
            this.setAlpha(1);
        }
        
        if (this.speedBoostEndTime && this.speedBoostEndTime > time) {
            // Speed boost effect - green sparkles
            if (time % 300 < 30) {
                this.createPowerUpSparkle(0x00ff00);
            }
        }
        
        if (this.strongLaserEndTime && this.strongLaserEndTime > time) {
            // Strong laser effect - orange sparkles
            if (time % 400 < 40) {
                this.createPowerUpSparkle(0xff6600);
            }
        }
        
        if (this.tripleShotEndTime && this.tripleShotEndTime > time) {
            // Triple shot effect - purple sparkles
            if (time % 350 < 35) {
                this.createPowerUpSparkle(0xff00ff);
            }
        }
    }

    createPowerUpSparkle(color) {
        const sparkle = this.scene.add.circle(
            this.x + Phaser.Math.Between(-15, 15),
            this.y + Phaser.Math.Between(-15, 15),
            Phaser.Math.FloatBetween(1, 2),
            color
        );
        
        this.scene.tweens.add({
            targets: sparkle,
            scale: 0,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                if (sparkle && sparkle.active) {
                    sparkle.destroy();
                }
            }
        });
        
        // Force destroy after a maximum time to prevent accumulation
        this.scene.time.delayedCall(500, () => {
            if (sparkle && sparkle.active) {
                sparkle.destroy();
            }
        });
    }

    takeDamage() {
        if (this.invulnerable || this.isDead) {
            return;
        }

        this.health--;
        
        if (this.health <= 0) {
            this.die();
        } else {
            this.becomeInvulnerable();
        }
    }

    die() {
        this.isDead = true;
        this.health = 0;
        this.setVisible(false);
        this.body.setEnable(false);
    }

    becomeInvulnerable() {
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityTime;
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    fire() {
        const time = this.scene.time.now;
        if (time - this.lastFireTime < this.fireRate) return;

        this.lastFireTime = time;
        
        // Check if triple shot is active
        if (this.tripleShotEndTime && this.tripleShotEndTime > time) {
            this.fireTripleShot();
        } else {
            this.fireSingleShot();
        }
    }

    fireSingleShot() {
        // Create bullet directly in the physics group
        const bullet = this.scene.bullets.create(this.x, this.y - 20, 'bullet');
        
        // Set up bullet properties
        bullet.setCircle(6);
        bullet.setCollideWorldBounds(false);
        bullet.body.setEnable(true);
        
        // Set bullet properties based on strong laser status
        if (this.strongLaserActive) {
            bullet.setScale(2.0);
            bullet.setTint(0xff4400);
            bullet.setCircle(8);
            bullet.isStrongLaser = true;
        } else {
            bullet.setScale(1);
            bullet.setTint(0xffff00);
            bullet.isStrongLaser = false;
        }
        
        // Add strong laser methods to the bullet
        bullet.canPassThrough = function(asteroid) {
            if (!this.isStrongLaser) return false;
            return asteroid.size === 'small' || asteroid.size === 'medium';
        };
        
        bullet.shouldDestroyLargeAsteroid = function(asteroid) {
            return this.isStrongLaser && asteroid.size === 'large';
        };
        
        // Set bullet velocity
        bullet.setVelocity(0, -this.bulletSpeed);
        
        // Play different laser sound based on power-up status
        if (this.strongLaserActive) {
            this.playSound('laser_strong', 0.6);
        } else {
            this.playSound('laser_normal', 0.25);
        }
    }

    fireTripleShot() {
        // Create three bullets in a spread pattern
        const angles = [-25, 0, 25]; // Increased spread angle for better visibility
        
        angles.forEach((angle, index) => {
            // Slightly offset bullet positions to prevent overlap
            const offsetX = (index - 1) * 12; // Increased offset for better visibility
            
            const bullet = this.scene.bullets.create(this.x + offsetX, this.y - 20, 'bullet');
            
            // Set up bullet properties
            bullet.setCircle(6);
            bullet.setCollideWorldBounds(false);
            bullet.body.setEnable(true);
            
            // Set bullet properties based on strong laser status
            if (this.strongLaserActive) {
                bullet.setScale(2.0);
                bullet.setTint(0xff4400);
                bullet.setCircle(8);
                bullet.isStrongLaser = true;
            } else {
                // Make bullets more visually distinct for triple shot
                bullet.setScale(1.2); // Slightly larger
                bullet.setTint(0x00ffff); // Cyan color for triple shot bullets
                bullet.isStrongLaser = false;
            }
            
            // Add strong laser methods to the bullet
            bullet.canPassThrough = function(asteroid) {
                if (!this.isStrongLaser) return false;
                return asteroid.size === 'small' || asteroid.size === 'medium';
            };
            
            bullet.shouldDestroyLargeAsteroid = function(asteroid) {
                return this.isStrongLaser && asteroid.size === 'large';
            };
            
            // Calculate velocity based on angle (0 degrees = straight up)
            const radians = Phaser.Math.DegToRad(angle);
            const velocityX = Math.sin(radians) * this.bulletSpeed;
            const velocityY = -Math.cos(radians) * this.bulletSpeed;
            
            bullet.setVelocity(velocityX, velocityY);
        });
        
        // Play different laser sound based on power-up status
        if (this.strongLaserActive) {
            this.playSound('laser_strong', 0.6);
        } else {
            this.playSound('laser_triple', 0.5);
        }
    }

    playSound(key, volume = 1.0) {
        try {
            if (this.scene && this.scene.cache.audio.exists(key)) {
                this.scene.sound.play(key, { volume });
            }
        } catch (error) {
            console.log(`Audio file '${key}' not available`);
        }
    }

    createEngineTrail() {
        // Create simple engine trail effect
        const trail = this.scene.add.circle(
            this.x + Phaser.Math.Between(-2, 2),
            this.y + 15 + Phaser.Math.Between(-2, 2),
            Phaser.Math.FloatBetween(1, 2),
            0xff6600
        );
        
        this.scene.tweens.add({
            targets: trail,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                trail.destroy();
            }
        });
    }

    // Power-up effects
    activateRapidFire(duration = 20000) {
        const originalFireRate = this.fireRate;
        this.fireRate = 100; // Actually make it fire faster (100ms instead of 200ms)
        this.rapidFireEndTime = this.scene.time.now + duration;
        
        this.scene.time.delayedCall(duration, () => {
            this.fireRate = originalFireRate;
            this.rapidFireEndTime = 0;
        });
    }

    activateShield(duration = 20000) {
        const wasShieldActive = this.shieldActive;
        this.shieldActive = true;
        this.shieldEndTime = this.scene.time.now + duration;
        
        // Only create shield halo if one doesn't already exist
        if (!wasShieldActive) {
            this.createShieldHalo();
        }
        
        this.scene.time.delayedCall(duration, () => {
            this.shieldActive = false;
            this.shieldEndTime = 0;
            this.removeShieldHalo();
        });
    }

    activateSpeedBoost(duration = 20000) {
        const originalMaxSpeed = this.maxSpeed;
        this.maxSpeed = this.baseMaxSpeed * 2.0; // Double the speed
        this.speedBoostEndTime = this.scene.time.now + duration;
        
        // Create speed boost visual effect
        this.createSpeedBoostEffect();
        
        this.scene.time.delayedCall(duration, () => {
            this.maxSpeed = originalMaxSpeed;
            this.speedBoostEndTime = 0;
            this.createSpeedBoostEndEffect();
        });
    }

    activateStrongLaser(duration = 20000) {
        this.strongLaserActive = true;
        this.strongLaserEndTime = this.scene.time.now + duration;
        
        // Create activation effect
        this.createStrongLaserEffect();
        
        this.scene.time.delayedCall(duration, () => {
            this.strongLaserActive = false;
            this.strongLaserEndTime = 0;
            this.createStrongLaserEndEffect();
        });
    }

    activateTripleShot(duration = 20000) {
        this.tripleShotEndTime = this.scene.time.now + duration;
        
        // Create activation effect
        this.createTripleShotEffect();
        
        this.scene.time.delayedCall(duration, () => {
            this.tripleShotEndTime = 0;
            this.createTripleShotEndEffect();
        });
    }

    createStrongLaserEffect() {
        // Create strong laser activation effect
        const effect = this.scene.add.circle(
            this.x,
            this.y,
            40,
            0xff6600,
            0.4
        );
        
        this.scene.tweens.add({
            targets: effect,
            scale: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    createStrongLaserEndEffect() {
        // Create end effect
        const endEffect = this.scene.add.circle(
            this.x,
            this.y,
            30,
            0xff6600,
            0.3
        );
        
        this.scene.tweens.add({
            targets: endEffect,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                endEffect.destroy();
            }
        });
    }

    createTripleShotEffect() {
        // Create triple shot activation effect
        const effect = this.scene.add.circle(
            this.x,
            this.y,
            40,
            0xff00ff,
            0.4
        );
        
        this.scene.tweens.add({
            targets: effect,
            scale: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    createTripleShotEndEffect() {
        // Create end effect
        const endEffect = this.scene.add.circle(
            this.x,
            this.y,
            30,
            0xff00ff,
            0.3
        );
        
        this.scene.tweens.add({
            targets: endEffect,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                endEffect.destroy();
            }
        });
    }

    createShieldHalo() {
        // Create shield halo effect
        this.shieldHalo = this.scene.add.circle(
            this.x,  // Position at ship's current position
            this.y,  // Position at ship's current position
            25,
            0x00ffff,
            0.2
        );
        
        // Add pulsing animation to the halo
        this.scene.tweens.add({
            targets: this.shieldHalo,
            scale: 1.2,
            alpha: 0.4,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    removeShieldHalo() {
        if (this.shieldHalo) {
            this.scene.tweens.add({
                targets: this.shieldHalo,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.shieldHalo.destroy();
                    this.shieldHalo = null;
                }
            });
        }
    }

    createSpeedBoostEffect() {
        // Create speed lines effect
        for (let i = 0; i < 3; i++) {
            const speedLine = this.scene.add.rectangle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-20, 20),
                20,
                2,
                0x00ff00
            ).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: speedLine,
                alpha: 0,
                scaleX: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    speedLine.destroy();
                }
            });
        }
    }

    createSpeedBoostEndEffect() {
        // Create end effect
        const endEffect = this.scene.add.circle(
            this.x,
            this.y,
            30,
            0x00ff00,
            0.3
        );
        
        this.scene.tweens.add({
            targets: endEffect,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                endEffect.destroy();
            }
        });
    }

    // Getters
    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    isInvulnerable() {
        return this.invulnerable;
    }
} 