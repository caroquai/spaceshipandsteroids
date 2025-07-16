export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        
        this.scene = scene;
        this.isDead = false;
        
        // Lifetime
        this.lifetime = 3000; // milliseconds
        this.maxLifetime = this.lifetime;
        this.createdTime = scene.time.now;
        
        // Movement
        this.speed = 400;
        
        // Strong laser properties
        this.isStrongLaser = false;
        
        // Visual effects
        this.trailTimer = 0;
        this.trailInterval = 200; // Much longer interval to reduce trail frequency significantly
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Now set up physics body after it's been added
        this.setCircle(4);
        this.setCollideWorldBounds(false);
        
        // Ensure physics body is active
        this.body.setEnable(true);
        
        // Set up visual appearance immediately
        this.updateVisualAppearance();
        
        // Ensure the bullet is visible
        this.setVisible(true);
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update lifetime
        this.lifetime -= delta;
        if (this.lifetime <= 0) {
            this.destroy();
            return;
        }

        // Debug: Log bullet position and velocity (commented out to reduce console spam)
        // if (this.body && this.body.velocity) {
        //     console.log(`Bullet at (${this.x}, ${this.y}) with velocity (${this.body.velocity.x}, ${this.body.velocity.y})`);
        // }

        // Update trail effect - completely disabled to prevent yellow dot accumulation
        // this.trailTimer += delta;
        // if (this.trailTimer >= this.trailInterval) {
        //     // Only create trails for strong laser bullets (no yellow dots for normal bullets)
        //     if (this.isStrongLaser && Math.random() < 0.1) {
        //         this.createTrail();
        //     }
        //     this.trailTimer = 0;
        // }

        // Update alpha based on lifetime
        const alpha = this.lifetime / this.maxLifetime;
        this.setAlpha(alpha);
        
        // Update visual appearance for strong laser
        this.updateVisualAppearance();
        
        // Check if off screen
        if (this.isOffScreen()) {
            this.destroy();
        }
    }

    createTrail() {
        // Create bullet trail effect based on laser type
        const trailColor = this.isStrongLaser ? 0xff4400 : 0xffff00;
        const trailSize = this.isStrongLaser ? 4 : 1; // Much larger trails for strong laser
        
        const trail = this.scene.add.circle(
            this.x + Phaser.Math.Between(-2, 2),
            this.y + Phaser.Math.Between(-2, 2),
            trailSize,
            trailColor
        );
        
        this.scene.tweens.add({
            targets: trail,
            scale: 0,
            alpha: 0,
            duration: this.isStrongLaser ? 300 : 50, // Shorter duration for normal trails
            ease: 'Power2',
            onComplete: () => {
                if (trail && trail.active) {
                    trail.destroy();
                }
            }
        });
        
        // Force destroy after a maximum time to prevent accumulation
        this.scene.time.delayedCall(200, () => {
            if (trail && trail.active) {
                trail.destroy();
            }
        });
    }

    isOffScreen() {
        if (!this.scene) return false;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Give bullets more room before destroying them
        const margin = 50;
        
        return this.x < -this.width - margin || 
               this.x > width + margin || 
               this.y < -this.height - margin || 
               this.y > height + margin;
    }

    destroy() {
        this.isDead = true;
        super.destroy();
    }

    setVelocity(x, y) {
        super.setVelocity(x, y);
        
        // Debug: Log velocity to see if it's being set correctly
        console.log(`Bullet velocity set to: (${x}, ${y})`);
        
        // Ensure the physics body is enabled and active
        if (this.body) {
            this.body.setEnable(true);
            console.log(`Bullet body enabled, velocity: (${this.body.velocity.x}, ${this.body.velocity.y})`);
        }
    }

    setSpeed(speed) {
        this.speed = speed;
        const velocity = this.body.velocity;
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (magnitude > 0) {
            this.setVelocity(
                (velocity.x / magnitude) * speed,
                (velocity.y / magnitude) * speed
            );
        }
    }

    setStrongLaser(isStrong) {
        this.isStrongLaser = isStrong;
        this.updateVisualAppearance();
    }

    updateVisualAppearance() {
        if (this.isStrongLaser) {
            // Make strong laser much bigger and more distinct
            this.setScale(2.0); // Much larger than before
            this.setTint(0xff4400); // Brighter orange-red
            this.setCircle(8); // Much larger collision circle
        } else {
            // Normal laser appearance - ensure it's visible
            this.setScale(1);
            this.setTint(0xffff00); // Yellow color for normal bullets
            this.setCircle(6); // Match the texture size
        }
    }

    // Check if this bullet can pass through an asteroid
    canPassThrough(asteroid) {
        if (!this.isStrongLaser) return false;
        
        // Strong laser can pass through small and medium asteroids
        return asteroid.size === 'small' || asteroid.size === 'medium';
    }

    // Check if this bullet should destroy large asteroid instantly
    shouldDestroyLargeAsteroid(asteroid) {
        return this.isStrongLaser && asteroid.size === 'large';
    }

    // Getters
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