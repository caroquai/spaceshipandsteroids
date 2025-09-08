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
        this.setBounce(1, 1);
        this.setCollideWorldBounds(false);
        
        // Set velocity downward
        this.setVelocity(0, speed);
        
        // Ensure physics body is enabled
        if (this.body) {
            this.body.setEnable(true);
            this.body.setGravity(0, 0);
        }
        
        // Add rotation for visual effect
        this.rotationSpeed = 2;
        
        // Set tint for boss rockets
        this.setTint(0xff0000); // Red tint for boss rockets
    }

    update(time, delta) {
        if (this.isDead) return;

        // Update rotation
        this.rotation += this.rotationSpeed * delta / 1000;
        
        // Ensure velocity is maintained
        if (this.body && this.body.velocity) {
            // Force update position based on velocity
            this.x += this.body.velocity.x * delta / 1000;
            this.y += this.body.velocity.y * delta / 1000;
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