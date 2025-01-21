// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas background
ctx.fillStyle = '#242424';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Hero properties
const hero = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 50,
    speed: 5,
    color: '#2ecc71',
    maxHp: 1000,
    currentHp: 1000,
    hpBarWidth: 70, // Increased width of HP bar (wider than hero)
    hpBarHeight: 6  // Slightly increased height for better visibility
};

// Enemy properties
const enemies = [];
const ENEMY_COUNT = 7; // Increased starting enemies to 7

// Function to spawn a new enemy
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 30),
        radius: 15,
        speed: 2,
        color: '#e74c3c',
        damage: 5,
        currentHp: 100
    });
}

// Initialize enemies
for (let i = 0; i < ENEMY_COUNT; i++) {
    spawnEnemy();
}

// Bullet properties
const bullets = [];
const BULLET_SPEED = 10;
const BULLET_DAMAGE = 50;
const BULLET_RADIUS = 5;

// Movement state
const movement = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Event listeners for keydown
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w': movement.w = true; break;
        case 'a': movement.a = true; break;
        case 's': movement.s = true; break;
        case 'd': movement.d = true; break;
    }
});

// Event listeners for keyup
document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w': movement.w = false; break;
        case 'a': movement.a = false; break;
        case 's': movement.s = false; break;
        case 'd': movement.d = false; break;
    }
});

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Event listener for mouse movement to track cursor position
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Shooting flag
let isShooting = false;

// Event listener for mouse down (shooting)
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button
        isShooting = true;
        shootBullet(); // Shoot immediately when clicked
    }
});

// Event listener for mouse up (stop shooting)
canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left mouse button
        isShooting = false;
    }
});

// Function to shoot a bullet
function shootBullet() {
    const bullet = {
        x: hero.x + hero.size / 2,
        y: hero.y + hero.size / 2,
        radius: BULLET_RADIUS,
        damage: BULLET_DAMAGE,
        direction: { x: mouseX - (hero.x + hero.size / 2), y: mouseY - (hero.y + hero.size / 2) }
    };
    const length = Math.sqrt(bullet.direction.x * bullet.direction.x + bullet.direction.y * bullet.direction.y);
    bullet.direction.x /= length; // Normalize direction
    bullet.direction.y /= length;
    bullets.push(bullet);
}

// Update hero position
function updateHero() {
    if (movement.w && hero.y > 0) hero.y -= hero.speed;
    if (movement.s && hero.y < canvas.height - hero.size) hero.y += hero.speed;
    if (movement.a && hero.x > 0) hero.x -= hero.speed;
    if (movement.d && hero.x < canvas.width - hero.size) hero.x += hero.speed;
}

// Check collision between two circular objects
function checkCollisionCircle(hero, enemy) {
    const dx = hero.x + hero.size / 2 - enemy.x;
    const dy = hero.y + hero.size / 2 - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = hero.size / 2 + enemy.radius;
    return distance < minDistance;
}

// Update enemies
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Calculate direction to hero
        const dx = hero.x + hero.size / 2 - enemy.x;
        const dy = hero.y + hero.size / 2 - enemy.y;
        const distanceToHero = Math.sqrt(dx * dx + dy * dy);
        
        // Initialize movement vector towards hero
        let moveX = dx / distanceToHero;
        let moveY = dy / distanceToHero;
        
        // Check collision with other enemies and apply separation
        enemies.forEach((otherEnemy, otherIndex) => {
            if (index !== otherIndex) {
                const separationX = enemy.x - otherEnemy.x;
                const separationY = enemy.y - otherEnemy.y;
                const distance = Math.sqrt(separationX * separationX + separationY * separationY);
                
                // If enemies are too close, apply separation force
                const minDistance = enemy.radius + otherEnemy.radius;
                if (distance < minDistance) {
                    const separationStrength = (minDistance - distance) / minDistance;
                    moveX += (separationX / distance) * separationStrength;
                    moveY += (separationY / distance) * separationStrength;
                }
            }
        });
        
        // Normalize movement vector
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > 0) {
            moveX = moveX / moveLength;
            moveY = moveY / moveLength;
        }
        
        // Apply movement
        enemy.x += moveX * enemy.speed;
        enemy.y += moveY * enemy.speed;

        // Keep enemies within canvas bounds
        enemy.x = Math.max(enemy.radius, Math.min(canvas.width - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(canvas.height - enemy.radius, enemy.y));

        // Check collision with hero
        if (checkCollisionCircle(hero, enemy)) {
            hero.currentHp -= enemy.damage;
            if (hero.currentHp < 0) hero.currentHp = 0;
        }
    });
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.direction.x * BULLET_SPEED;
        bullet.y += bullet.direction.y * BULLET_SPEED;

        // Check if bullet is out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1); // Remove bullet if out of bounds
            continue;
        }

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bullet.radius + enemy.radius) {
                // Bullet hit the enemy
                enemy.currentHp -= bullet.damage;
                bullets.splice(i, 1); // Remove bullet
                if (enemy.currentHp <= 0) {
                    enemies.splice(j, 1); // Remove enemy if dead
                    spawnEnemy(); // Spawn a new enemy when one dies
                    if (enemies.length === 1) {
                        // If only one enemy is left, spawn 3 more
                        for (let k = 0; k < 3; k++) {
                            spawnEnemy();
                        }
                    }
                }
                break;
            }
        }
    }
}

// Draw hero
function drawHero() {
    // Draw hero square
    ctx.fillStyle = hero.color;
    ctx.fillRect(hero.x, hero.y, hero.size, hero.size);
    
    // Draw HP bar background
    const hpBarX = hero.x + (hero.size - hero.hpBarWidth) / 2;
    const hpBarY = hero.y - 12; // Moved slightly higher to accommodate larger bar
    
    // Draw HP bar shadow/outline for better visibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(hpBarX - 1, hpBarY - 1, hero.hpBarWidth + 2, hero.hpBarHeight + 2);
    
    // Draw HP bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(hpBarX, hpBarY, hero.hpBarWidth, hero.hpBarHeight);
    
    // Draw current HP
    const currentWidth = (hero.currentHp / hero.maxHp) * hero.hpBarWidth;
    ctx.fillStyle = hero.currentHp > 30 ? '#27ae60' : '#c0392b';
    ctx.fillRect(hpBarX, hpBarY, currentWidth, hero.hpBarHeight);
}

// Draw enemies as circles
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Game loop
function gameLoop() {
    // Clear canvas with dark background
    ctx.fillStyle = '#242424';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    updateHero();
    updateEnemies();
    updateBullets(); // Update bullets
    
    // Draw everything
    drawEnemies();
    drawHero();
    drawBullets(); // Draw bullets
    
    // Check game over
    if (hero.currentHp <= 0) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
        return; // Stop the game loop
    }
    
    // Shoot continuously if holding the left mouse button
    if (isShooting) {
        shootBullet();
    }
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();