export class UFO extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ufo');
        
        this.scene = scene;
        this.isDead = false;
        
        // Health system
        this.health = 2;
        this.maxHealth = 2;
        this.isDamaged = false;
        
        // Movement
        this.speed = 150;
        this.zigzagSpeed = 120;
        this.zigzagAmplitude = 200;
        this.zigzagFrequency = 3.0;
        this.zigzagTimer = 0;
        this.movementDirection = 1; // 1 for right, -1 for left
        this.zigzagPhase = 0; // Current phase of zig-zag movement
        
        // Visual effects
        this.rotationSpeed = 0; // No rotation
        this.bobSpeed = 1.5;
        this.bobAmount = 3;
        this.bobTimer = 0;
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Now set up physics body after it's been added
        this.setCircle(12);
        this.setCollideWorldBounds(false);
        
        // Set up initial movement
        this.setupMovement();
    }

    setupMovement() {
        // Start from top of screen, moving downward with zig-zag
        const width = this.scene.cameras.main.width;
        
        // Set initial position at top of screen
        this.x = Phaser.Math.Between(50, width - 50);
        this.y = -50;
        
        // Set initial velocity (downward with slight zig-zag)
        this.setVelocity(0, this.speed);
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update zig-zag timer
        this.zigzagTimer += delta * this.zigzagFrequency / 1000;
        
        // Calculate zig-zag movement
        const zigzagOffset = Math.sin(this.zigzagTimer) * this.zigzagAmplitude;
        const zigzagVelocity = Math.cos(this.zigzagTimer) * this.zigzagAmplitude * this.zigzagFrequency * 0.1;
        
        // Apply zig-zag movement while maintaining downward motion
        this.setVelocity(zigzagVelocity, this.speed);

        // Update bobbing motion
        this.bobTimer += delta * this.bobSpeed / 1000;
        const bobOffset = Math.sin(this.bobTimer) * this.bobAmount;
        this.y += bobOffset * delta / 1000;

        // Check if off screen
        if (this.isOffScreen()) {
            this.destroy();
        }
    }

    takeDamage() {
        if (this.isDead) return;

        this.health--;
        this.isDamaged = true;
        
        // Visual damage feedback - turn red
        this.setTint(0xff0000);
        
        // Create damage effect
        this.createDamageEffect();
        
        if (this.health <= 0) {
            this.die();
        } else {
            // Reset tint after a short delay
            this.scene.time.delayedCall(500, () => {
                if (!this.isDead) {
                    this.clearTint();
                    this.isDamaged = false;
                }
            });
        }
    }

    createDamageEffect() {
        // Create damage sparkles
        for (let i = 0; i < 5; i++) {
            const sparkle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-10, 10),
                this.y + Phaser.Math.Between(-10, 10),
                Phaser.Math.FloatBetween(1, 2),
                0xff0000
            );
            
            this.scene.tweens.add({
                targets: sparkle,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }
    }

    die() {
        this.isDead = true;
        this.health = 0;
        
        // Create explosion effect
        this.createExplosion();
        
        // Destroy the UFO
        this.destroy();
    }

    createExplosion() {
        // Create explosion effect
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-15, 15),
                this.y + Phaser.Math.Between(-15, 15),
                Phaser.Math.FloatBetween(2, 4),
                0xff4500
            );
            
            this.scene.tweens.add({
                targets: particle,
                scale: 0,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    isOffScreen() {
        if (!this.scene) return false;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        return this.x < -this.width - 50 || 
               this.x > width + 50 || 
               this.y < -this.height - 50 || 
               this.y > height + 50;
    }

    destroy() {
        this.isDead = true;
        super.destroy();
    }

    // Getters
    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    getScoreValue() {
        return 200;
    }

    isActive() {
        return !this.isDead && this.health > 0;
    }
} 