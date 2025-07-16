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
        
        // Load sounds (optional - game will work without them)
        this.load.audio('shoot', 'assets/sounds/shoot.wav');
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('powerup', 'assets/sounds/powerup.wav');
        this.load.audio('gameOver', 'assets/sounds/gameOver.wav');
        this.load.audio('levelUp', 'assets/sounds/levelUp.wav');
        this.load.audio('background', 'assets/sounds/background.mp3');
        this.load.audio('gameMusic', 'assets/sounds/spaceship_and_beyond.ogg');
        
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