const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let life = 100;
function setLife(newLife) {
  life = newLife;
  console.log("Vida actual:", life);
}

let storedQuestions = [];
let questionsLoaded = false;
let currentQuestionIndex = 0;
let currentOptions = [];

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
  const options = [
    { text: question.correctAnswer, isCorrect: true },
    ...question.incorrectAnswers.map(ans => ({ text: ans, isCorrect: false }))
  ];

  // Mezclar
  currentOptions = options.sort(() => Math.random() - 0.5);
}

function handleAnswer(index) {
  if (!currentOptions[index]) return;

  const selected = currentOptions[index];

  if (selected.isCorrect) {
    currentQuestionIndex++;
    if (currentQuestionIndex < storedQuestions.length) {
      updateCurrentOptions();
    } else {
      console.log("¡Ganaste!");
    }
  } else {
    setLife(Math.max(life - 20, 0));
    console.log("Incorrecto. Vida: ", life);
  }
}

document.getElementById('optionA').addEventListener('click', () => handleAnswer(0));
document.getElementById('optionB').addEventListener('click', () => handleAnswer(1));
document.getElementById('optionC').addEventListener('click', () => handleAnswer(2));

function animateDoomguy() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  if (questionsLoaded && storedQuestions.length > 0 && currentQuestionIndex < storedQuestions.length) {
    const question = storedQuestions[currentQuestionIndex];
    ctx.fillText(question.question.text, canvas.width / 2, canvas.height / 3);

    currentOptions.forEach((opt, i) => {
      const prefix = i === 0 ? "A. " : i === 1 ? "B. " : "C. ";
      ctx.fillText(prefix + opt.text, canvas.width / 2, canvas.height / 2 + i * 30);
    });
  } else if (questionsLoaded && currentQuestionIndex >= storedQuestions.length) {
    ctx.fillText("¡Ganaste!", canvas.width / 2, canvas.height / 2);
  } else {
    ctx.fillText("loading answers...", canvas.width / 2, canvas.height / 3);
  }

  requestAnimationFrame(animateDoomguy);
}

// Inicializar
loadFilteredQuestions();
animateDoomguy();
