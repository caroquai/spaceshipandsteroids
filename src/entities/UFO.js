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
        this.movementPattern = this.getRandomMovementPattern();
        this.movementTimer = 0;
        this.movementDuration = 5000; // 5 seconds per movement phase
        
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

    getRandomMovementPattern() {
        // Only use left to right movement pattern
        return 'leftToRight';
    }

    setupMovement() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Only left to right movement
        if (this.x < width / 2) {
            // UFO spawned from left side, move right
            this.setVelocity(this.speed, 0);
        } else {
            // UFO spawned from right side, move left
            this.setVelocity(-this.speed, 0);
        }
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update movement timer
        this.movementTimer += delta;
        if (this.movementTimer >= this.movementDuration) {
            this.changeDirection();
            this.movementTimer = 0;
        }

        // No rotation - keep UFO image static
        // this.rotation += this.rotationSpeed * delta / 1000;

        // Update bobbing motion
        this.bobTimer += delta * this.bobSpeed / 1000;
        const bobOffset = Math.sin(this.bobTimer) * this.bobAmount;
        this.y += bobOffset * delta / 1000;

        // Check if off screen
        if (this.isOffScreen()) {
            this.destroy();
        }
    }

    changeDirection() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Reverse direction or change pattern
        if (Math.random() < 0.3) {
            this.movementPattern = this.getRandomMovementPattern();
            this.setupMovement();
        } else {
            // Reverse current velocity
            this.setVelocity(-this.body.velocity.x, -this.body.velocity.y);
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
        return 200; // UFOs give more points than asteroids
    }

    isActive() {
        return !this.isDead && this.health > 0;
    }
} 