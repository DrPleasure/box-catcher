const game = document.getElementById('game');
const player = document.getElementById('player');
const ball = document.getElementById('ball');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startGameButton = document.getElementById('start-game');
const ballColorButtons = document.querySelectorAll('#ball-colors .color-btn');
const platformColorButtons = document.querySelectorAll('#platform-colors .color-btn');

let ballColor = 'red';
let platformColor = 'red';

const AudioContext = window.AudioContext || window.AudioContext;
const audioContext = new AudioContext();


let currentDiscoSoundSource = null;
let catchSoundBuffer;
let missSoundBuffer;
let backgroundMusicBuffer;
let giggleSoundBuffer;
let discoSoundBuffer;
let burpSoundBuffer;
let timeSoundBuffer;
let gameStarted = false;
let activePowerUp = false;
let activePowerUps = []; // array to store active powerups

let invertedControlActive = false;

let lastPowerUpSpawnTime = 0;


let sizePowerUpTimeout;
let speedPowerUpTimeout;
let discoPowerUpTimeout;
let invertPowerUpTimeout;


let playerPosX = game.offsetWidth / 2 - player.offsetWidth / 2;
let ballPosX = Math.random() * (game.offsetWidth - ball.offsetWidth);
let ballPosY = 0;
let score = 0;
let powerUpSpeedY = -2;

const initialBallSpeed = 2;
let ballSpeed = initialBallSpeed;


const powerUpSize = document.createElement('div');
const powerUpSpeed = document.createElement('div');
const powerUpDisco = document.createElement('div');
const powerUpInvert = document.createElement('div');


powerUpSize.id = 'powerUpSize';
powerUpSpeed.id = 'powerUpSpeed';
powerUpDisco.id = 'powerUpDisco';
powerUpInvert.id = 'powerUpInvert';


game.appendChild(powerUpSize);
game.appendChild(powerUpSpeed);
game.appendChild(powerUpDisco);
game.appendChild(powerUpInvert);


let powerUpSizePosY = -Math.random() * 500 - 50;
let powerUpSpeedPosY = -Math.random() * 500 - 50;
let powerUpDiscoPosY = -Math.random() * 500 - 50;
let powerUpInvertPosY = -Math.random() * 500 - 50;

let powerUpSizePosX = Math.random() * (game.offsetWidth - 50);
let powerUpSpeedPosX = Math.random() * (game.offsetWidth - 50);
let powerUpDiscoPosX = Math.random() * (game.offsetWidth - 50);
let powerUpInvertPosX = Math.random() * (game.offsetWidth - 50);

let powerUpEffectTimeout;

player.style.left = playerPosX + 'px';
ball.style.left = ballPosX + 'px';

ballColorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      ballColor = button.getAttribute('data-color');
      ball.style.backgroundColor = ballColor;
      selectColor(ballColorButtons, button);
    });
});

platformColorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      platformColor = button.getAttribute('data-color');
      player.style.backgroundColor = platformColor;
      selectColor(platformColorButtons, button);
    });
});

let discoSoundSource;
let discoSoundStartedAt = 0;
let discoSoundPausedAt;
let discoSoundGain;
let discoSongTime = 0; // Initialize the time elapsed since beginning of song to 0
let discoSoundPlaybackPosition = 0;



function playDiscoSound() {
    if (!discoSoundBuffer) {
      console.error('Disco sound buffer not loaded');
      return;
    }
    
    if (audioContext.state !== 'running') {
      console.warn('Audio context is not running');
      return;
    }
    
    if (discoSoundSource && !discoSoundSource.stop) {
      console.warn('Disco sound source is already playing');
      return;
    }
    
    if (backgroundMusicSource) {
      backgroundMusicSource.pause();
    }
    
    discoSoundSource = audioContext.createBufferSource();
    discoSoundSource.buffer = discoSoundBuffer;
    discoSoundSource.loop = true;
    
    // Create a GainNode to control the volume of the disco sound
    discoSoundGain = audioContext.createGain();
    discoSoundSource.connect(discoSoundGain);
    discoSoundGain.connect(audioContext.destination);
    discoSoundGain.gain.value = 1.0; // Set the initial volume to full
    
    discoSoundSource.start(0); // Start playing from the beginning
  }


  function stopDiscoSound() {
    if (discoSoundSource) {
      discoSoundSource.stop();
      discoSoundSource = null;
    }
  }
  
  
  
  
  

(async function () {
    catchSoundBuffer = await loadSound('catch.wav');
    missSoundBuffer = await loadSound('miss.wav');
    backgroundMusicBuffer = await loadSound('background-music.wav');
    giggleSoundBuffer = await loadSound('giggle.wav');
    discoSoundBuffer = await loadSound('disco.wav');
    burpSoundBuffer = await loadSound('burp.wav');
    timeSoundBuffer = await loadSound('time.wav');

    playBackgroundMusic();
})();

let backgroundMusicSource;
let backgroundMusicGain;
let backgroundMusicPaused = false;

function playBackgroundMusic() {
  if (!backgroundMusicBuffer) {
    console.error('Background music buffer not loaded');
    return;
  }

  if (!audioContext) {
    console.warn('Audio context not initialized');
    return;
  }

  if (audioContext.state !== 'running') {
    console.warn('Audio context is not running');
    return;
  }

  if (backgroundMusicSource) {
    console.warn('Background music is already playing');
    return;
  }

  backgroundMusicSource = audioContext.createBufferSource();
  backgroundMusicSource.buffer = backgroundMusicBuffer;
  backgroundMusicSource.loop = true;

  // Create a GainNode to control the volume of the background music
  backgroundMusicGain = audioContext.createGain();
  backgroundMusicSource.connect(backgroundMusicGain);
  backgroundMusicGain.connect(audioContext.destination);
  backgroundMusicGain.gain.value = 0.5; // Set the initial volume to half

  backgroundMusicSource.start(0); // Start playing from the beginning
}





function pauseBackgroundMusic() {
  if (backgroundMusicSource) {
    backgroundMusicSource.stop();
    backgroundMusicSource = null;
    backgroundMusicPaused = true;
  }
}

  
  function resumeBackgroundMusic() {
    if (backgroundMusicPaused) {
      backgroundMusicPaused = false;
      if (!backgroundMusicSource) {
        playBackgroundMusic();
      }
    }
  }
  
  function stopAllAudio() {
    // Stop background music
    pauseBackgroundMusic();
  
    // Stop all other sound sources
    for (let i = 0; i < soundSources.length; i++) {
      soundSources[i].stop();
    }
  
    // Close the AudioContext
    if (audioContext.state === 'running') {
      audioContext.suspend().then(function () {
        return audioContext.close();
      });
    }
  }
  


async function startAudioContext() {
    if (audioContext.state === "suspended") {
        try {
            await audioContext.resume();
        } catch (error) {
            console.error(`Error resuming AudioContext: ${error.message}`);
        }
    }
}




startGameButton.addEventListener('click', async () => {
  ball.style.backgroundColor = ballColor;
  player.style.backgroundColor = platformColor;
  startScreen.style.display = 'none';
  gameStarted = true;
  movePowerUp();

  // Call the startAudioContext function here
  await startAudioContext();

  // Start playing the background music after the AudioContext is resumed
  playBackgroundMusic();

  // Enable touch controls
  touchControlsEnabled = true;
});



function isColliding(element1, element2) {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
  
    return (
      rect1.bottom >= rect2.top &&
      rect1.top <= rect2.bottom &&
      rect1.right >= rect2.left &&
      rect1.left <= rect2.right
    );
  }

function selectColor(buttons, target) {
    buttons.forEach((button) => {
        button.classList.remove('selected');
    });
    target.classList.add('selected');
}

function loadSound(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data));
}

async function playSound(buffer, loop = false) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.loop = loop; // Set the loop property
    await source.start(0);
    return source; // Return the source
}



let ballsTillNextPowerUp = Math.floor(Math.random() * 2) + 3;
let discoInterval;
let ballsSpawned = 0;

function movePlayer(e) {
    if (e.key === 'ArrowLeft') {
      playerPosX -= 50;
    } else if (e.key === 'ArrowRight') {
      playerPosX += 50;
    }
  
    if (playerPosX < 0) {
      playerPosX = 0;
    } else if (playerPosX > game.offsetWidth - player.offsetWidth) {
      playerPosX = game.offsetWidth - player.offsetWidth;
    }
  
    player.style.left = playerPosX + 'px';
  }
  
  
  document.addEventListener('keydown', async (e) => {
    await startAudioContext();
    handleKeyPress(e);
  });
  
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  
  let fastDrop = false;
  
  function keyDownHandler(e) {
      if (e.key === 'ArrowDown' || e.key === 'Down') {
          fastDrop = true;
      }
  }
  
  function keyUpHandler(e) {
      if (e.key === 'ArrowDown' || e.key === 'Down') {
          fastDrop = false;
      }
  }
  
  async function handleKeyPress(e, direction) {
    await startAudioContext();
  
    const leftKey = 'ArrowLeft';
    const rightKey = 'ArrowRight';
    const moveDistance = 35;
  
    if (e) {
      if (e.key === leftKey) {
        direction = 'left';
      } else if (e.key === rightKey) {
        direction = 'right';
      }
    }
  
    if (direction === 'left') {
      playerPosX += invertedControlActive ? moveDistance : -moveDistance;
    } else if (direction === 'right') {
      playerPosX += invertedControlActive ? -moveDistance : moveDistance;
    }
  
    if (playerPosX < 0) {
      playerPosX = 0;
    } else if (playerPosX > game.offsetWidth - player.offsetWidth) {
      playerPosX = game.offsetWidth - player.offsetWidth;
    }
  
    player.style.left = playerPosX + 'px';
  }
  

  
  document.addEventListener('keydown', (e) => {
    handleKeyPress(e);
  });
  
let touchControlsEnabled = false;


// Add touch event listeners
game.addEventListener('touchstart', handleTouchStart, false);
game.addEventListener('touchmove', handleTouchMove, false);
game.addEventListener('touchend', handleTouchEnd, false);

let touchStartX = null;

function handleTouchStart(event) {
  if (!touchControlsEnabled) return;
  event.preventDefault();
  touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
  if (!touchControlsEnabled) return;
  event.preventDefault();
  let touchX = event.touches[0].clientX;

  let deltaX = touchX - touchStartX;

  if (deltaX > 0) {
    handleKeyPress(null, 'right');
  } else if (deltaX < 0) {
    handleKeyPress(null, 'left');
  }
}

function handleTouchEnd(event) {
  if (!touchControlsEnabled) return;
  event.preventDefault();
}




const powerups = [  { element: powerUpSize, x: powerUpSizePosX, y: powerUpSizePosY, speed: 2, type: 'size' },  { element: powerUpSpeed, x: powerUpSpeedPosX, y: powerUpSpeedPosY, speed: 2, type: 'speed' },  { element: powerUpDisco, x: powerUpDiscoPosX, y: powerUpDiscoPosY, speed: 2, type: 'disco' },  { element: powerUpInvert, x: powerUpInvertPosX, y: powerUpInvertPosY, speed: 2, type: 'invert' }];

function movePowerUp() {
    for (let i = 0; i < powerups.length; i++) {
      const powerup = powerups[i];
      powerup.y += powerup.speed;
      if (powerup.y > game.offsetHeight) {
        powerup.y = -Math.random() * 500 - 50;
        powerup.x = Math.random() * (game.offsetWidth - 50);
      }
      powerup.element.style.display = "block";
      powerup.element.style.left = powerup.x + "px";
      powerup.element.style.top = powerup.y + "px";
      if (isColliding(player, powerup.element)) {
        applyPowerUpEffect(powerup.type);
  
      powerup.element.style.display = "none";
      powerup.y = -Math.random() * 500 - 50;
      powerup.x = Math.random() * (game.offsetWidth - 50);
    }
  }
}
  
  
  
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      powerUpSpeedY = -2; // Set a negative value to move the power-up upwards
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
      powerUpSpeedY = 2; // Set the original value back to make the power-up move at the normal speed
    }
  });





  function gameLoop() {
    if (gameStarted) {
      if (fastDrop) {
        ballPosY += ballSpeed * 3;
      } else {
        ballPosY += ballSpeed;
      }
  
      if (ballPosY + ball.offsetHeight >= player.offsetTop &&
        ballPosX + ball.offsetWidth >= playerPosX &&
        ballPosX <= playerPosX + player.offsetWidth) {
  
        ballsTillNextPowerUp--;
  
        if (ballsTillNextPowerUp === 0) {
          spawnPowerUps();
          ballsTillNextPowerUp = Math.floor(Math.random() * 2) + 3;
        }
  
        score++;
        ballSpeed += 0.2;
        console.log('Current ball speed:', ballSpeed);
        updateScore();
        resetBall();
        playSound(catchSoundBuffer);
      } else if (ballPosY > game.offsetHeight) {
        console.log('Ball speed reset to:', initialBallSpeed);
        ballSpeed = initialBallSpeed;
        resetBall();
        playSound(missSoundBuffer);
      }
  
      ball.style.top = ballPosY + 'px';
  
      movePowerUp(); // Update power-up position
    }
  
    requestAnimationFrame(gameLoop);
  }
  
  




  function applyControlInversion() {
    if (!activePowerUp || activePowerUp !== 'invert') {
        return;
    }

    setTimeout(() => {
        invertedControlActive = false;
    }, 5000); // Reset control inversion after 5 seconds
}


let lastColor = ''; 



async function applyPowerUpEffect(powerUp) {
    console.log("Power up:", powerUp);
    if (powerUp === "size") {
      playSound(burpSoundBuffer);
      clearTimeout(sizePowerUpTimeout);
  
      player.style.width = "200px";
      playerPosX = Math.min(
        playerPosX,
        game.offsetWidth - player.offsetWidth
      );
      player.style.left = playerPosX + "px";
      sizePowerUpTimeout = setTimeout(() => {
        player.style.width = "100px";
        activePowerUp = false;
        playerPosX = Math.min(
          playerPosX,
          game.offsetWidth - player.offsetWidth
        );
        player.style.left = playerPosX + "px";
      }, 5000); // Reset player's width after 5 seconds
    } else if (powerUp === "speed") {
      playSound(timeSoundBuffer);
      clearTimeout(speedPowerUpTimeout);
  
      ballSpeed *= 0.5;
      speedPowerUpTimeout = setTimeout(() => {
        ballSpeed *= 2; // Revert the ball speed
        activePowerUp = false;
      }, 5000); // Reset ball speed after 5 seconds
    } else if (powerUp === 'disco') {
      clearTimeout(discoPowerUpTimeout);
      clearInterval(discoInterval);
    
      if (backgroundMusicSource && !backgroundMusicPaused) {
        pauseBackgroundMusic();
      }
    
      if (discoSoundSource) {
        stopDiscoSound();
      }
    
      let playerColor = player.style.backgroundColor;
      let ballColor = ball.style.backgroundColor;
    
      playSound(discoSoundBuffer, true).then(newDiscoSoundSource => {
        discoSoundSource = newDiscoSoundSource;
    
        discoInterval = setInterval(() => {
          player.style.backgroundColor = randomColor();
          ball.style.backgroundColor = randomColor();
        }, 200);
      });
    
      discoPowerUpTimeout = setTimeout(() => {
        clearInterval(discoInterval);
        stopDiscoSound();
        lastColor = player.style.backgroundColor;
        player.style.backgroundColor = playerColor;
        ball.style.backgroundColor = ballColor;
        activePowerUp = false;
        if (backgroundMusicPaused) {
          resumeBackgroundMusic();
        }
      }, 10000); // 10 seconds
    }
    
    
    
   else if (powerUp === 'invert') {
    clearTimeout(invertPowerUpTimeout);
    invertedControlActive = true;

    playSound(giggleSoundBuffer); // Add this line to play the giggle sound

    invertPowerUpTimeout = setTimeout(() => {
      invertedControlActive = false;
      activePowerUp = false;
    }, 5000);
  }
  }
  
 
  
  
  

  function getRandomPowerUp() {
    const powerUps = ['disco', 'speed', 'invert', 'size'];
    return powerUps[Math.floor(Math.random() * powerUps.length)];
  }
  



  function spawnPowerUps() {
    if (activePowerUp) {
      return;
    }
  
    let powerUpSpawnProbability = 0;
  
    const calculatePowerUpSpawnProbability = (timeElapsed) => {
      return timeElapsed / 10000;
    };
  
    const elapsedTime = new Date().getTime() - lastPowerUpSpawnTime;
    powerUpSpawnProbability = calculatePowerUpSpawnProbability(elapsedTime);
  
    if (powerUpSpawnProbability >= Math.random()) {
      const powerUpType = Math.floor(Math.random() * 4);
      const powerUpPosX = Math.random() * (game.offsetWidth - 50);
      const powerUpPosY = Math.random() * game.offsetHeight / 2; // Set initial top position to a random value between 0 and half of game height
  
      switch (powerUpType) {
        case 0:
          console.log('Spawning power-up size');
          powerups[0].type = 'size';
          powerups[0].element.style.display = 'block';
          powerups[0].element.style.left = powerUpPosX + 'px';
          powerups[0].element.style.top = powerUpPosY + 'px';
          break;
        case 1:
          console.log('Spawning power-up speed');
          powerups[1].type = 'speed';
          powerups[1].element.style.display = 'block';
          powerups[1].element.style.left = powerUpPosX + 'px';
          powerups[1].element.style.top = powerUpPosY + 'px';
          break;
        case 2:
          console.log('Spawning power-up disco');
          powerups[2].type = 'disco';
          powerups[2].element.style.display = 'block';
          powerups[2].element.style.left = powerUpPosX + 'px';
          powerups[2].element.style.top = powerUpPosY + 'px';
          break;
        case 3:
          console.log('Spawning power-up invert');
          powerups[3].type = 'invert';
          powerups[3].element.style.display = 'block';
          powerups[3].element.style.left = powerUpPosX + 'px';
          powerups[3].element.style.top = powerUpPosY + 'px';
          break;
      }
  
      activePowerUp = true;
      lastPowerUpSpawnTime = new Date().getTime();
    }
  }
  


  function resetBall() {
    if (ballPosY + ball.offsetHeight > game.offsetHeight) {
      score = 0;
      updateScore();
      if (window.parent !== window) {
        window.parent.postMessage('gameOver', '*'); // Send message to parent window
      }
    }
    ballPosX = Math.random() * (game.offsetWidth - ball.offsetWidth);
    ballPosY = -ball.offsetHeight;
    ball.style.left = ballPosX + 'px';
    ball.style.top = ballPosY + 'px';
  }
  
  
// Add this function to the game's JavaScript code
function gameOver() {
  // Send a message to the parent window to inform that the game is over
  window.parent.postMessage('gameOver', '*');
}


  
  
  
  



  

function updateScore() {
    scoreDisplay.textContent = 'Score: ' + score;
}

 

 





  

  

function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function hidePowerUps() {
    powerUpSize.style.display = 'none';
    powerUpSpeed.style.display = 'none';
    powerUpDisco.style.display = 'none';
    powerUpInvert.style.display = 'none';

    powerUpSizePosY = -Math.random() * 500 - 50;
    powerUpSpeedPosY = -Math.random() * 500 - 50;
    powerUpDiscoPosY = -Math.random() * 500 - 50;
    powerUpInvertPosY = -Math.random() * 500 - 50;

}




hidePowerUps();
gameLoop();


