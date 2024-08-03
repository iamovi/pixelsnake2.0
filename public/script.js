const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let scale = 20;
let rows, cols;
let snake, food, direction, newDirection, score;
let gameStarted = false;
let gameOver = false;
let paused = false; // Add paused state

// Color settings for smooth transition
const startColor = [0, 255, 0]; // Green
const endColor = [255, 255, 0]; // Yellow
const colorTransitionSpeed = 0.05; // Speed of color transition

// Snake segment animation settings
const segmentWaveAmplitude = 5; // How much each segment waves
const segmentWaveFrequency = 0.1; // Frequency of the wave

let colorProgress = 0;

const appleImage = new Image();
appleImage.src = 'apple.png'; // Path to your apple image

// Load the eat sound
const eatSound = new Audio('./eat.mp3'); // Path to your sound file

document.addEventListener('keydown', handleKey);

function setup() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setInterval(update, 100);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rows = Math.floor(canvas.height / scale);
    cols = Math.floor(canvas.width / scale);
    if (gameStarted) {
        food = generateFood(); // Regenerate food after resizing
    }
}

function update() {
    if (!gameStarted) {
        drawStartScreen();
        return;
    }

    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    if (paused) {
        drawPausedScreen(); // Draw paused screen
        return;
    }

    if (direction !== newDirection) {
        if (newDirection === 'LEFT' && direction !== 'RIGHT') direction = newDirection;
        if (newDirection === 'RIGHT' && direction !== 'LEFT') direction = newDirection;
        if (newDirection === 'UP' && direction !== 'DOWN') direction = newDirection;
        if (newDirection === 'DOWN' && direction !== 'UP') direction = newDirection;
    }

    moveSnake();
    checkCollision();
    draw();

    // Update snake color
    colorProgress = (colorProgress + colorTransitionSpeed) % 1;
}

function moveSnake() {
    const head = { ...snake[0] };
    if (direction === 'RIGHT') head.x += scale;
    if (direction === 'LEFT') head.x -= scale;
    if (direction === 'UP') head.y -= scale;
    if (direction === 'DOWN') head.y += scale;

    // Wrap around the screen edges
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - scale;
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - scale;

    snake.unshift(head);

    // Check if the snake has eaten the food
    if (head.x < food.x + scale && head.x + scale > food.x &&
        head.y < food.y + scale && head.y + scale > food.y) {
        // Snake has eaten the food
        score++;
        food = generateFood();
        eatSound.play(); // Play the sound when the snake eats the food
    } else {
        snake.pop(); // Remove the last segment of the snake if no food is eaten
    }
}

function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver = true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x < snake[i].x + scale && head.x + scale > snake[i].x &&
            head.y < snake[i].y + scale && head.y + scale > snake[i].y) {
            gameOver = true;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw apple image
    ctx.drawImage(appleImage, food.x, food.y, scale, scale);

    // Draw snake with animated color and segments
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const color = interpolateColor(startColor, endColor, colorProgress);

        ctx.fillStyle = color;
        const offsetX = segmentWaveAmplitude * Math.sin(segmentWaveFrequency * i + colorProgress * 2 * Math.PI);
        const offsetY = segmentWaveAmplitude * Math.cos(segmentWaveFrequency * i + colorProgress * 2 * Math.PI);

        ctx.fillRect(segment.x + offsetX, segment.y + offsetY, scale, scale);
    }

    // Draw score counter at center bottom
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height - 10);

    // Debugging: Draw positions of snake and food
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Snake head: (${snake[0].x}, ${snake[0].y})`, 10, 10);
    ctx.fillText(`Food: (${food.x}, ${food.y})`, 10, 25);
}

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2);
}

function drawGameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Game Over! Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press any key to restart', canvas.width / 2, canvas.height / 2 + 20);
}

// Draw paused screen
function drawPausedScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

function interpolateColor(start, end, factor) {
    const r = Math.round(start[0] + factor * (end[0] - start[0]));
    const g = Math.round(start[1] + factor * (end[1] - start[1]));
    const b = Math.round(start[2] + factor * (end[2] - start[2]));
    return `rgb(${r}, ${g}, ${b})`;
}

function generateFood() {
    let x, y;
    do {
        x = Math.floor(Math.random() * cols) * scale;
        y = Math.floor(Math.random() * rows) * scale;
    } while (snake.some(segment => segment.x === x && segment.y === y)); // Ensure food does not overlap with the snake

    // Ensure the food position is within the canvas boundaries
    x = Math.min(Math.max(x, 0), canvas.width - scale);
    y = Math.min(Math.max(y, 0), canvas.height - scale);

    return { x, y };
}

function handleKey(event) {
    const key = event.key;

    if (key === 'Escape') {
        paused = !paused; // Toggle pause state
        return;
    }

    if (gameOver || !gameStarted) {
        gameStarted = true;
        gameOver = false;
        paused = false; // Unpause if restarting
        resetGame();
        return;
    }

    if (paused) return; // Do nothing if paused

    if (key === 'ArrowUp' && direction !== 'DOWN') newDirection = 'UP';
    if (key === 'ArrowDown' && direction !== 'UP') newDirection = 'DOWN';
    if (key === 'ArrowLeft' && direction !== 'RIGHT') newDirection = 'LEFT';
    if (key === 'ArrowRight' && direction !== 'LEFT') newDirection = 'RIGHT';
}

function resetGame() {
    snake = [{ x: Math.floor(cols / 2) * scale, y: Math.floor(rows / 2) * scale }];
    food = generateFood();
    direction = 'RIGHT';
    newDirection = 'RIGHT';
    score = 0;
}

setup();
