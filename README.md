# Spaceship vs Asteroids

A classic arcade-style shooting game built with **Phaser.js**, **Node.js**, and **WebGL**. Features responsive design for both desktop and mobile devices with modern game development practices.

## 🚀 Features

- **Modern Game Engine**: Built with Phaser.js 3 for optimal performance
- **WebGL Rendering**: Hardware-accelerated graphics for smooth gameplay
- **Cross-platform**: Works on desktop browsers and mobile devices
- **Responsive Design**: Automatically adapts to screen size
- **Touch Controls**: Virtual joystick and fire button for mobile
- **Keyboard Controls**: WASD/Arrow keys for movement, Space for firing
- **Modular Architecture**: Easy to expand and modify
- **Particle Effects**: Advanced explosion and trail effects
- **Power-ups**: Health, rapid fire, shield, and triple shot
- **Progressive Difficulty**: Levels increase in challenge
- **High Score System**: Local storage for persistent scores
- **Hot Reloading**: Development server with live updates

## 🎮 Controls

### Desktop
- **Movement**: WASD or Arrow Keys
- **Fire**: Spacebar
- **Pause**: Escape

### Mobile
- **Movement**: Virtual joystick (left side)
- **Fire**: Fire button (right side)

## 🎨 Sprite Requirements

For optimal performance, please provide sprites in the following sizes:

### Required Sprites
- **Spaceship**: 32x32 pixels (or 48x48 for more detail)
- **Asteroids**: 
  - Large: 48x48 pixels
  - Medium: 32x32 pixels  
  - Small: 24x24 pixels
- **Bullet**: 8x8 pixels
- **Power-ups**: 16x16 pixels
- **Explosion**: 32x32 pixels (optional, uses particle effects)
- **Background**: 800x600 pixels (optional)

### Recommended Format
- **File Format**: PNG with transparency
- **Color Depth**: 32-bit (RGBA)
- **Style**: Pixel art or vector art with clear silhouettes

## 📁 Project Structure

```
spaceshipandasteroid/
├── src/                    # Source code
│   ├── main.js            # Game entry point
│   ├── index.html         # HTML template
│   ├── config/            # Game configuration
│   │   └── GameConfig.js  # Phaser.js config
│   ├── scenes/            # Game scenes
│   │   ├── BootScene.js   # Initial setup
│   │   ├── PreloadScene.js # Asset loading
│   │   ├── MenuScene.js   # Main menu
│   │   ├── GameScene.js   # Main gameplay
│   │   └── GameOverScene.js # Game over screen
│   └── entities/          # Game entities
│       ├── Spaceship.js   # Player spaceship
│       ├── Asteroid.js    # Asteroid enemies
│       ├── Bullet.js      # Projectiles
│       └── PowerUp.js     # Power-up items
├── assets/                # Game assets
│   ├── sprites/           # Image assets
│   └── sounds/            # Audio assets
├── dist/                  # Built files (auto-generated)
├── webpack.config.js      # Webpack configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

### Installation
1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Create the assets folder structure**:
   ```bash
   mkdir -p assets/sprites assets/sounds
   ```
4. **Add your sprite images** to the `assets/sprites/` folder
5. **Add your sound files** to the `assets/sounds/` folder (optional)

### Development
```bash
# Start development server with hot reloading
npm run dev

# Or use the start command
npm start
```

The game will open automatically in your browser at `http://localhost:8080`

### Production Build
```bash
# Create optimized production build
npm run build
```

The built files will be in the `dist/` folder.

## 🎯 Game Mechanics

### Scoring
- **Large Asteroid**: 20 points
- **Medium Asteroid**: 50 points  
- **Small Asteroid**: 100 points
- **Power-ups**: Bonus points and effects

### Progression
- **Levels**: Increase every 1000 points
- **Difficulty**: Asteroids move faster and spawn more frequently
- **Power-ups**: Spawn every 15 seconds

### Power-ups
- **Health**: Restores 1 life
- **Rapid Fire**: Faster shooting for 10 seconds
- **Shield**: Invulnerability for 5 seconds
- **Triple Shot**: Shoots 3 bullets at once for 8 seconds

## 🏗️ Technical Architecture

### Phaser.js Features
- **WebGL Rendering**: Hardware-accelerated graphics
- **Physics Engine**: Built-in Arcade physics
- **Particle System**: Advanced visual effects
- **Scene Management**: Organized game states
- **Input Handling**: Keyboard, mouse, and touch support
- **Audio System**: Web Audio API integration

### Development Features
- **Webpack**: Module bundling and optimization
- **Babel**: Modern JavaScript compilation
- **Hot Reloading**: Instant development feedback
- **Asset Management**: Automatic asset loading and optimization

### Performance
- **60 FPS** target frame rate
- **WebGL acceleration** for smooth rendering
- **Efficient collision detection** with physics groups
- **Object pooling** for particles and bullets
- **Delta time** based movement for consistent speed

## 🌐 Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Full support with touch controls

## 🔧 Customization

### Adding New Entities
1. Create a new class in `src/entities/`
2. Extend `Phaser.Physics.Arcade.Sprite`
3. Add to `GameScene.js` groups
4. Update collision detection if needed

### Adding New Scenes
1. Create a new scene class in `src/scenes/`
2. Extend `Phaser.Scene`
3. Add to `GameConfig.js` scene array
4. Implement scene transitions

### Modifying Game Balance
Edit values in:
- `GameScene.js` for spawn rates and difficulty
- `Spaceship.js` for player stats
- `Asteroid.js` for enemy behavior
- `PowerUp.js` for power-up effects

### Adding New Power-ups
1. Add new type to `PowerUp.js`
2. Implement effect in `Spaceship.js`
3. Add visual representation
4. Update UI notifications

## 🐛 Troubleshooting

### Common Issues

**Game doesn't start**
- Check browser console for errors
- Ensure all dependencies are installed (`npm install`)
- Try running on a local web server (`npm run dev`)

**No sound**
- Modern browsers require user interaction before playing audio
- Click or tap the screen to enable audio
- Check if audio files are properly loaded

**Mobile controls not working**
- Ensure viewport meta tag is present
- Check touch event handling
- Test on different mobile devices

**Performance issues**
- Reduce particle count in particle emitters
- Lower canvas resolution in GameConfig
- Close other browser tabs

**Build errors**
- Check Node.js version (requires 14+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check webpack configuration

## 📦 Dependencies

### Core
- **Phaser.js 3.70.0**: Game engine
- **Webpack 5.88.2**: Module bundler
- **Babel**: JavaScript compiler

### Development
- **Webpack Dev Server**: Development server
- **HTML Webpack Plugin**: HTML generation
- **Copy Webpack Plugin**: Asset copying

## 🤝 Contributing

Feel free to:
- Add new features
- Improve performance
- Fix bugs
- Add new power-ups or enemies
- Enhance visual effects
- Improve mobile controls

## 📄 License

This project is open source. Feel free to use and modify for your own projects.

## 🎯 Credits

Created as a modern HTML5 game framework using Phaser.js, Node.js, and WebGL for educational and entertainment purposes. 