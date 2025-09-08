export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.createLoadingBar();
        this.loadAssets();
    }

    createLoadingBar() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '14px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);
        
        // Update loading bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x4a90e2, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });
        
        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading asset: ' + file.key);
        });
        
        this.load.on('complete', () => {
            console.log('All assets loaded (or failed with fallbacks)');
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
            
            // Also hide the HTML loading screen as a fallback
            const htmlLoadingScreen = document.getElementById('loading-screen');
            if (htmlLoadingScreen) {
                console.log('Hiding HTML loading screen from PreloadScene');
                htmlLoadingScreen.style.display = 'none';
            }
        });
    }

    loadAssets() {
        // Load sprites
        this.load.image('spaceship', 'assets/sprites/spaceship.png');
        this.load.image('asteroid-large', 'assets/sprites/asteroid_large.png');
        this.load.image('asteroid-medium', 'assets/sprites/asteroid_medium.png');
        this.load.image('asteroid-small', 'assets/sprites/asteroid_small.png');
        this.load.image('bullet', 'assets/sprites/bullet.png');
        this.load.image('powerup', 'assets/sprites/powerup.png');
        this.load.image('ufo', 'assets/sprites/ufo.png');
        this.load.image('explosion', 'assets/sprites/explosion.png');
        this.load.image('background', 'assets/sprites/background.png');
        this.load.image('lady', 'assets/sprites/lady.png');
        this.load.image('item_speed', 'assets/sprites/item_speed.png');
        this.load.image('boss_green', 'assets/sprites/5_boss_green.png');
        this.load.image('boss_defeated', 'assets/sprites/5_boss_defeated.png');
        this.load.image('boss_rocket', 'assets/sprites/boss_rocket.png');
        this.load.image('support_ship', 'assets/sprites/support_ship.png');
        this.load.image('venus_bg', 'assets/sprites/venus_bg.png');
        
        // Load sounds (optional - game will work without them)
        this.load.audio('laser_normal', 'assets/sounds/laser_standard.ogg');
        this.load.audio('laser_triple', 'assets/sounds/laser_triple.ogg');
        this.load.audio('laser_strong', 'assets/sounds/laser_strong.ogg');
        this.load.audio('asteroid_small_blast', 'assets/sounds/asteroid_small_blast.ogg');
        this.load.audio('asteroid_medium_blast', 'assets/sounds/asteroid_medium_blast.ogg');
        this.load.audio('asteroid_large_blast', 'assets/sounds/asteroid_large_blast.ogg');
        this.load.audio('ufo_blast', 'assets/sounds/ufo_blast.ogg');
        this.load.audio('skyler_heart', 'assets/sounds/skyler_heart.ogg');
        this.load.audio('skyler_rapidfire', 'assets/sounds/skyler_rapidfire.ogg');
        this.load.audio('skyler_shield', 'assets/sounds/skyler_shield.ogg');
        this.load.audio('skyler_trippleshot', 'assets/sounds/skyler_trippleshot.ogg');
        this.load.audio('skyler_speed', 'assets/sounds/skyler_speed.ogg');
        this.load.audio('skyler_stronglaser', 'assets/sounds/skyler_stronglaser.ogg');
        this.load.audio('gameOver', 'assets/sounds/gameOver.ogg');
        this.load.audio('gameStart', 'assets/sounds/gameStart.ogg');
        this.load.audio('blast', 'assets/sounds/blast.ogg');
        this.load.audio('gameMusic', 'assets/sounds/spaceship_and_beyond.ogg');
        this.load.audio('ship_destroyed', 'assets/sounds/ship_destroyed.ogg');
        this.load.audio('item_collected', 'assets/sounds/item_collected.ogg');
        this.load.audio('item_appear', 'assets/sounds/item_appear.ogg');
        this.load.audio('boss_appear', 'assets/sounds/boss_appear.ogg');
        this.load.audio('boss_ladyvoice_1', 'assets/sounds/boss_ladyvoice_1.ogg');
        this.load.audio('venus_lady', 'assets/sounds/venus_lady.ogg');
        this.load.audio('winning_stage', 'assets/sounds/winning_stage.ogg');
        
        // Create fallback graphics if assets fail to load
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load asset:', file.key);
            this.createFallbackAsset(file.key);
        });
        
        // Add a timeout to ensure loading completes even if some assets fail
        setTimeout(() => {
            if (this.load.isLoading()) {
                console.log('Loading timeout reached, forcing completion');
                this.load.emit('complete');
            }
        }, 5000); // 5 second timeout
    }

    createFallbackAsset(key) {
        // Create fallback graphics for missing assets
        const graphics = this.add.graphics();
        
        switch (key) {
            case 'spaceship':
                graphics.fillStyle(0x4a90e2);
                graphics.fillTriangle(16, 0, 0, 32, 32, 32);
                graphics.generateTexture('spaceship', 32, 32);
                break;
            case 'asteroid-large':
                graphics.fillStyle(0x8B4513);
                graphics.fillCircle(24, 24, 24);
                graphics.generateTexture('asteroid-large', 48, 48);
                break;
            case 'asteroid-medium':
                graphics.fillStyle(0x8B4513);
                graphics.fillCircle(16, 16, 16);
                graphics.generateTexture('asteroid-medium', 32, 32);
                break;
            case 'asteroid-small':
                graphics.fillStyle(0x8B4513);
                graphics.fillCircle(12, 12, 12);
                graphics.generateTexture('asteroid-small', 24, 24);
                break;
            case 'bullet':
                graphics.fillStyle(0xffff00);
                graphics.fillCircle(8, 8, 6);
                graphics.generateTexture('bullet', 16, 16);
                break;
            case 'powerup':
                graphics.fillStyle(0x00ff00);
                graphics.fillCircle(8, 8, 8);
                graphics.generateTexture('powerup', 16, 16);
                break;
            case 'ufo':
                // Create UFO fallback - flying saucer shape
                graphics.fillStyle(0x00ff00);
                graphics.fillEllipse(16, 12, 24, 8); // Bottom part
                graphics.fillStyle(0x008000);
                graphics.fillEllipse(16, 8, 16, 6);  // Top part
                graphics.fillStyle(0xffffff);
                graphics.fillCircle(16, 8, 2);       // Center light
                graphics.generateTexture('ufo', 32, 24);
                break;
            case 'explosion':
                // Create explosion fallback - expanding circles
                graphics.fillStyle(0xff6600);
                graphics.fillCircle(16, 16, 12);
                graphics.fillStyle(0xffff00);
                graphics.fillCircle(16, 16, 8);
                graphics.fillStyle(0xffffff);
                graphics.fillCircle(16, 16, 4);
                graphics.generateTexture('explosion', 32, 32);
                break;
            case 'background':
                // Create simple starfield background
                graphics.fillStyle(0x000011);
                graphics.fillRect(0, 0, 800, 600);
                // Add some stars
                graphics.fillStyle(0xffffff);
                for (let i = 0; i < 50; i++) {
                    graphics.fillCircle(
                        Math.random() * 800,
                        Math.random() * 600,
                        Math.random() * 2
                    );
                }
                graphics.generateTexture('background', 800, 600);
                break;
            case 'venus_bg':
                // Create Venus background fallback
                // Dark space background
                graphics.fillStyle(0x000022);
                graphics.fillRect(0, 0, 800, 600);
                
                // Venus planet (large orange/yellow circle)
                graphics.fillStyle(0xff8c00); // Orange
                graphics.fillCircle(600, 200, 120);
                
                // Venus atmosphere glow
                graphics.fillStyle(0xffa500, 0.3); // Semi-transparent orange
                graphics.fillCircle(600, 200, 140);
                
                // Venus surface details
                graphics.fillStyle(0xff6b35); // Darker orange
                graphics.fillCircle(580, 180, 80);
                graphics.fillCircle(620, 220, 60);
                
                // Add some cloud-like features
                graphics.fillStyle(0xffd700, 0.4); // Golden clouds
                graphics.fillEllipse(590, 190, 40, 20);
                graphics.fillEllipse(610, 210, 30, 15);
                
                // Add distant stars
                graphics.fillStyle(0xffffff);
                for (let i = 0; i < 30; i++) {
                    graphics.fillCircle(
                        Math.random() * 800,
                        Math.random() * 600,
                        Math.random() * 1.5
                    );
                }
                
                graphics.generateTexture('venus_bg', 800, 600);
                break;
            case 'lady':
                // Create lady avatar fallback - simple character silhouette
                graphics.fillStyle(0xff69b4); // Pink color
                graphics.fillCircle(16, 12, 8); // Head
                graphics.fillStyle(0x4169e1); // Blue dress
                graphics.fillTriangle(8, 20, 24, 20, 16, 32); // Dress
                graphics.fillStyle(0xff69b4); // Arms
                graphics.fillRect(4, 16, 4, 8); // Left arm
                graphics.fillRect(24, 16, 4, 8); // Right arm
                graphics.generateTexture('lady', 32, 32);
                break;
            default:
                // For any other missing assets (like sounds), just log and continue
                console.log('No fallback for asset:', key);
                break;
        }
        
        graphics.destroy();
    }

    create() {
        // Ensure HTML loading screen is hidden
        const htmlLoadingScreen = document.getElementById('loading-screen');
        if (htmlLoadingScreen) {
            console.log('Final attempt to hide HTML loading screen');
            htmlLoadingScreen.style.display = 'none';
        }
        
        console.log('PreloadScene complete, starting MenuScene');
        // Start the menu scene
        this.scene.start('MenuScene');
    }
} 