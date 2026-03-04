const ROUNDS = 3;

const THEMES = {

barrio:{
present:[
"¿Cómo es tu barrio?",
"¿Qué hay en tu barrio?",
"¿Te gusta tu barrio? ¿Por qué?"
],
past:[
"¿Cómo era tu barrio cuando eras niño?",
"¿Qué hacías en tu barrio de pequeño?"
],
future:[
"¿Te gustaría vivir en otro lugar en el futuro?"
]
},

instituto:{
present:[
"¿Cómo es tu instituto?",
"¿Cuál es tu asignatura favorita? ¿Por qué?",
"¿Te gusta tu instituto? ¿Por qué?"
],
past:[
"¿Cómo era tu primer año en el instituto?"
],
future:[
"¿Qué cambiarías en tu instituto?"
]
},

amigos:{
present:[
"Describe a tu mejor amigo.",
"¿Qué haces con tus amigos?",
"¿Te gusta salir con tus amigos? ¿Por qué?"
],
past:[
"¿Qué hiciste con tus amigos el fin de semana pasado?"
],
future:[
"¿Qué vas a hacer con tus amigos el próximo fin de semana?"
]
},

tiempo:{
present:[
"¿Qué haces en tu tiempo libre?",
"¿Te gusta el deporte? ¿Por qué?"
],
past:[
"¿Qué hiciste el fin de semana pasado?"
],
future:[
"¿Qué vas a hacer el fin de semana que viene?"
]
},

vacaciones:{
present:[
"¿Te gustan las vacaciones? ¿Por qué?"
],
past:[
"¿Dónde fuiste el verano pasado?",
"¿Qué hiciste el verano pasado?"
],
future:[
"¿Dónde te gustaría ir el próximo verano?"
]
},

futuro:{
present:[
"¿Te gusta pensar en el futuro? ¿Por qué?"
],
past:[],
future:[
"¿Qué vas a hacer después de los exámenes?",
"¿Qué quieres estudiar?",
"¿Dónde te gustaría vivir?"
]
}

};

let theme = localStorage.getItem("theme") || "barrio";

let prompts = [
...THEMES[theme].present,
...THEMES[theme].past,
...THEMES[theme].future
];

let round = 0;
let scores = [];

let taskEl=document.getElementById("task");
let ans=document.getElementById("answer");
let out=document.getElementById("out");

function newPrompt(){

taskEl.innerText=prompts[Math.floor(Math.random()*prompts.length)];

}

function speak(text){

let u=new SpeechSynthesisUtterance(text);

u.lang="es-ES";

speechSynthesis.speak(u);

}

document.getElementById("readTask").onclick=()=>{

speak(taskEl.innerText);

};

document.getElementById("dictateBtn").onclick=()=>{

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

if(!SpeechRecognition){

alert("Speech input works in Chrome or Edge. You can type your answer.");
return;

}

let r=new SpeechRecognition();

r.lang="es-ES";

r.onresult=e=>{

ans.value=e.results[0][0].transcript;

};

r.start();

};

function stars(score){

if(score>=85) return 3;
if(score>=70) return 2;
if(score>=55) return 1;
return 0;

}

document.getElementById("runBtn").onclick=async()=>{

let answer=ans.value.trim();

if(!answer) return;

out.classList.remove("hidden");

out.innerHTML="Thinking...";

let result=await classifyAnswer({

task:taskEl.innerText,
answer:answer,
lang:"lc"

});

scores.push(result.score);

round++;

let starCount=stars(result.score);

out.innerHTML=`

Score: ${result.score}/100 ${"⭐".repeat(starCount)}

<p><strong>Focus:</strong> ${result.focus}</p>

<p>${result.feedback}</p>

<button id="nextBtn">Next</button>

`;

document.getElementById("nextBtn").onclick=()=>{

if(round<ROUNDS){

ans.value="";
newPrompt();
out.classList.add("hidden");

}else{

summary();

}

};

};

function summary(){

let avg=Math.round(scores.reduce((a,b)=>a+b)/scores.length);

let starEarned=stars(avg);

let total=Number(localStorage.getItem("stars")||0);

localStorage.setItem("stars",total+starEarned);

out.innerHTML=`

<h2>Session Complete</h2>

Average Score: ${avg}

Stars Earned: ${"⭐".repeat(starEarned)}

<p>Exam tip: add one reason using "porque".</p>

<button onclick="location.href='index.html'">Back to Tiles</button>

`;

}

newPrompt();
