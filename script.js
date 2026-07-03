/* ============================================================
   Water Quest — charity: water
<<<<<<< HEAD
   Tap the yellow jerry cans before they vanish. Reach the goal to win.
=======
   Tap the yellow jerry cans before they vanish. Hit 20 to win.
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
   Dirty-water cans are the obstacle (they cost you points).
   ============================================================ */
(() => {
  "use strict";

<<<<<<< HEAD
  // ----- Sound effects (10 pts) -----
  // MP3s downloaded from Pixabay/Freesound and uploaded to the Codespace.
  // Keep these three files in the SAME folder as index.html.
  const SFX = {
    start:    new Audio("freesound_community-game-start-6104.mp3"),   // Start button
    win:      new Audio("soundreality-game-explosion-321700.mp3"),    // Win celebration
    gameover: new Audio("alphix-game-over-417465.mp3")                // Time's up / loss
  };
  Object.values(SFX).forEach(a => { a.preload = "auto"; });

  function playSfx(name) {
    const a = SFX[name];
    if (!a) return;
    a.currentTime = 0;                     // restart if it's mid-play
    a.play().catch(() => {});              // ignore autoplay blocks
  }

  // Tiny synthesized blips for collecting / missing cans, generated with the
  // Web Audio API so we don't need extra files (and they can overlap rapidly).
  let audioCtx = null;
  function blip(freqStart, freqEnd, duration, type = "sine", volume = 0.18) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) { /* audio unsupported — fail silently */ }
  }
  const collectSound = () => blip(520, 940, 0.16, "sine");        // cheerful "plink"
  const missSound    = () => blip(300, 140, 0.22, "triangle");    // low "womp"
  const dirtySound   = () => blip(220, 80, 0.3, "sawtooth", 0.14);// harsher buzz

  // ----- Difficulty modes -----
  // Each mode changes the goal, the pace, and the rules.
  const DIFFICULTIES = {
    easy: {
      label: "Easy",
      seconds: 40,        // more time
      winThreshold: 12,   // lower goal
      spawnMs: 850,       // slower spawns
      canLifeMin: 1000,   // cans linger longer
      canLifeMax: 1550,
      dirtyChance: 0.12   // fewer dirty cans
    },
    normal: {
      label: "Normal",
      seconds: 30,
      winThreshold: 20,
      spawnMs: 720,
      canLifeMin: 850,
      canLifeMax: 1300,
      dirtyChance: 0.18
    },
    hard: {
      label: "Hard",
      seconds: 25,        // less time
      winThreshold: 24,   // higher goal
      spawnMs: 520,       // faster spawns
      canLifeMin: 650,    // cans vanish quicker
      canLifeMax: 1000,
      dirtyChance: 0.28   // more dirty cans
    }
  };
  let difficulty = DIFFICULTIES.normal;

  const GRID_CELLS = 9; // 3 x 3
=======
  // ----- Config -----
  const GAME_SECONDS  = 30;
  const WIN_THRESHOLD = 20;
  const GRID_CELLS    = 9;     // 3 x 3
  const SPAWN_MS      = 720;   // how often a can appears
  const CAN_LIFE_MIN  = 850;   // can stays up (ms)
  const CAN_LIFE_MAX  = 1300;
  const DIRTY_CHANCE  = 0.18;  // chance of a score-reducing dirty can
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4

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
<<<<<<< HEAD
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ----- Milestones (10 pts) -----
  // An ARRAY of milestone messages; conditionals in setScore() trigger them.
  // Thresholds are generated from the current goal so they fit every mode.
  function buildMilestones(goal) {
    return [
      { at: Math.ceil(goal * 0.25), text: "Nice start!" },
      { at: Math.ceil(goal * 0.5),  text: "Halfway to the well! 💛" },
      { at: Math.ceil(goal * 0.75), text: "Almost there!" },
      { at: goal,                   text: "Goal reached! Keep collecting!" }
    ];
  }
  let milestones = buildMilestones(difficulty.winThreshold);

  // ----- Jerry can artwork -----
  // Clean can: signature yellow.
=======
  const MILESTONES = {
    5:  "Nice start — 5 cans!",
    10: "Halfway to the well! 💛",
    15: "Almost there — 15!",
    20: "Goal reached! Keep collecting!"
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ----- Jerry can artwork (used for cans, brand mark, and overlay) -----
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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

<<<<<<< HEAD
  // Dirty can: murky green PLUS non-color cues (wavy contamination drips
  // and a bold "avoid" badge) so it reads clearly for colorblind players.
  const DIRTY_CAN_SVG = `
    <svg viewBox="0 0 100 116" aria-hidden="true">
      <path class="body" fill="#4FCB53"
        d="M30 6 h40 a8 8 0 0 1 8 8 v10 h-12 v-6 a2 2 0 0 0-2-2 H36 a2 2 0 0 0-2 2 v6 H22 V14 a8 8 0 0 1 8-8 z"/>
      <rect class="body" fill="#4FCB53" x="42" y="18" width="16" height="9" rx="2"/>
      <rect class="body" fill="#4FCB53" x="14" y="26" width="72" height="84" rx="12"/>
      <rect class="panel" fill="#3EA342" x="26" y="40" width="48" height="58" rx="8"/>
      <!-- contamination squiggles instead of the clean X -->
      <path d="M32 56 q6 -6 12 0 t12 0 t12 0 M32 72 q6 -6 12 0 t12 0 t12 0 M32 88 q6 -6 12 0 t12 0 t12 0"
        stroke="#1E4D22" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>
      <!-- murky drip from the spout -->
      <path d="M50 27 q-3 8 0 12 q3 -4 0 -12" fill="#1E4D22" opacity=".7"/>
      <!-- bold "avoid" badge: shape cue, not just color -->
      <g class="avoid-badge">
        <circle cx="78" cy="20" r="15" fill="#14223A" stroke="#FFFFFF" stroke-width="3"/>
        <path d="M71 13 L85 27 M85 13 L71 27" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>`;

=======
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
  // ----- Grab the existing elements -----
  const container  = document.querySelector(".container");
  const grid       = document.querySelector(".game-grid");
  const scoreEl    = document.getElementById("current-cans");
  const timeEl     = document.getElementById("timer");
  const startBtn   = document.getElementById("start-game");
  const resetBtn   = document.getElementById("reset-game");
  const achieveEl  = document.getElementById("achievements");
  const statsEl    = document.querySelector(".stats");
<<<<<<< HEAD
  const instrEl    = document.querySelector(".game-instructions");
=======
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4

  // ----- Brand header above the title -----
  const h1 = container.querySelector("h1");
  const brand = document.createElement("div");
  brand.className = "brandbar";
  brand.innerHTML = CAN_SVG + '<span class="wordmark">charity: water</span>';
  container.insertBefore(brand, h1);
  h1.innerHTML = 'Water<span class="drip">Quest</span>';

<<<<<<< HEAD
  // ----- Difficulty picker (injected after the instructions) -----
  const diffBar = document.createElement("div");
  diffBar.className = "difficulty";
  diffBar.setAttribute("role", "group");
  diffBar.setAttribute("aria-label", "Difficulty");
  Object.entries(DIFFICULTIES).forEach(([key, cfg]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "diff-btn" + (cfg === difficulty ? " active" : "");
    b.dataset.key = key;
    b.setAttribute("aria-pressed", cfg === difficulty ? "true" : "false");
    b.innerHTML = `${cfg.label}<small>${cfg.winThreshold} cans · ${cfg.seconds}s</small>`;
    b.addEventListener("click", () => setDifficulty(key));
    diffBar.appendChild(b);
  });
  instrEl.insertAdjacentElement("afterend", diffBar);

  function setDifficulty(key) {
    if (running) return; // can't switch mid-round
    difficulty = DIFFICULTIES[key];
    milestones = buildMilestones(difficulty.winThreshold);
    diffBar.querySelectorAll(".diff-btn").forEach(b => {
      const active = b.dataset.key === key;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    updateInstructions();
    resetGame();
  }

  function updateInstructions() {
    instrEl.textContent =
      `Collect ${difficulty.winThreshold} clean cans in ${difficulty.seconds} seconds! ` +
      `Miss a clean can and you lose a point — tap a dirty green can and you lose two.`;
  }
  updateInstructions();

=======
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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
<<<<<<< HEAD
  let timeLeft = difficulty.seconds;
=======
  let timeLeft = GAME_SECONDS;
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
  let running = false;
  let countdownId = null;
  let spawnId = null;
  let shownMilestones = {};

  function setScore(n) {
    const prev = score;
    score = Math.max(0, n);            // never below zero
    scoreEl.textContent = score;
<<<<<<< HEAD
    // Milestone check: loop the array; conditional fires each message once.
    if (score > prev) {
      for (const m of milestones) {
        if (score >= m.at && !shownMilestones[m.at]) {
          shownMilestones[m.at] = true;
          showAchievement(m.text);
        }
      }
=======
    if (score > prev && MILESTONES[score] && !shownMilestones[score]) {
      shownMilestones[score] = true;
      showAchievement(MILESTONES[score]);
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
    }
  }

  function showAchievement(text) {
    achieveEl.innerHTML = '<span class="badge">' + text + '</span>';
  }

  function updateTimer() {
    timeEl.textContent = timeLeft;
<<<<<<< HEAD
    timerFill.style.width = (timeLeft / difficulty.seconds) * 100 + "%";
=======
    timerFill.style.width = (timeLeft / GAME_SECONDS) * 100 + "%";
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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
<<<<<<< HEAD
    const dirty = Math.random() < difficulty.dirtyChance;   // the obstacle
=======
    const dirty = Math.random() < DIRTY_CHANCE;   // the obstacle
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4

    const btn = document.createElement("button");
    btn.className = "can-btn" + (dirty ? " dirty" : "");
    btn.setAttribute("aria-label", dirty ? "Dirty water — avoid" : "Clean water can — tap");
<<<<<<< HEAD
    btn.innerHTML = dirty ? DIRTY_CAN_SVG : CAN_SVG;

    let resolved = false;
    const life = difficulty.canLifeMin +
      Math.random() * (difficulty.canLifeMax - difficulty.canLifeMin);

    const removeCan = () => {
      btn.classList.remove("up");
      setTimeout(() => btn.remove(), 180);   // element leaves the DOM
=======
    btn.innerHTML = CAN_SVG;

    let resolved = false;
    const life = CAN_LIFE_MIN + Math.random() * (CAN_LIFE_MAX - CAN_LIFE_MIN);

    const removeCan = () => {
      btn.classList.remove("up");
      setTimeout(() => btn.remove(), 180);
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
    };

    const expire = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      if (!dirty) {                    // missing a clean can costs a point
        flash(hole, "\u22121", "minus");
<<<<<<< HEAD
        missSound();                   // SFX: missed a clean can
=======
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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
<<<<<<< HEAD
        dirtySound();                  // SFX: tapped a dirty can
      } else {
        setScore(score + 1);
        flash(hole, "+1", "plus");
        collectSound();                // SFX: collected a clean can
      }
      removeCan();                     // collected/hit cans are removed from the DOM
    });

    hole.appendChild(btn);             // element added to the DOM
=======
      } else {
        setScore(score + 1);
        flash(hole, "+1", "plus");
      }
      removeCan();
    });

    hole.appendChild(btn);
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
    requestAnimationFrame(() => btn.classList.add("up"));
  }

  function startGame() {
    if (running) return;
    running = true;
<<<<<<< HEAD
    playSfx("start");                  // SFX: game-start mp3 on button click
=======
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
    score = 0;
    scoreEl.textContent = "0";
    shownMilestones = {};
    achieveEl.innerHTML = "";
<<<<<<< HEAD
    timeLeft = difficulty.seconds;
=======
    timeLeft = GAME_SECONDS;
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
    updateTimer();
    overlay.classList.remove("show");
    startBtn.disabled = true;
    startBtn.textContent = "Collecting…";
<<<<<<< HEAD
    diffBar.classList.add("locked");

    spawnCan();
    spawnId = setInterval(spawnCan, difficulty.spawnMs);
=======

    spawnCan();
    spawnId = setInterval(spawnCan, SPAWN_MS);
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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
<<<<<<< HEAD
    timeLeft = difficulty.seconds;
    updateTimer();
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
    diffBar.classList.remove("locked");
=======
    timeLeft = GAME_SECONDS;
    updateTimer();
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
  }

  function endGame() {
    running = false;
    clearInterval(countdownId);
    clearInterval(spawnId);
    clearBoard();
<<<<<<< HEAD
    diffBar.classList.remove("locked");

    const won = score >= difficulty.winThreshold;
    playSfx(won ? "win" : "gameover"); // SFX: explosion mp3 on win, game-over mp3 on loss
    ovTitle.textContent = won ? "You filled the well!" : "Time's up!";
    ovFinal.textContent = "You collected " + score + " can" + (score === 1 ? "" : "s") +
      " on " + difficulty.label;
=======

    const won = score >= WIN_THRESHOLD;
    ovTitle.textContent = won ? "You filled the well!" : "Time's up!";
    ovFinal.textContent = "You collected " + score + " can" + (score === 1 ? "" : "s");
>>>>>>> 5e5f848544b63def303812f7ac92dd94f915f7e4
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