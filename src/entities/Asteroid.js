export class Asteroid extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, size = 'medium') {
        const textureKey = `asteroid-${size}`;
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.size = size;
        this.isDead = false;
        
        // Set properties based on size
        this.setSizeProperties();
        
        // Movement and rotation
        this.rotationSpeed = this.getRotationSpeedForSize();
        
        // Health and damage
        this.health = this.getHealthForSize();
        this.maxHealth = this.health;
        
        // Visual effects
        this.damageFlashTimer = 0;
        this.damageFlashDuration = 100;
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Now set up physics body after it's been added
        this.setCircle(this.radius);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(false);
    }

    setSizeProperties() {
        switch (this.size) {
            case 'large':
                this.radius = 24;
                this.setScale(1);
                break;
            case 'medium':
                this.radius = 16;
                this.setScale(0.67);
                break;
            case 'small':
                this.radius = 12;
                this.setScale(0.5);
                break;
            default:
                this.radius = 16;
                this.setScale(0.67);
        }
    }

    getRotationSpeedForSize() {
        switch (this.size) {
            case 'large': return Phaser.Math.FloatBetween(-1.5, 1.5); // Slower rotation for large
            case 'medium': return Phaser.Math.FloatBetween(-2.5, 2.5); // Medium rotation for medium
            case 'small': return 0; // No rotation for small asteroids
            default: return 0;
        }
    }

    getHealthForSize() {
        switch (this.size) {
            case 'large': return 3;
            case 'medium': return 2;
            case 'small': return 1;
            default: return 1;
        }
    }

    getScoreValue() {
        switch (this.size) {
            case 'large': return 20;
            case 'medium': return 50;
            case 'small': return 100;
            default: return 50;
        }
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update rotation for large and medium asteroids
        if (this.size === 'large' || this.size === 'medium') {
            this.rotation += this.rotationSpeed * delta / 1000;
        }
        
        // Update damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= delta;
            if (this.damageFlashTimer <= 0) {
                this.setTint(0xffffff);
            }
        }
        
        // Wrap around screen edges
        this.wrapAroundScreen();
    }

    takeDamage() {
        this.health--;
        this.damageFlashTimer = this.damageFlashDuration;
        this.setTint(0xff0000);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.isDead = true;
        
        // Create smaller asteroids if not already small
        if (this.size !== 'small') {
            this.createSmallerAsteroids();
        }
        
        // Call parent destroy method
        super.destroy();
    }

    createSmallerAsteroids() {
        if (!this.scene) return;

        const count = this.size === 'large' ? 2 : 1;
        const newSize = this.size === 'large' ? 'medium' : 'small';
        
        for (let i = 0; i < count; i++) {
            const asteroid = new Asteroid(this.scene, this.x, this.y, newSize);
            this.scene.asteroids.add(asteroid);
            
            // Set random velocity
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(50, 150);
            asteroid.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    wrapAroundScreen() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        if (this.x < -this.width) this.x = width;
        if (this.x > width) this.x = -this.width;
        if (this.y < -this.height) this.y = height;
        if (this.y > height) this.y = -this.height;
    }

    setVelocity(x, y) {
        super.setVelocity(x, y);
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    // Getters
    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    getSize() {
        return this.size;
    }

    getRadius() {
        return this.radius;
    }
} 