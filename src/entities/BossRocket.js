export class BossRocket extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, speed = 300) {
        super(scene, x, y, 'boss_rocket');
        
        this.scene = scene;
        this.isDead = false;
        this.speed = speed;
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCircle(8);
        this.setBounce(0, 0); // Changed from (1, 1) to (0, 0) - no bouncing
        this.setCollideWorldBounds(false);
        
        // Ensure physics body is enabled and configured
        if (this.body) {
            this.body.setEnable(true);
            this.body.setGravity(0, 0);
            this.body.setDrag(0, 0); // No drag
            this.body.setMaxVelocity(1000, 1000); // High max velocity
        }
        
        // Set velocity downward
        this.setVelocity(0, speed);
        
        console.log(`Boss rocket created: x=${x}, y=${y}, speed=${speed}, velocity set to (0, ${speed})`);
        
        // Add rotation for visual effect
        this.rotationSpeed = 2;
        
        // Set tint for boss rockets
        this.setTint(0xff0000); // Red tint for boss rockets
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update rotation
        this.rotation += this.rotationSpeed * delta / 1000;
        
        // Move the rocket directly using position updates
        this.y += this.speed * delta / 1000;
        
        // Debug: Log rocket movement every 60 frames
        if (Math.random() < 0.02) {
            console.log(`Boss rocket moving: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, speed=${this.speed}`);
        }
        
        // Check if rocket is off-screen
        this.checkOffScreen();
    }

    checkOffScreen() {
        const height = this.scene.cameras.main.height;
        
        // If rocket is below screen, destroy it
        if (this.y > height + 50) {
            this.destroy();
        }
    }

    takeDamage() {
        this.isDead = true;
        
        // Create explosion effect
        if (this.scene) {
            this.scene.createExplosion(this.x, this.y);
            this.scene.playSound('asteroid_small_blast', 0.4);
        }
        
        this.destroy();
    }

    destroy() {
        this.isDead = true;
        super.destroy();
    }

    getScoreValue() {
        return 50; // Boss rockets give points when destroyed
    }
} 