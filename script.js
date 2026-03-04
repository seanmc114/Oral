// ================================
// ORAL GAME SCRIPT
// ================================

let round = 0;
let questionEl = document.getElementById("question");
let answerEl = document.getElementById("answer");
let feedbackEl = document.getElementById("feedback");


// ================================
// LOAD FIRST QUESTION
// ================================

function newQuestion(){

let theme = localStorage.getItem("theme") || "barrio";
let tense = localStorage.getItem("tense") || "present";

fetch("questions.json")
.then(r => r.json())
.then(data => {

let list = data[theme][tense];

let q = list[Math.floor(Math.random()*list.length)];

questionEl.innerText = q;

});

}


// ================================
// SPEAK QUESTION
// ================================

function speakQuestion(){

let u = new SpeechSynthesisUtterance(questionEl.innerText);

u.lang = "es-ES";
u.rate = 0.95;

speechSynthesis.cancel();
speechSynthesis.speak(u);

}


// ================================
// SUBMIT ANSWER → AI COACH
// ================================

async function submitAnswer(){

let ans = answerEl.value.trim();

if(!ans) return;

feedbackEl.innerHTML = "Thinking…";

let result;

try{

result = await classifyAnswer({

task: questionEl.innerText,
answer: ans,
lang: "lc"

});

}catch{

feedbackEl.innerHTML = "AI error. Try again.";
return;

}

feedbackEl.innerHTML = `

<h3>Score: ${result.score}</h3>

<p><strong>Main issue:</strong> ${result.focus}</p>

<p>${result.feedback}</p>

<button onclick="nextQuestion()">Next Question</button>

`;

if(result.next_question){

questionEl.innerText = result.next_question;

}

round++;

}


// ================================
// NEXT QUESTION
// ================================

function nextQuestion(){

answerEl.value = "";

feedbackEl.innerHTML = "";

}


// ================================
// UNIVERSAL DICTATION (WORKS IN SAFARI)
// ================================

let mediaRecorder;
let audioChunks = [];

document.getElementById("recordBtn").onclick = async () => {

audioChunks = [];

const stream = await navigator.mediaDevices.getUserMedia({audio:true});

mediaRecorder = new MediaRecorder(stream);

mediaRecorder.start();

mediaRecorder.ondataavailable = e => {

audioChunks.push(e.data);

};

mediaRecorder.onstop = async () => {

const blob = new Blob(audioChunks,{type:"audio/webm"});

const form = new FormData();

form.append("audio", blob, "speech.webm");

try{

const res = await fetch("/transcribe",{
method:"POST",
body:form
});

const data = await res.json();

answerEl.value = data.text;

}catch{

alert("Speech recognition failed.");

}

};

setTimeout(()=>{

mediaRecorder.stop();

},4000);

};


// ================================
// START GAME
// ================================

newQuestion();
