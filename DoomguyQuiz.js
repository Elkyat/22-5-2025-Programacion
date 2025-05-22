const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const background = new Image();
background.src = 'resources/background.png';

const spriteSheetDoomguy = new Image();
spriteSheetDoomguy.src = 'resources/doomguy.png';

let life = 100;
let questionsLoaded = false;
let storedQuestions = [];
let currentQuestionIndex = 0;
let currentOptions = [];

const frameWidth = 519;
const frameHeight = 176;
let currentFrame = 0;
let lastFrameTime = 0;
const frameRate = 6;
const frameDuration = 10000 / frameRate;

let startFrame = 0;
let totalFrames = 3;
let previousLife = life;
let isFlashing = false;
let flashFrameIndex = 0;
let flashDuration = 1000;
let flashStartTime = 0;

async function loadFilteredQuestions() {
  const desiredCount = 5;
  const maxLength = 50;

  while (storedQuestions.length < desiredCount) {
    try {
      const response = await fetch('https://the-trivia-api.com/v2/questions?limit=5');
      const data = await response.json();
      const filtered = data.filter(q => q.question.text.length <= maxLength);

      for (let i = 0; i < filtered.length && storedQuestions.length < desiredCount; i++) {
        storedQuestions.push(filtered[i]);
      }

    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      break;
    }
  }

  questionsLoaded = true;
  updateCurrentOptions();
}

function updateCurrentOptions() {
  if (!questionsLoaded || currentQuestionIndex >= storedQuestions.length) return;

  const question = storedQuestions[currentQuestionIndex];

  const incorrect = question.incorrectAnswers.slice(0, 2);

  while (incorrect.length < 2) {
    incorrect.push("N/A");
  }

  const options = [
    { text: question.correctAnswer, isCorrect: true },
    ...incorrect.map(ans => ({ text: ans, isCorrect: false }))
  ];

  currentOptions = options.sort(() => Math.random() - 0.5);

  const optionButtons = [
    document.getElementById('optionA'),
    document.getElementById('optionB'),
    document.getElementById('optionC')
  ];

  for (let i = 0; i < optionButtons.length; i++) {
    if (currentOptions[i]) {
      optionButtons[i].textContent = String.fromCharCode(65 + i) + ". " + currentOptions[i].text;
      optionButtons[i].disabled = false;
      optionButtons[i].style.visibility = "visible";
    } else {
      optionButtons[i].textContent = "";
      optionButtons[i].disabled = true;
      optionButtons[i].style.visibility = "hidden";
    }
  }
}


function handleAnswer(index) {
  if (!currentOptions[index]) return;
  const selected = currentOptions[index];

  if (selected.isCorrect) {
    currentQuestionIndex++;
    if (currentQuestionIndex < storedQuestions.length) {
      updateCurrentOptions();
    }
  } else {
    setLife(Math.max(life - 20, 0));
  }
}

function updateSpriteRange() {
  switch (life) {
    case 100: startFrame = 0; totalFrames = 3; break;
    case 80: startFrame = 4; totalFrames = 3; flashFrameIndex = 3; break;
    case 60: startFrame = 8; totalFrames = 3; flashFrameIndex = 7; break;
    case 40: startFrame = 12; totalFrames = 3; flashFrameIndex = 11; break;
    case 20: startFrame = 16; totalFrames = 3; flashFrameIndex = 15; break;
    case 0: startFrame = 19; totalFrames = 1; break;
    default: startFrame = 0; totalFrames = 1; flashFrameIndex = 0;
  }
}

function setLife(newLife) {
  if (newLife !== life) {
    previousLife = life;
    life = newLife;
    updateSpriteRange();
    isFlashing = true;
    flashStartTime = performance.now();
  }
}

function animateDoomguy(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = timestamp - lastFrameTime;

  if (background.complete) {
    const pattern = ctx.createPattern(background, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const scale = 0.85;
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;

  if (isFlashing) {
    ctx.drawImage(
      spriteSheetDoomguy,
      flashFrameIndex * frameWidth, 0,
      frameWidth, frameHeight,
      230, 453,
      drawWidth, drawHeight
    );

    if (timestamp - flashStartTime >= flashDuration) {
      isFlashing = false;
      lastFrameTime = timestamp;
      currentFrame = 0;
    }

  } else {
    if (elapsed >= frameDuration) {
      currentFrame = (currentFrame + 1) % totalFrames;
      lastFrameTime = timestamp;
    }

    ctx.drawImage(
      spriteSheetDoomguy,
      (startFrame + currentFrame) * frameWidth, 0,
      frameWidth, frameHeight,
      230, 453,
      drawWidth, drawHeight
    );
  }

  ctx.font = '28px doomed';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'darkred';
  ctx.shadowBlur = 25;

  if (questionsLoaded && currentQuestionIndex < storedQuestions.length) {
    const question = storedQuestions[currentQuestionIndex];
    ctx.fillText(question.question.text, canvas.width / 2, canvas.height / 3);
  } else {
    ctx.fillText("loading answers...", canvas.width / 2, canvas.height / 3);
  }

  requestAnimationFrame(animateDoomguy);
}


document.getElementById('optionA').addEventListener('click', () => handleAnswer(0));
document.getElementById('optionB').addEventListener('click', () => handleAnswer(1));
document.getElementById('optionC').addEventListener('click', () => handleAnswer(2));

spriteSheetDoomguy.onload = () => {
  updateSpriteRange();
  requestAnimationFrame(animateDoomguy);
};
loadFilteredQuestions();
