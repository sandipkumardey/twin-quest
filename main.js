// Board
let board;
let boardWidth = 956;
let boardHeight = 716;
let context;

// Cards Array
let cards = [];

// Card dimensions
const cardWidth = 140;
const cardHeight = 200;

// Number of rows and columns
const numRows = 3;
const numCols = 6; // Adjust to fit the total number of cards

// Number of pairs (total cards = numPairs * 2)
const numPairs = 9; // Change this according to the number of pairs

// Card States
const FACE_DOWN = 0;
const FACE_UP = 1;

// Track flipped cards
let flippedCards = [];
let matchFound = false;
let gameOver = false; // Track if the game is over

// Stopwatch Variables
let startTime;
let elapsedTime = 0; // Time in seconds
let stopwatchInterval;

// Array to hold card front images
let cardFrontImages = [];
let cardBackImage;

// Load card front images
function loadCardFrontImages(callback) {
    let loadedImages = 0;
    for (let i = 1; i <= numPairs; i++) {
        const img = new Image();
        img.src = `./assets/card${i}.png`;
        img.onload = function() {
            loadedImages++;
            cardFrontImages.push(img);
            if (loadedImages === numPairs) {
                callback();
            }
        };
    }
}

window.onload = function() {
    // Initialize the board
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load the card images
    cardBackImage = new Image();
    cardBackImage.src = "./assets/cardback.png";

    cardBackImage.onload = function() {
        loadCardFrontImages(() => {
            setupCards();
            drawAllCards();
        });
    };

    // Load the sounds
    const matchSound = new Audio('./assets/card-FindingPair-Efx.mp3'); // Replace with your path
    const gameOverSound = new Audio('./assets/card-GameOver-Efx.mp3'); // Replace with your path

    // Add click event listener
    board.addEventListener('click', function(event) {
        handleCardClick(event, matchSound);
    });

    // Add keydown event listener for restarting the game
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && gameOver) {
            restartGame();
            gameOverSound.play(); // Play the game over sound when restarting
        }
    });
}

// Function to set up cards in a grid
function setupCards() {
    cards = []; // Reset the cards array

    // Shuffle card front images to ensure randomness
    const shuffledFrontImages = shuffle([...cardFrontImages, ...cardFrontImages]);

    // Calculate the spacing between cards
    const cardSpacingX = (boardWidth - (cardWidth * numCols)) / (numCols + 1);
    const cardSpacingY = (boardHeight - (cardHeight * numRows)) / (numRows + 1);

    // Create card objects and position them in a grid
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            let x = cardSpacingX + col * (cardWidth + cardSpacingX);
            let y = cardSpacingY + row * (cardHeight + cardSpacingY);

            cards.push({
                x: x,
                y: y,
                width: cardWidth,
                height: cardHeight,
                backImg: cardBackImage,
                frontImg: shuffledFrontImages.pop(), // Assign a random front image
                state: FACE_DOWN
            });
        }
    }

    gameOver = false; // Reset gameOver status
    startStopwatch(); // Start the stopwatch
}

// Function to shuffle the array of images
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to draw all cards
function drawAllCards() {
    context.clearRect(0, 0, boardWidth, boardHeight); // Clear the board

    cards.forEach(card => {
        if (card.state === FACE_DOWN) {
            drawCardBack(card);
        } else {
            drawCardFront(card);
        }
    });

    // Draw the stopwatch time
    drawStopwatch();

    // Draw "Game Over" message if the game is over
    if (gameOver) {
        drawGameOverMessage();
    }
}

// Function to draw card back
function drawCardBack(card) {
    context.drawImage(card.backImg, card.x, card.y, card.width, card.height);
}

// Function to draw card front
function drawCardFront(card) {
    context.drawImage(card.frontImg, card.x, card.y, card.width, card.height);
}

// Function to draw the stopwatch time
function drawStopwatch() {
    context.fillStyle = 'white'; // Set color to white
    context.font = '24px sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(`Time: ${formatTime(elapsedTime)}`, 10, 10); // Position at the top-left corner
}

// Function to draw the "Game Over" message
function drawGameOverMessage() {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
    context.fillRect(0, 0, boardWidth, boardHeight); // Cover the entire board

    context.fillStyle = 'Red'; // Set text color to red
    context.font = '48px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Game Over', boardWidth / 2, boardHeight / 2);
    context.font = '24px sans-serif';
    context.fillText('Press Space to Restart', boardWidth / 2, boardHeight / 2 + 50);
    context.fillText(`Time: ${formatTime(elapsedTime)}`, boardWidth / 2, boardHeight / 2 + 100);
}

// Function to format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Function to handle card click
function handleCardClick(event, matchSound) {
    if (gameOver) return; // Do nothing if the game is over

    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    cards.forEach(card => {
        if (card.state === FACE_DOWN &&
            x >= card.x && x <= card.x + card.width &&
            y >= card.y && y <= card.y + card.height) {
            flipCard(card);
        }
    });

    if (flippedCards.length === 2) {
        checkForMatch(matchSound);
    }

    drawAllCards();
}

// Function to flip a card
function flipCard(card) {
    card.state = FACE_UP;
    flippedCards.push(card);

    if (flippedCards.length > 2) {
        // If more than two cards are flipped, flip them back
        flippedCards.forEach(c => c.state = FACE_DOWN);
        flippedCards = [card];
    }
}

// Function to check for a match
function checkForMatch(matchSound) {
    setTimeout(() => {
        const [card1, card2] = flippedCards;

        if (card1.frontImg.src === card2.frontImg.src) {
            matchSound.play(); // Play sound on match
            matchFound = true;

            // Check if all pairs are matched
            if (cards.every(card => card.state === FACE_UP)) {
                gameOver = true; // All pairs matched
                stopStopwatch(); // Stop the stopwatch
                // Optionally, play the game over sound here
            }
        } else {
            // Cards didn't match - flip them back
            card1.state = FACE_DOWN;
            card2.state = FACE_DOWN;
        }

        flippedCards = [];
        drawAllCards();
    }, 1000); // Delay to allow user to see the cards before flipping them back
}

// Function to start the stopwatch
function startStopwatch() {
    startTime = Date.now();
    stopwatchInterval = setInterval(() => {
        if (!gameOver) {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            drawAllCards(); // Redraw the board to update the time
        }
    }, 1000); // Update every second
}

// Function to stop the stopwatch
function stopStopwatch() {
    clearInterval(stopwatchInterval);
}

// Function to restart the game
function restartGame() {
    setupCards(); // Reset cards and shuffle them
    drawAllCards(); // Redraw the board
}

// Optionally, set up a game loop if you need continuous updates
function gameLoop() {
    // Update game state
    // ...

    // Draw everything
    drawAllCards();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop if needed
// gameLoop(); // Uncomment if you need the game loop
