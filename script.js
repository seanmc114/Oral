const CONFIG = { ROUNDS: 3 };

// Topic labels for the pill
const TOPIC_LABEL = {
  daily:   "Vida diaria",
  school:  "El instituto",
  friends: "Amigos y familia",
  free:    "Tiempo libre",
  plans:   "Planes (futuro)",
  hols:    "Vacaciones"
};

// Spanish prompts by topic (short, oral-friendly)
const PROMPTS = {
  daily: [
    "¿Cómo es tu casa?",
    "Describe a tu familia.",
    "¿Qué haces por la mañana?",
    "¿Qué haces por la tarde?"
  ],
  school: [
    "¿Cómo es tu instituto?",
    "¿Cuál es tu asignatura favorita? ¿Por qué?",
    "¿Qué cambiarías en tu instituto?",
    "Describe a un profesor."
  ],
  friends: [
    "Describe a tu mejor amigo.",
    "¿Qué haces con tus amigos?",
    "¿Cómo te llevas con tu familia?",
    "Describe a alguien en tu familia."
  ],
  free: [
    "¿Qué haces en tu tiempo libre?",
    "¿Te gusta el deporte? ¿Por qué?",
    "¿Qué música te gusta?",
    "¿Qué haces el fin de semana?"
  ],
  plans: [
    "¿Qué vas a hacer después de los exámenes?",
    "¿Qué quieres hacer en el futuro?",
    "¿Te gustaría ir a la universidad? ¿Por qué?",
    "¿Dónde te gustaría vivir en el futuro?"
  ],
  hols: [
    "Describe tus vacaciones favoritas.",
    "¿Dónde fuiste el año pasado?",
    "¿Qué hiciste en verano?",
    "¿Prefieres vacaciones en Irlanda o en el extranjero? ¿Por qué?"
  ]
};

let round = 0;
let scores = [];
let focuses = [];
let startTime = null;
let currentPrompt = "";

// -------- Robust EU Spanish TTS ----------
let VOICES_READY = false;

function markVoicesReady(){
  VOICES_READY = true;
}
speechSynthesis.onvoiceschanged = markVoicesReady;

function pickVoice(lang = "es-ES"){
  const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
  // Prefer exact es-ES, then any es-
  return (
    voices.find(v => v.lang && v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith("es")) ||
    null
  );
}

function speakES(text){
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = 0.95;
  const v = pickVoice("es-ES");
  if (v) u.voice = v;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// -------- Speech recognition (es-ES) ----------
function startDictation(onText){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){
    alert("Speech recognition not supported on this browser.");
    return;
  }
  const rec = new SR();
  rec.lang = "es-ES";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    const t = e.results?.[0]?.[0]?.transcript || "";
    onText(t);
  };

  rec.onerror = () => {
    alert("Dictation failed. Try again.");
  };

  rec.start();
}

// -------- Page logic ----------
document.addEventListener("DOMContentLoaded", () => {
  // If we're on tile page, do nothing (tile page has inline JS)
  if (!document.getElementById("runBtn")) return;

  const topic = localStorage.getItem("oral_topic") || "daily";
  const topicPrompts = PROMPTS[topic] || PROMPTS.daily;

  const backBtn = document.getElementById("backBtn");
  const topicPill = document.getElementById("topicPill");
  const taskEl = document.getElementById("task");
  const ans = document.getElementById("answer");
  const out = document.getElementById("out");
  const runBtn = document.getElementById("runBtn");
  const readTaskBtn = document.getElementById("readTask");
  const dictateBtn = document.getElementById("dictateBtn");

  topicPill.textContent = TOPIC_LABEL[topic] || "Tema";

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  function newPrompt(){
    currentPrompt = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];
    taskEl.textContent = currentPrompt;
  }

  newPrompt();

  readTaskBtn.addEventListener("click", () => {
    // Ensure voices load on first interaction in some browsers
    if (!VOICES_READY) speechSynthesis.getVoices();
    speakES(currentPrompt);
  });

  dictateBtn.addEventListener("click", () => {
    startDictation((t) => {
      // Append with a space if needed
      ans.value = (ans.value.trim() ? ans.value.trim() + " " : "") + t;
    });
  });

  function starsFor(score100){
    if (score100 >= 85) return 3;
    if (score100 >= 70) return 2;
    if (score100 >= 55) return 1;
    return 0;
  }

  runBtn.addEventListener("click", async () => {
    if (!startTime) startTime = Date.now();

    const answer = ans.value.trim();
    if (!answer) return;

    runBtn.disabled = true;
    ans.disabled = true;

    out.classList.remove("hidden");
    out.innerHTML = "Thinking…";

    let result;
    try{
      // Use LC mode in your worker
      result = await window.classifyAnswer({
        task: currentPrompt,
        answer,
        lang: "lc"
      });
    } catch (e){
      result = { score: 0, focus: "Error", feedback: "AI error — try again." };
    }

    scores.push(Number(result.score) || 0);
    focuses.push(result.focus || "");
    round++;

    renderFeedback(result);
  });

  function renderFeedback(result){
    const progress = (round / CONFIG.ROUNDS) * 100;
    const sc = Number(result.score) || 0;
    const st = starsFor(sc);
    const starStr = "⭐".repeat(st) + (st === 0 ? "" : "");

    out.innerHTML = `
      <div><strong>Round ${round}/${CONFIG.ROUNDS}</strong></div>

      <div style="height:10px;background:#ddd;border-radius:20px;margin:10px 0;">
        <div style="height:10px;background:#003366;width:${progress}%;border-radius:20px;"></div>
      </div>

      <div style="font-size:2rem;margin:10px 0;font-weight:800;">
        ${sc}/100 ${starStr}
      </div>

      <div style="margin-bottom:10px;">
        <strong>Focus:</strong> ${result.focus || "—"}
      </div>

      <div style="margin-bottom:14px;">
        ${result.feedback || "—"}
      </div>

      <button id="speakFeedback" class="smallBtn" type="button">🔊 Read</button>
      <button id="tryAgainBtn" type="button">Try Again</button>
      <button id="nextBtn" type="button">Next</button>
    `;

    document.getElementById("speakFeedback").addEventListener("click", () => {
      // Feedback is in English in your system — keep it readable.
      // If you later switch to Spanish feedback, just call speakES().
      const u = new SpeechSynthesisUtterance(result.feedback || "");
      u.lang = "en-IE";
      u.rate = 0.95;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });

    document.getElementById("tryAgainBtn").addEventListener("click", () => {
      ans.disabled = false;
      runBtn.disabled = false;
      ans.focus();
      out.classList.add("hidden");
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      if (round < CONFIG.ROUNDS){
        ans.disabled = false;
        runBtn.disabled = false;
        ans.value = "";
        ans.focus();
        newPrompt();
        out.classList.add("hidden");
      } else {
        renderSummary();
      }
    });
  }

  function renderSummary(){
    const avg = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
    const time = Math.floor((Date.now() - startTime) / 1000);

    const sessionStars = starsFor(avg);

    // update total stars + best stars per topic
    const totalKey = "oral_totalStars";
    const bestKey = `oral_bestStars_${topic}`;

    const total = Number(localStorage.getItem(totalKey) || 0);
    const best = Number(localStorage.getItem(bestKey) || 0);

    localStorage.setItem(totalKey, String(total + sessionStars));
    localStorage.setItem(bestKey, String(Math.max(best, sessionStars)));

    out.innerHTML = `
      <hr>
      <h2>Session Complete</h2>
      <div style="font-size:2rem;margin:10px 0;font-weight:800;">
        ${avg}/100 ${"⭐".repeat(sessionStars)}
      </div>
      <div>Time: ${time}s</div>
      <div>Scores: ${scores.join(" → ")}</div>

      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
        <button id="playAgain" type="button">Play Again</button>
        <button id="backHome" class="ghost" type="button">Back to Tiles</button>
      </div>
    `;

    document.getElementById("playAgain").addEventListener("click", () => {
      round = 0;
      scores = [];
      focuses = [];
      startTime = null;
      ans.disabled = false;
      runBtn.disabled = false;
      ans.value = "";
      ans.focus();
      newPrompt();
      out.classList.add("hidden");
    });

    document.getElementById("backHome").addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});
