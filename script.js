/* ============================================================
   Water Quest — charity: water
   Tap the yellow jerry cans before they vanish. Hit 20 to win.
   Dirty-water cans are the obstacle (they cost you points).
   ============================================================ */
(() => {
  "use strict";

  // ----- Config -----
  const GAME_SECONDS  = 30;
  const WIN_THRESHOLD = 20;
  const GRID_CELLS    = 9;     // 3 x 3
  const SPAWN_MS      = 720;   // how often a can appears
  const CAN_LIFE_MIN  = 850;   // can stays up (ms)
  const CAN_LIFE_MAX  = 1300;
  const DIRTY_CHANCE  = 0.18;  // chance of a score-reducing dirty can

  // ----- Feedback banks (hopeful tone, never guilt — per brand) -----
  const WIN_MESSAGES = [
    "Clean water delivered! You're a force of nature. 💛",
    "Incredible — that's real impact flowing downstream.",
    "You did it! Every tap brought someone closer to clean water.",
    "Champion of the well. The whole community thanks you.",
    "Overflowing with impact — you absolutely crushed it!"
  ];
  const LOSE_MESSAGES = [
    "So close! Every drop counts — give it another go.",
    "The well isn't full yet. Run it back!",
    "Good effort! Tap a little faster and you'll get there.",
    "Almost there — clean water is within reach. Try again.",
    "Don't stop now — the next round is yours."
  ];
  const MILESTONES = {
    5:  "Nice start — 5 cans!",
    10: "Halfway to the well! 💛",
    15: "Almost there — 15!",
    20: "Goal reached! Keep collecting!"
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ----- Jerry can artwork (used for cans, brand mark, and overlay) -----
  const CAN_SVG = `
    <svg viewBox="0 0 100 116" aria-hidden="true">
      <path class="body" fill="#FFC907"
        d="M30 6 h40 a8 8 0 0 1 8 8 v10 h-12 v-6 a2 2 0 0 0-2-2 H36 a2 2 0 0 0-2 2 v6 H22 V14 a8 8 0 0 1 8-8 z"/>
      <rect class="body" fill="#FFC907" x="42" y="18" width="16" height="9" rx="2"/>
      <rect class="body" fill="#FFC907" x="14" y="26" width="72" height="84" rx="12"/>
      <rect class="panel" fill="#F4B800" x="26" y="40" width="48" height="58" rx="8"/>
      <path d="M30 46 L70 92 M70 46 L30 92" stroke="#14223A" stroke-width="4"
        stroke-linecap="round" opacity=".55" fill="none"/>
    </svg>`;

  // ----- Grab the existing elements -----
  const container  = document.querySelector(".container");
  const grid       = document.querySelector(".game-grid");
  const scoreEl    = document.getElementById("current-cans");
  const timeEl     = document.getElementById("timer");
  const startBtn   = document.getElementById("start-game");
  const resetBtn   = document.getElementById("reset-game");
  const achieveEl  = document.getElementById("achievements");
  const statsEl    = document.querySelector(".stats");

  // ----- Brand header above the title -----
  const h1 = container.querySelector("h1");
  const brand = document.createElement("div");
  brand.className = "brandbar";
  brand.innerHTML = CAN_SVG + '<span class="wordmark">charity: water</span>';
  container.insertBefore(brand, h1);
  h1.innerHTML = 'Water<span class="drip">Quest</span>';

  // ----- Timer water bar (after .stats) -----
  const timerTrack = document.createElement("div");
  timerTrack.className = "timer-track";
  timerTrack.innerHTML = '<div class="timer-fill"></div>';
  statsEl.insertAdjacentElement("afterend", timerTrack);
  const timerFill = timerTrack.querySelector(".timer-fill");

  // ----- End overlay -----
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="card" role="dialog" aria-modal="true">
      <span class="result-can">${CAN_SVG}</span>
      <h2></h2>
      <p class="final"></p>
      <p class="message"></p>
      <button class="again">Play again</button>
    </div>`;
  document.body.appendChild(overlay);
  const ovTitle = overlay.querySelector("h2");
  const ovFinal = overlay.querySelector(".final");
  const ovMsg   = overlay.querySelector(".message");

  // ----- Build the 3x3 grid -----
  const holes = [];
  for (let i = 0; i < GRID_CELLS; i++) {
    const hole = document.createElement("div");
    hole.className = "hole";
    grid.appendChild(hole);
    holes.push(hole);
  }

  // ----- State -----
  let score = 0;
  let timeLeft = GAME_SECONDS;
  let running = false;
  let countdownId = null;
  let spawnId = null;
  let shownMilestones = {};

  function setScore(n) {
    const prev = score;
    score = Math.max(0, n);            // never below zero
    scoreEl.textContent = score;
    if (score > prev && MILESTONES[score] && !shownMilestones[score]) {
      shownMilestones[score] = true;
      showAchievement(MILESTONES[score]);
    }
  }

  function showAchievement(text) {
    achieveEl.innerHTML = '<span class="badge">' + text + '</span>';
  }

  function updateTimer() {
    timeEl.textContent = timeLeft;
    timerFill.style.width = (timeLeft / GAME_SECONDS) * 100 + "%";
    timerFill.classList.toggle("low", timeLeft <= 8);
  }

  function flash(hole, text, kind) {
    const b = document.createElement("span");
    b.className = "burst " + kind;
    b.textContent = text;
    hole.appendChild(b);
    setTimeout(() => b.remove(), 600);
  }

  function clearBoard() {
    holes.forEach(h => { const c = h.querySelector(".can-btn"); if (c) c.remove(); });
  }

  // Pop a can in a random empty hole
  function spawnCan() {
    const empty = holes.filter(h => !h.querySelector(".can-btn"));
    if (!empty.length) return;
    const hole = empty[Math.floor(Math.random() * empty.length)];
    const dirty = Math.random() < DIRTY_CHANCE;   // the obstacle

    const btn = document.createElement("button");
    btn.className = "can-btn" + (dirty ? " dirty" : "");
    btn.setAttribute("aria-label", dirty ? "Dirty water — avoid" : "Clean water can — tap");
    btn.innerHTML = CAN_SVG;

    let resolved = false;
    const life = CAN_LIFE_MIN + Math.random() * (CAN_LIFE_MAX - CAN_LIFE_MIN);

    const removeCan = () => {
      btn.classList.remove("up");
      setTimeout(() => btn.remove(), 180);
    };

    const expire = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      if (!dirty) {                    // missing a clean can costs a point
        flash(hole, "\u22121", "minus");
        setScore(score - 1);
      }
      removeCan();
    }, life);

    btn.addEventListener("click", () => {
      if (resolved || !running) return;
      resolved = true;
      clearTimeout(expire);
      if (dirty) {                     // OBSTACLE: tapping dirty water costs 2 points
        setScore(score - 2);
        flash(hole, "\u22122", "minus");
      } else {
        setScore(score + 1);
        flash(hole, "+1", "plus");
      }
      removeCan();
    });

    hole.appendChild(btn);
    requestAnimationFrame(() => btn.classList.add("up"));
  }

  function startGame() {
    if (running) return;
    running = true;
    score = 0;
    scoreEl.textContent = "0";
    shownMilestones = {};
    achieveEl.innerHTML = "";
    timeLeft = GAME_SECONDS;
    updateTimer();
    overlay.classList.remove("show");
    startBtn.disabled = true;
    startBtn.textContent = "Collecting…";

    spawnCan();
    spawnId = setInterval(spawnCan, SPAWN_MS);
    countdownId = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  // Stop everything and return to the starting state
  function resetGame() {
    running = false;
    clearInterval(countdownId);
    clearInterval(spawnId);
    clearBoard();
    overlay.classList.remove("show");
    score = 0;
    scoreEl.textContent = "0";
    shownMilestones = {};
    achieveEl.innerHTML = "";
    timeLeft = GAME_SECONDS;
    updateTimer();
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
  }

  function endGame() {
    running = false;
    clearInterval(countdownId);
    clearInterval(spawnId);
    clearBoard();

    const won = score >= WIN_THRESHOLD;
    ovTitle.textContent = won ? "You filled the well!" : "Time's up!";
    ovFinal.textContent = "You collected " + score + " can" + (score === 1 ? "" : "s");
    ovMsg.textContent   = won ? pick(WIN_MESSAGES) : pick(LOSE_MESSAGES);
    overlay.classList.add("show");
    if (won) launchConfetti();         // celebrate the win

    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
  }

  // ----- Confetti win celebration -----
  function launchConfetti() {
    // respect users who prefer reduced motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const colors = ["#FFC907", "#2E9DF7", "#8BD1CB", "#FFFFFF", "#F4B800"];
    const pieces = [];
    for (let i = 0; i < 140; i++) {
      pieces.push({
        x: Math.random() * W,
        y: Math.random() * -H,
        r: 4 + Math.random() * 7,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4
      });
    }

    const DURATION = 3200;
    const start = performance.now();
    function frame(t) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;          // gravity
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (elapsed < DURATION) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener("resize", onResize);
        canvas.remove();
      }
    }
    requestAnimationFrame(frame);
  }

  // ----- Wire up -----
  startBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", resetGame);
  overlay.querySelector(".again").addEventListener("click", () => {
    overlay.classList.remove("show");
    startGame();
  });

  updateTimer();
})();