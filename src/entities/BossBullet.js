export class BossBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, velocityX, velocityY, size = 'medium') {
        const textureKey = `asteroid-${size}`;
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.size = size;
        this.isDead = false;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        
        // Set properties based on size
        this.setSizeProperties();
        
        // Add to scene first
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.setCircle(this.radius);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(false);
        
        // Set velocity and ensure physics body is enabled
        this.setVelocity(velocityX, velocityY);
        if (this.body) {
            this.body.setEnable(true);
            this.body.setGravity(0, 0);
        }
        
        // Set tint for boss bullets
        this.setTint(0xff0000); // Red tint for boss bullets
        
        // Add rotation for visual effect
        this.rotationSpeed = Phaser.Math.FloatBetween(-2, 2);
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

    update(time, delta) {
        if (this.isDead) return;

        // Update rotation
        this.rotation += this.rotationSpeed * delta / 1000;
        
        // Ensure velocity is maintained
        if (this.body && this.body.velocity) {
            // Force update position based on velocity
            this.x += this.body.velocity.x * delta / 1000;
            this.y += this.body.velocity.y * delta / 1000;
            
            // Debug: Log movement every 30 frames
            if (Math.random() < 0.03) {
                console.log(`Boss bullet moving: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, vx=${this.body.velocity.x.toFixed(1)}, vy=${this.body.velocity.y.toFixed(1)}`);
            }
        }
        
        // Wrap around screen edges
        this.wrapAroundScreen();
        
        // Check if bullet is off-screen for too long
        this.checkOffScreen();
    }

    wrapAroundScreen() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        if (this.x < -this.width) this.x = width;
        if (this.x > width) this.x = -this.width;
        if (this.y < -this.height) this.y = height;
        if (this.y > height) this.y = -this.height;
    }

    checkOffScreen() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // If bullet is off-screen for too long, destroy it
        if (this.x < -100 || this.x > width + 100 || 
            this.y < -100 || this.y > height + 100) {
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
        return 50; // Boss bullets give points when destroyed
    }
} 