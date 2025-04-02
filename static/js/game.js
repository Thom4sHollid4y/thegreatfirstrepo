class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Load sound effects
        this.sounds = {
            shoot: new Audio('/static/sounds/shoot.mp3'),
            hit: new Audio('/static/sounds/hit.mp3'),
            powerup: new Audio('/static/sounds/powerup.mp3'),
            gameOver: new Audio('/static/sounds/gameover.mp3')
        };
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 40,
            height: 40,
            speed: 3,
            health: 100,
            maxHealth: 100,
            currentWeapon: 'pistol',
            weapons: {
                pistol: { ammo: Infinity, damage: 100, fireRate: 0.5, level: 1 },
                assaultRifle: { ammo: Infinity, damage: 100, fireRate: 0.1, level: 1 },
                shotgun: { ammo: Infinity, damage: 100, fireRate: 1, level: 1 }
            },
            powerUps: {
                speedBoost: false,
                invincibility: false,
                infiniteAmmo: false
            }
        };
        
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.upgradeSpheres = [];
        this.score = 0;
        this.level = 1;
        this.keys = {};
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = 10000; // Spawn power-up every 10 seconds
        this.upgradeSpawnTimer = 0;
        this.upgradeSpawnInterval = 15000; // Spawn upgrade every 15 seconds
        this.money = 0;
        this.shopOpen = false;
        this.upgrades = {
            playerSpeed: { level: 1, cost: 100, name: 'Player Speed' },
            playerHealth: { level: 1, cost: 100, name: 'Player Health' },
            weaponFireRate: { level: 1, cost: 150, name: 'Weapon Fire Rate' },
            multiShot: { level: 1, cost: 200, name: 'Multi Shot' }
        };
        
        this.gameOver = false;
        this.finalScore = 0;
        
        this.setupEventListeners();
        this.spawnEnemies();
        this.gameLoop();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('click', (e) => this.handleShoot(e));
        
        // Weapon switching
        window.addEventListener('keydown', (e) => {
            if (e.key === '1') this.player.currentWeapon = 'pistol';
            if (e.key === '2') this.player.currentWeapon = 'assaultRifle';
            if (e.key === '3') this.player.currentWeapon = 'shotgun';
        });
        
        // Add shop toggle
        window.addEventListener('keydown', (e) => {
            if (e.key === 'b') {
                this.shopOpen = !this.shopOpen;
            }
        });
        
        // Add shop click handling
        window.addEventListener('click', (e) => {
            if (this.shopOpen) {
                this.handleShopClick(e);
            }
        });
        
        // Add restart key listener
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gameOver) {
                this.resetGame();
            }
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }
    
    handleShoot(e) {
        this.sounds.shoot.play();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const angle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
        const speed = 10;
        
        // Get the number of bullets to fire based on multi-shot level
        const bulletCount = 1 + this.upgrades.multiShot.level;
        
        // Calculate spread angle based on number of bullets
        const spreadAngle = Math.PI / 12; // 15 degrees spread
        
        for (let i = 0; i < bulletCount; i++) {
            // Calculate angle for this bullet with spread
            const bulletAngle = angle - (spreadAngle * (bulletCount - 1) / 2) + (spreadAngle * i);
            
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                dx: Math.cos(bulletAngle) * speed,
                dy: Math.sin(bulletAngle) * speed,
                damage: this.player.weapons[this.player.currentWeapon].damage
            });
        }
        
        this.updateHUD();
    }
    
    handleShopClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Only handle clicks within the shop area
        if (x < this.canvas.width - 300 || x > this.canvas.width || y > 250) {
            return;
        }
        
        // Check if click is on any upgrade button
        Object.entries(this.upgrades).forEach(([key, upgrade], index) => {
            const buttonY = 60 + (index * 45);
            if (x >= this.canvas.width - 280 && 
                x <= this.canvas.width - 20 && 
                y >= buttonY && 
                y <= buttonY + 35) {
                this.purchaseUpgrade(key);
            }
        });
    }
    
    purchaseUpgrade(type) {
        const upgrade = this.upgrades[type];
        if (this.money >= upgrade.cost) {
            this.money -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase cost by 50%
            
            // Apply the upgrade
            switch(type) {
                case 'playerSpeed':
                    this.player.speed += 0.5;
                    break;
                case 'playerHealth':
                    this.player.maxHealth += 20;
                    this.player.health += 20;
                    break;
                case 'weaponFireRate':
                    Object.values(this.player.weapons).forEach(weapon => {
                        weapon.fireRate *= 0.8; // Increase fire rate by 20%
                    });
                    break;
                case 'multiShot':
                    // Multi-shot level is already increased above
                    break;
            }
            
            this.updateHUD();
        }
    }
    
    spawnEnemies() {
        const numEnemies = 2 + this.level;
        for (let i = 0; i < numEnemies; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 40),
                y: Math.random() * (this.canvas.height - 40),
                width: 40,
                height: 40,
                health: 50,
                maxHealth: 50,
                speed: 1,
                color: '#ff0000'
            });
        }
    }
    
    spawnPowerUp() {
        const types = ['health', 'ammo', 'speedBoost', 'invincibility', 'infiniteAmmo'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push({
            x: Math.random() * (this.canvas.width - 30),
            y: Math.random() * (this.canvas.height - 30),
            width: 30,
            height: 30,
            type: type
        });
    }
    
    spawnUpgradeSphere() {
        const weapons = ['laser', 'rocket'];
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];
        
        this.upgradeSpheres.push({
            x: Math.random() * (this.canvas.width - 30),
            y: Math.random() * (this.canvas.height - 30),
            width: 30,
            height: 30,
            weapon: weapon
        });
    }
    
    handlePowerUpCollision(powerUp) {
        this.sounds.powerup.play();
        
        switch(powerUp.type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                break;
            case 'ammo':
                this.player.weapons.pistol.ammo = Infinity;
                this.player.weapons.assaultRifle.ammo = Infinity;
                this.player.weapons.shotgun.ammo = Infinity;
                break;
            case 'speedBoost':
                this.player.powerUps.speedBoost = true;
                this.player.speed *= 1.5;
                setTimeout(() => {
                    this.player.powerUps.speedBoost = false;
                    this.player.speed /= 1.5;
                }, 5000);
                break;
            case 'invincibility':
                this.player.powerUps.invincibility = true;
                setTimeout(() => {
                    this.player.powerUps.invincibility = false;
                }, 5000);
                break;
            case 'infiniteAmmo':
                this.player.powerUps.infiniteAmmo = true;
                setTimeout(() => {
                    this.player.powerUps.infiniteAmmo = false;
                }, 10000);
                break;
        }
        
        this.updateHUD();
    }
    
    handleUpgradeCollision(sphere) {
        this.sounds.powerup.play();
        
        // Add the new weapon to player's arsenal
        this.player.weapons[sphere.weapon] = {
            ammo: Infinity,
            damage: this.player.weapons[sphere.weapon].damage,
            fireRate: this.player.weapons[sphere.weapon].fireRate
        };
        
        // Switch to the new weapon
        this.player.currentWeapon = sphere.weapon;
        
        this.updateHUD();
    }
    
    update() {
        if (this.gameOver) return;
        
        // Player movement
        if (this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['d']) this.player.x += this.player.speed;
        
        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
        
        // Update power-up spawn timer
        this.powerUpSpawnTimer += 16.67; // Approximately 60 FPS
        if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            
            // Remove bullets that are off screen
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check for bullet collisions with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(bullet, enemy)) {
                    // Apply damage to enemy
                    enemy.health -= bullet.damage;
                    this.sounds.hit.play();
                    
                    // Remove the bullet after hitting
                    this.bullets.splice(i, 1);
                    
                    // Check if enemy is defeated
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += 100;
                        this.money += 10; // Add money reward for killing enemy
                        this.updateHUD();
                    }
                    break;
                }
            }
        }
        
        // Update enemies
        for (const enemy of this.enemies) {
            // Simple enemy movement towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Check for collision with player
            if (this.checkCollision(this.player, enemy)) {
                if (!this.player.powerUps.invincibility) {
                    this.player.health -= 1;
                    this.sounds.hit.play();
                    this.updateHUD();
                    
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        this.finalScore = this.score;
                        this.sounds.gameOver.play();
                    }
                }
            }
        }
        
        // Check for power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkCollision(this.player, powerUp)) {
                this.handlePowerUpCollision(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
        
        // Check for upgrade sphere collisions
        for (let i = this.upgradeSpheres.length - 1; i >= 0; i--) {
            const sphere = this.upgradeSpheres[i];
            if (this.checkCollision(this.player, sphere)) {
                this.handleUpgradeCollision(sphere);
                this.upgradeSpheres.splice(i, 1);
            }
        }
        
        // Check if level is complete
        if (this.enemies.length === 0) {
            this.level++;
            this.spawnEnemies();
            this.shopOpen = true; // Open shop between levels
        }
    }
    
    checkCollision(rect1, rect2) {
        // For bullets, treat them as a point instead of a rectangle
        if (rect1.dx !== undefined) { // This is a bullet
            const bulletRadius = 3; // Same as bullet size in draw()
            const enemyCenterX = rect2.x + rect2.width / 2;
            const enemyCenterY = rect2.y + rect2.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(rect1.x - enemyCenterX, 2) + 
                Math.pow(rect1.y - enemyCenterY, 2)
            );
            
            return distance < (rect2.width / 2 + bulletRadius);
        }
        
        // For rectangles (player, enemies, power-ups)
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameOver) {
            this.drawGameOver();
            return;
        }
        
        // Draw player
        this.ctx.fillStyle = this.player.powerUps.invincibility ? '#00ffff' : '#00ff00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw player health bar
        this.drawHealthBar(this.player.x, this.player.y - 10, this.player.width, 5, 
                          this.player.health, this.player.maxHealth, '#00ff00');
        
        // Draw enemies
        this.ctx.fillStyle = '#ff0000';
        for (const enemy of this.enemies) {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Draw enemy health bar
            this.drawHealthBar(enemy.x, enemy.y - 10, enemy.width, 5, 
                             enemy.health, enemy.maxHealth, '#ff0000');
        }
        
        // Draw bullets
        for (const bullet of this.bullets) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw power-ups
        for (const powerUp of this.powerUps) {
            this.ctx.fillStyle = this.getPowerUpColor(powerUp.type);
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 
                        powerUp.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw upgrade spheres
        for (const sphere of this.upgradeSpheres) {
            this.ctx.fillStyle = this.getUpgradeColor(sphere.weapon);
            this.ctx.beginPath();
            this.ctx.arc(sphere.x + sphere.width/2, sphere.y + sphere.height/2, 
                        sphere.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw weapon name
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(sphere.weapon.toUpperCase(), 
                            sphere.x + sphere.width/2, 
                            sphere.y + sphere.height/2 + 4);
        }
        
        // Draw money
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Money: $${this.money}`, 20, 40);
        
        // Draw shop if open
        if (this.shopOpen) {
            this.drawShop();
        }
    }
    
    drawHealthBar(x, y, width, height, health, maxHealth, color) {
        // Background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x, y, width, height);
        
        // Health
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, (health / maxHealth) * width, height);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.strokeRect(x, y, width, height);
    }
    
    getPowerUpColor(type) {
        switch(type) {
            case 'health': return '#ff0000';
            case 'ammo': return '#ffff00';
            case 'speedBoost': return '#00ff00';
            case 'invincibility': return '#00ffff';
            case 'infiniteAmmo': return '#ff00ff';
            default: return '#ffffff';
        }
    }
    
    getUpgradeColor(weapon) {
        switch(weapon) {
            case 'laser': return '#00ffff';
            case 'rocket': return '#ff00ff';
            default: return '#ffffff';
        }
    }
    
    drawShop() {
        // Draw shop background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.canvas.width - 300, 0, 300, 250);
        
        // Draw shop title
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Upgrade Shop', this.canvas.width - 150, 30);
        
        // Draw upgrades
        Object.entries(this.upgrades).forEach(([key, upgrade], index) => {
            const y = 60 + (index * 45);
            
            // Draw upgrade button
            this.ctx.fillStyle = this.money >= upgrade.cost ? '#4CAF50' : '#666';
            this.ctx.fillRect(this.canvas.width - 280, y, 260, 35);
            
            // Draw upgrade text
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${upgrade.name} (Level ${upgrade.level})`, 
                            this.canvas.width - 270, y + 22);
            this.ctx.fillText(`$${upgrade.cost}`, 
                            this.canvas.width - 270, y + 40);
        });
    }
    
    drawGameOver() {
        // Draw semi-transparent black background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game over text
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 50);
        
        // Draw final score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '36px Arial';
        this.ctx.fillText(`Final Score: ${this.finalScore}`, this.canvas.width/2, this.canvas.height/2);
        
        // Draw restart instructions
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width/2, this.canvas.height/2 + 50);
    }
    
    updateHUD() {
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('score').textContent = this.score;
        document.getElementById('money').textContent = `$${this.money}`;
        document.getElementById('current-weapon').textContent = this.player.currentWeapon;
        document.getElementById('ammo').textContent = '∞';
        
        // Update power-up status
        document.querySelector('#speed-boost span').textContent = 
            this.player.powerUps.speedBoost ? 'Active' : 'Inactive';
        document.querySelector('#invincibility span').textContent = 
            this.player.powerUps.invincibility ? 'Active' : 'Inactive';
    }
    
    resetGame() {
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.speed = 3;
        this.score = 0;
        this.money = 0;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.upgradeSpheres = [];
        this.player.weapons = {
            pistol: { ammo: Infinity, damage: 100, fireRate: 0.5, level: 1 },
            assaultRifle: { ammo: Infinity, damage: 100, fireRate: 0.1, level: 1 },
            shotgun: { ammo: Infinity, damage: 100, fireRate: 1, level: 1 }
        };
        this.player.currentWeapon = 'pistol';
        this.player.powerUps = {
            speedBoost: false,
            invincibility: false,
            infiniteAmmo: false
        };
        this.upgrades = {
            playerSpeed: { level: 1, cost: 100, name: 'Player Speed' },
            playerHealth: { level: 1, cost: 100, name: 'Player Health' },
            weaponFireRate: { level: 1, cost: 150, name: 'Weapon Fire Rate' },
            multiShot: { level: 1, cost: 200, name: 'Multi Shot' }
        };
        this.shopOpen = false;
        this.gameOver = false;
        this.finalScore = 0;
        this.spawnEnemies();
        this.updateHUD();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 