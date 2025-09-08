import { BossRocket } from './BossRocket.js';

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_green');
        
        this.scene = scene;
        this.maxHP = 30;
        this.currentHP = 30;
        this.isDead = false;
        this.isAppearing = true;
        this.phase = 1; // 1: normal, 2: aggressive (25% HP)
        
        // Robot movement properties
        this.moveSpeed = 100; // Faster base movement
        this.moveDirection = 1; // 1 for right, -1 for left
        this.verticalSpeed = 50; // Faster vertical movement
        this.verticalDirection = 1;
        this.aggressiveMoveSpeed = 150; // Much faster when aggressive
        this.aggressiveVerticalSpeed = 80; // Faster vertical when aggressive
        
        // Robot-specific properties
        this.robotSegments = 4; // Number of movement segments
        this.currentSegment = 0;
        this.segmentTimer = 0;
        this.segmentDuration = 800; // Time per movement segment (ms)
        this.aggressiveSegmentDuration = 500; // Faster segments when aggressive
        
        // Robot visual effects
        this.robotGlow = null;
        this.mechanicalParticles = null;
        this.rotationSpeed = 0.5; // Degrees per frame
        this.aggressiveRotationSpeed = 1.2;
        
        // Shooting properties
        this.shootTimer = 0;
        this.shootInterval = 1800; // 1.8 seconds between shots (faster)
        this.aggressiveShootInterval = 1000; // 1 second when aggressive (much faster)
        
        // Visual properties
        this.hpBar = null;
        this.hpBarBackground = null;
        this.hpBarFill = null;
        this.hitEffect = null;
        
        // Setup the boss
        this.setupBoss();
    }
    
    setupBoss() {
        // Set up physics body
        this.scene.physics.add.existing(this);
        this.body.setSize(80, 80); // Adjust hitbox size
        
        // Start with 0 alpha for appearance effect
        this.setAlpha(0);
        this.setScale(0.5);
        
        // Create robot visual effects
        this.createRobotEffects();
        
        // Create HP bar
        this.createHPBar();
        
        // Start appearance animation
        this.startAppearanceAnimation();
    }
    
    createHPBar() {
        const barWidth = 120;
        const barHeight = 8;
        const barX = this.x;
        const barY = this.y - 60;
        
        // HP bar background
        this.hpBarBackground = this.scene.add.rectangle(
            barX, barY, barWidth, barHeight, 0x333333, 0.8
        );
        
        // HP bar fill
        this.hpBarFill = this.scene.add.rectangle(
            barX, barY, barWidth, barHeight, 0x00ff00, 1
        );
        
        // Set origin to center for proper positioning
        this.hpBarBackground.setOrigin(0.5);
        this.hpBarFill.setOrigin(0, 0.5);
        
        // Position the fill bar correctly
        this.hpBarFill.x = barX - barWidth / 2;
        
        // Add to scene's display list
        this.scene.add.existing(this.hpBarBackground);
        this.scene.add.existing(this.hpBarFill);
    }
    
    createRobotEffects() {
        // Create mechanical glow effect
        this.robotGlow = this.scene.add.graphics();
        this.robotGlow.lineStyle(3, 0x00ff00, 0.6);
        this.robotGlow.strokeCircle(this.x, this.y, 50);
        this.robotGlow.setVisible(false);
        
        // Create mechanical particle system
        this.mechanicalParticles = this.scene.add.particles('bullet');
        this.mechanicalParticles.setVisible(false);
    }
    
    startAppearanceAnimation() {
        // Play boss appear sound
        this.scene.playSound('boss_appear', 0.7);
        
        // Move boss from top to center
        this.y = -100;
        
        // Robot-like appearance with mechanical effects
        this.scene.tweens.add({
            targets: this,
            y: this.scene.cameras.main.height / 2 - 100,
            alpha: 1,
            scale: 1,
            duration: 3000,
            ease: 'Stepped', // Stepped easing for robotic movement
            steps: 30, // 30 steps for mechanical appearance
            onComplete: () => {
                this.isAppearing = false;
                this.startMovement();
                this.robotGlow.setVisible(true);
                this.mechanicalParticles.setVisible(true);
            }
        });
        
        // Animate HP bar appearance
        this.scene.tweens.add({
            targets: [this.hpBarBackground, this.hpBarFill],
            alpha: 1,
            duration: 3000,
            ease: 'Power2'
        });
    }
    
    startMovement() {
        // Start normal movement pattern
        this.movePattern = this.scene.time.addEvent({
            delay: 100,
            callback: this.updateMovement,
            callbackScope: this,
            loop: true
        });
    }
    
    updateMovement() {
        if (this.isDead || this.isAppearing) return;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Update segment timer
        const currentSegmentDuration = this.phase === 1 ? this.segmentDuration : this.aggressiveSegmentDuration;
        this.segmentTimer += 16; // Assuming 60fps (16ms per frame)
        
        // Robot segmented movement
        if (this.segmentTimer >= currentSegmentDuration) {
            this.segmentTimer = 0;
            this.currentSegment = (this.currentSegment + 1) % this.robotSegments;
            
            // Change direction at segment boundaries
            if (this.currentSegment === 0) {
                this.moveDirection *= -1;
            }
            if (this.currentSegment === 2) {
                this.verticalDirection *= -1;
            }
            
            // Create mechanical effect at direction change
            this.createMechanicalEffect();
        }
        
        // Calculate movement based on current phase
        let moveSpeed, verticalSpeed;
        if (this.phase === 1) {
            moveSpeed = this.moveSpeed;
            verticalSpeed = this.verticalSpeed;
        } else {
            moveSpeed = this.aggressiveMoveSpeed;
            verticalSpeed = this.aggressiveVerticalSpeed;
        }
        
        // Robot-like movement with discrete steps
        const stepSize = 2; // Pixels per step
        this.x += moveSpeed * this.moveDirection * 0.1;
        this.y += verticalSpeed * this.verticalDirection * 0.05;
        
        // Keep boss within bounds
        if (this.x <= 100 || this.x >= width - 100) {
            this.x = Math.max(100, Math.min(width - 100, this.x));
            this.moveDirection *= -1;
        }
        
        if (this.y <= 100 || this.y >= height / 2) {
            this.y = Math.max(100, Math.min(height / 2, this.y));
            this.verticalDirection *= -1;
        }
        
        // Robot rotation effect
        const rotationSpeed = this.phase === 1 ? this.rotationSpeed : this.aggressiveRotationSpeed;
        this.rotation += Phaser.Math.DegToRad(rotationSpeed);
        
        // Update visual effects
        this.updateRobotEffects();
        
        // Update HP bar position
        this.updateHPBarPosition();
    }
    
    createMechanicalEffect() {
        // Create mechanical spark effect
        for (let i = 0; i < 5; i++) {
            const spark = this.scene.add.circle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-20, 20),
                2,
                0x00ff00
            );
            
            this.scene.tweens.add({
                targets: spark,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    if (spark && spark.active) {
                        spark.destroy();
                    }
                }
            });
        }
        
        // Flash the robot glow
        if (this.robotGlow) {
            this.robotGlow.setAlpha(1);
            this.scene.tweens.add({
                targets: this.robotGlow,
                alpha: 0.6,
                duration: 200,
                ease: 'Power2'
            });
        }
    }
    
    updateRobotEffects() {
        // Update robot glow position
        if (this.robotGlow) {
            this.robotGlow.clear();
            this.robotGlow.lineStyle(3, 0x00ff00, 0.6);
            this.robotGlow.strokeCircle(0, 0, 50);
            this.robotGlow.x = this.x;
            this.robotGlow.y = this.y;
        }
        
        // Update mechanical particles
        if (this.mechanicalParticles && this.phase === 2) {
            // Emit particles more frequently in aggressive phase
            if (Math.random() < 0.1) { // 10% chance per frame
                const particle = this.scene.add.circle(
                    this.x + Phaser.Math.Between(-15, 15),
                    this.y + Phaser.Math.Between(-15, 15),
                    1,
                    0x00ff00
                );
                
                this.scene.tweens.add({
                    targets: particle,
                    y: particle.y + 20,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        if (particle && particle.active) {
                            particle.destroy();
                        }
                    }
                });
            }
        }
    }
    
    updateHPBarPosition() {
        if (this.hpBarBackground && this.hpBarFill) {
            this.hpBarBackground.x = this.x;
            this.hpBarBackground.y = this.y - 60;
            this.hpBarFill.x = this.x - 60; // Half of bar width
            this.hpBarFill.y = this.y - 60;
        }
    }
    
    update(time, delta) {
        if (this.isDead || this.isAppearing) return;
        
        // Update shooting timer
        this.shootTimer += delta;
        const currentShootInterval = this.phase === 1 ? this.shootInterval : this.aggressiveShootInterval;
        
        if (this.shootTimer >= currentShootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
        
        // Check for phase transition
        if (this.phase === 1 && this.currentHP <= this.maxHP * 0.25) {
            this.transitionToAggressivePhase();
        }
    }
    
    shoot() {
        if (this.isDead || this.isAppearing) return;
        
        // Check if scene and spaceship exist
        if (!this.scene || !this.scene.spaceship) return;
        
        const rocketSpeed = this.phase === 1 ? 250 : 350;
        
        if (this.phase === 1) {
            // Phase 1: 3 rockets in a spread pattern
            const spreadPositions = [-30, 0, 30]; // Horizontal spread
            
            spreadPositions.forEach(offset => {
                // Create boss rocket
                const rocket = new BossRocket(this.scene, this.x + offset, this.y, rocketSpeed);
                
                // Add to scene's boss bullets group
                if (this.scene.bossBullets) {
                    this.scene.bossBullets.add(rocket);
                }
                
                // Debug: Log rocket creation
                console.log(`Boss rocket created: x=${this.x + offset}, speed=${rocketSpeed}`);
            });
        } else {
            // Phase 2: Aggressive - 5 rockets in a wider spread
            const aggressivePositions = [-40, -20, 0, 20, 40]; // Wider spread
            
            aggressivePositions.forEach(offset => {
                // Create boss rocket
                const rocket = new BossRocket(this.scene, this.x + offset, this.y, rocketSpeed);
                
                // Add to scene's boss bullets group
                if (this.scene.bossBullets) {
                    this.scene.bossBullets.add(rocket);
                }
                
                // Debug: Log rocket creation
                console.log(`Boss rocket created (aggressive): x=${this.x + offset}, speed=${rocketSpeed}`);
            });
        }
        
        // Create shooting effect
        this.createShootingEffect();
    }

    createShootingEffect() {
        // Create muzzle flash effect
        const flash = this.scene.add.circle(
            this.x,
            this.y,
            15,
            0xffff00,
            0.8
        );
        
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Create recoil effect
        this.scene.tweens.add({
            targets: this,
            x: this.x + (this.phase === 1 ? 5 : 10),
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    transitionToAggressivePhase() {
        this.phase = 2;
        
        // Robot-like phase transition with mechanical effects
        this.scene.tweens.add({
            targets: this,
            scale: 1.3,
            duration: 300,
            ease: 'Stepped',
            steps: 6,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    scale: 1,
                    duration: 200,
                    ease: 'Stepped',
                    steps: 4
                });
            }
        });
        
        // Create intense mechanical effect
        for (let i = 0; i < 15; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                this.createMechanicalEffect();
            });
        }
        
        // Change robot glow color to red
        if (this.robotGlow) {
            this.robotGlow.clear();
            this.robotGlow.lineStyle(4, 0xff0000, 0.8);
            this.robotGlow.strokeCircle(0, 0, 60);
        }
        
        // Change HP bar color to red
        if (this.hpBarFill) {
            this.hpBarFill.setFillStyle(0xff0000);
        }
        
        // Increase rotation speed for aggressive phase
        this.rotationSpeed = this.aggressiveRotationSpeed;
    }
    
    takeDamage(damage = 1) {
        if (this.isDead) return;
        
        this.currentHP -= damage;
        
        // Update HP bar
        this.updateHPBar();
        
        // Create hit effect
        this.createHitEffect();
        
        // Check if boss is defeated
        if (this.currentHP <= 0) {
            this.die();
        }
    }
    
    updateHPBar() {
        if (this.hpBarFill) {
            const healthPercentage = this.currentHP / this.maxHP;
            const barWidth = 120;
            this.hpBarFill.width = barWidth * healthPercentage;
        }
    }
    
    createHitEffect() {
        // Flash red
        this.setTint(0xff0000);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
                this.clearTint();
                this.setAlpha(1);
            }
        });
    }
    
    die() {
        this.isDead = true;
        
        // Stop movement
        if (this.movePattern) {
            this.movePattern.destroy();
        }
        
        // Show defeated sprite
        this.setTexture('boss_defeated');
        
        // Create explosion effect
        this.scene.createExplosion(this.x, this.y);
        
        // Hide HP bar
        if (this.hpBarBackground) this.hpBarBackground.setVisible(false);
        if (this.hpBarFill) this.hpBarFill.setVisible(false);
        
        // Play winning sound
        this.scene.playSound('winning_stage', 0.8);
        
        // Show defeated sprite for 3 seconds
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // Add score
        this.scene.gameData.score += 1000;
        this.scene.game.registry.set('gameData', this.scene.gameData);
        
        // Trigger stage completion
        this.scene.completeBossStage();
    }
    
    destroy() {
        // Clean up HP bar
        if (this.hpBarBackground) {
            this.hpBarBackground.destroy();
        }
        if (this.hpBarFill) {
            this.hpBarFill.destroy();
        }
        
        // Clean up robot effects
        if (this.robotGlow) {
            this.robotGlow.destroy();
        }
        if (this.mechanicalParticles) {
            this.mechanicalParticles.destroy();
        }
        
        // Stop movement pattern
        if (this.movePattern) {
            this.movePattern.destroy();
        }
        
        super.destroy();
    }
} 