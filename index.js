let TOTAL_Q = 10;
let selectedTeamFiles = [];

const CENTRAL_FILES = ['tigers.json', 'baystars.json', 'giants.json', 'dragons.json', 'carp.json', 'swallows.json'];
const PACIFIC_FILES = ['hawks.json', 'fighters.json', 'buffaloes.json', 'eagles.json', 'lions.json', 'marines.json'];
const ALL_FILES_TEAM = [...CENTRAL_FILES, ...PACIFIC_FILES, 'umpires.json'];
const IKUSEI_CENTRAL_FILES = [
  'datasets_ikusei/tigers_ikusei.json',
  'datasets_ikusei/baystars_ikusei.json',
  'datasets_ikusei/giants_ikusei.json',
  'datasets_ikusei/dragons_ikusei.json',
  'datasets_ikusei/carp_ikusei.json',
  'datasets_ikusei/swallows_ikusei.json',
];
const IKUSEI_PACIFIC_FILES = [
  'datasets_ikusei/hawks_ikusei.json',
  'datasets_ikusei/fighters_ikusei.json',
  'datasets_ikusei/buffaloes_ikusei.json',
  'datasets_ikusei/eagles_ikusei.json',
  'datasets_ikusei/lions_ikusei.json',
  'datasets_ikusei/marines_ikusei.json',
];
const IKUSEI_FILES = [
  ...IKUSEI_CENTRAL_FILES,
  ...IKUSEI_PACIFIC_FILES,
  'datasets_ikusei/umpires_ikusei.json',
];
let autoJudge = false;
let currentDataCount = 0;
const TIME_LIMIT = 8;

let questions = [];
let currentIdx = 0;
let score = 0;
let times = [];
let log = [];
let startTime = 0;
let timerInterval = null;
let answered = false;

function toHalfWidth(str) {
  return str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateQCountBtns() {
  const allFiles = [
    'datasets/umpires.json',
    'datasets/baystars.json',
    'datasets/buffaloes.json',
    'datasets/carp.json',
    'datasets/dragons.json',
    'datasets/eagles.json',
    'datasets/fighters.json',
    'datasets/giants.json',
    'datasets/lions.json',
    'datasets/hawks.json',
    'datasets/marines.json',
    'datasets/swallows.json',
    'datasets/tigers.json',
  ];
  const files = selectedTeamFiles.length === 0 ? allFiles : selectedTeamFiles.map(f => f.startsWith('datasets_ikusei/') ? f : `datasets/${f}`);
  Promise.all(files.map(f => fetch(f).then(res => res.json())))
    .then(results => {
      const count = results.flat().length;
      currentDataCount = count;
      document.querySelectorAll('.q-count-btn').forEach(btn => {
        const n = parseInt(btn.dataset.count, 10);
        if (n > count) {
          btn.disabled = true;
          btn.classList.remove('selected');
          if (TOTAL_Q > count) {
            TOTAL_Q = count;
          }
        } else {
          btn.disabled = false;
        }
      });
      // 現在selectedのボタンが無効になった場合、最大値に戻す
      const selectedBtn = document.querySelector('.q-count-btn.selected');
      if (!selectedBtn || selectedBtn.disabled) {
        document.querySelectorAll('.q-count-btn').forEach(btn => {
          if (!btn.disabled) TOTAL_Q = parseInt(btn.dataset.count, 10);
        });
        document.querySelectorAll('.q-count-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        // 有効なボタンの中で最大のものをselectedに
        const validBtns = [...document.querySelectorAll('.q-count-btn:not([disabled])')];
        if (validBtns.length > 0) {
          const maxBtn = validBtns[validBtns.length - 1];
          maxBtn.classList.add('selected');
          TOTAL_Q = parseInt(maxBtn.dataset.count, 10);
        }
      }
    });
}

function startGame() {
  const selectedQBtn = document.querySelector('.q-count-btn.selected');
  if (selectedQBtn) TOTAL_Q = parseInt(selectedQBtn.dataset.count, 10);
  const allFiles = [
    'datasets/umpires.json',
    'datasets/baystars.json',
    'datasets/buffaloes.json',
    'datasets/carp.json',
    'datasets/dragons.json',
    'datasets/eagles.json',
    'datasets/fighters.json',
    'datasets/giants.json',
    'datasets/lions.json',
    'datasets/hawks.json',
    'datasets/marines.json',
    'datasets/swallows.json',
    'datasets/tigers.json',
  ];
  const files = selectedTeamFiles.length === 0 ? allFiles : selectedTeamFiles.map(f => f.startsWith('datasets_ikusei/') ? f : `datasets/${f}`);
  Promise.all(files.map(f => fetch(f).then(res => res.json())))
    .then(results => {
      const data = results.flat();
      currentDataCount = data.length;
      questions = shuffle(data).slice(0, TOTAL_Q);
      questions = shuffle(data).slice(0, TOTAL_Q);
      currentIdx = 0;
      score = 0;
      times = [];
      log = [];
      document.getElementById('start-screen').style.display = 'none';
      document.getElementById('result-screen').style.display = 'none';
      document.getElementById('game-screen').style.display = 'block';
      document.getElementById('score').textContent = '0';
      document.getElementById('avg-time').textContent = '—';
      showQuestion();
    })
    .catch(() => {
      alert('データの読み込みに失敗しました。');
    });
}

function showQuestion() {
  answered = false;
  document.getElementById('answer-input').disabled = false;
  document.getElementById('submit-btn').disabled = false;
  const u = questions[currentIdx];
  document.getElementById('team-name').textContent = u.team;
  document.getElementById('umpire-name').textContent = u.name;
  document.getElementById('q-count').textContent = `${currentIdx + 1} / ${TOTAL_Q}`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').focus();

  startTime = Date.now();
  let remaining = TIME_LIMIT;
  updateTimerBar(1);

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining = TIME_LIMIT - (Date.now() - startTime) / 1000;
    const ratio = Math.max(0, remaining / TIME_LIMIT);
    updateTimerBar(ratio);
    if (remaining <= 2) document.getElementById('timer-bar').style.background = '#E24B4A';
    else if (remaining <= 4) document.getElementById('timer-bar').style.background = '#EF9F27';
    else document.getElementById('timer-bar').style.background = '#1D9E75';
    if (remaining <= 0) {
      clearInterval(timerInterval);
      handleAnswer(null);
    }
  }, 80);
}

function updateTimerBar(ratio) {
  document.getElementById('timer-bar').style.width = (ratio * 100) + '%';
}

function handleAnswer(userVal) {
  if (answered) return;
  answered = true;
  document.getElementById('answer-input').disabled = true;
  document.getElementById('submit-btn').disabled = true;
  clearInterval(timerInterval);

  const elapsed = (Date.now() - startTime) / 1000;
  const u = questions[currentIdx];
  const correct = userVal !== null && userVal === u.number;
  const timeStr = userVal === null ? '— (タイムアウト)' : elapsed.toFixed(2) + 's';

  if (correct) {
    score++;
    times.push(elapsed);
    document.getElementById('score').textContent = score;
    const fb = document.getElementById('feedback');
    fb.textContent = `正解！ ${elapsed.toFixed(2)}秒`;
    fb.className = 'feedback-correct';
  } else {
    const fb = document.getElementById('feedback');
    if (userVal === null) {
      fb.textContent = `時間切れ！ 正解は ${u.number}`;
    } else {
      fb.textContent = `不正解。正解は ${u.number}`;
    }
    fb.className = 'feedback-wrong';
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    document.getElementById('avg-time').textContent = avg.toFixed(2) + 's';
  }

  log.push({ team: u.team, name: u.name, number: u.number, userVal, elapsed: userVal !== null ? elapsed : null, correct });
  setTimeout(() => {
    currentIdx++;
    if (currentIdx < TOTAL_Q) {
      showQuestion();
    } else {
      showResult();
    }
  }, 900);
}

function showResult() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  document.getElementById('final-score').textContent = `${score}/${TOTAL_Q}`;

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    document.getElementById('final-avg').textContent = avg.toFixed(2) + 's';
    document.getElementById('final-best').textContent = Math.min(...times).toFixed(2) + 's';
  } else {
    document.getElementById('final-avg').textContent = '—';
    document.getElementById('final-best').textContent = '—';
  }

  const reviewBtn = document.getElementById('review-btn');
  reviewBtn.style.display = log.some(row => !row.correct) ? '' : 'none';

  const tbody = document.getElementById('result-body');
  tbody.innerHTML = '';
  for (const row of log) {
    const tr = document.createElement('tr');
    tr.className = row.correct ? 'correct-row' : 'wrong-row';
    const timeCell = row.elapsed !== null ? row.elapsed.toFixed(2) + 's' : '—';
    const answerCell = row.userVal !== null ? row.userVal : '(未回答)';
    const resultCell = row.correct
      ? '<img src="assets/maru.svg" style="width:1.2rem;height:1.2rem;vertical-align:middle;">'
      : '<img src="assets/batsu.svg" style="width:1.2rem;height:1.2rem;vertical-align:middle;">';
    tr.innerHTML = `<td>${row.team}</td><td>${row.name}</td><td>${row.number}</td><td>${answerCell}</td><td>${timeCell}</td><td>${resultCell}</td>`;
    tbody.appendChild(tr);
  }
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);

document.getElementById('review-btn').addEventListener('click', () => {
  const wrongQuestions = log.filter(row => !row.correct).map(row => ({
    team: row.team,
    name: row.name,
    number: row.number,
  }));

  if (wrongQuestions.length === 0) {
    alert('間違いがありません！');
    return;
  }

  questions = shuffle(wrongQuestions);
  TOTAL_Q = questions.length;
  currentIdx = 0;
  score = 0;
  times = [];
  log = [];
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('score').textContent = '0';
  document.getElementById('avg-time').textContent = '—';
  showQuestion();
});

document.getElementById('home-btn').addEventListener('click', () => {
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('start-screen').style.display = 'block';
});

document.getElementById('save-btn').addEventListener('click', () => {
  const target = document.getElementById('result-screen');
  const saveBtn = document.getElementById('save-btn');
  const retryBtn = document.getElementById('retry-btn');
  const reviewBtn = document.getElementById('review-btn');
  const homeBtn = document.getElementById('home-btn');

  // ボタンを一時的に隠す
  saveBtn.style.display = 'none';
  retryBtn.style.display = 'none';
  reviewBtn.style.display = 'none';
  homeBtn.style.display = 'none';

  html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = '結果.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    // ボタンを戻す
    saveBtn.style.display = '';
    retryBtn.style.display = '';
    reviewBtn.style.display = '';
    homeBtn.style.display = '';
  });
});

document.querySelectorAll('.q-count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.q-count-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    TOTAL_Q = parseInt(btn.dataset.count, 10);
  });
});

function updateLeagueBtnState() {
  const centralAll = CENTRAL_FILES.every(f => selectedTeamFiles.includes(f));
  const pacificAll = PACIFIC_FILES.every(f => selectedTeamFiles.includes(f));
  const ikuseiCentralAll = IKUSEI_CENTRAL_FILES.every(f => selectedTeamFiles.includes(f));
  const ikuseiPacificAll = IKUSEI_PACIFIC_FILES.every(f => selectedTeamFiles.includes(f));

  document.querySelector('.league-btn[data-league="central"]').classList.toggle('selected', centralAll);
  document.querySelector('.league-btn[data-league="pacific"]').classList.toggle('selected', pacificAll);
  document.querySelector('.league-btn[data-league="ikusei_central"]').classList.toggle('selected', ikuseiCentralAll);
  document.querySelector('.league-btn[data-league="ikusei_pacific"]').classList.toggle('selected', ikuseiPacificAll);

  const allBtn = document.querySelector('.league-btn[data-league="all"]');
  if (allBtn) {
    const allSelected = ALL_FILES_TEAM.every(f => selectedTeamFiles.includes(f));
    allBtn.classList.toggle('selected', allSelected);
  }
  const ikuseiAllBtn = document.querySelector('.league-btn[data-league="ikusei_all"]');
  if (ikuseiAllBtn) {
    const ikuseiAll = IKUSEI_FILES.every(f => selectedTeamFiles.includes(f));
    ikuseiAllBtn.classList.toggle('selected', ikuseiAll);
  }
}

document.querySelectorAll('.team-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = btn.dataset.file;
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      selectedTeamFiles = selectedTeamFiles.filter(f => f !== file);
    } else {
      btn.classList.add('selected');
      selectedTeamFiles.push(file);
    }
    updateLeagueBtnState();
    updateQCountBtns();
  });
});

document.querySelectorAll('.league-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const league = btn.dataset.league;
    const targets = league === 'all' ? ALL_FILES_TEAM
      : league === 'central' ? CENTRAL_FILES
        : league === 'pacific' ? PACIFIC_FILES
          : league === 'ikusei_all' ? IKUSEI_FILES
            : league === 'ikusei_central' ? IKUSEI_CENTRAL_FILES
              : IKUSEI_PACIFIC_FILES;
    const allOn = targets.every(f => selectedTeamFiles.includes(f));
    if (allOn) {
      // 全部オンなら全部オフ
      selectedTeamFiles = selectedTeamFiles.filter(f => !targets.includes(f));
      targets.forEach(f => {
        const b = document.querySelector(`.team-btn[data-file="${f}"]`);
        if (b) b.classList.remove('selected');
      });
    } else {
      // 一部または全部オフなら全部オン
      targets.forEach(f => {
        if (!selectedTeamFiles.includes(f)) selectedTeamFiles.push(f);
        const b = document.querySelector(`.team-btn[data-file="${f}"]`);
        if (b) b.classList.add('selected');
      });
    }
    updateLeagueBtnState();
    updateQCountBtns();
  });
});

document.getElementById('quit-btn').addEventListener('click', () => {
  if (answered) return;
  clearInterval(timerInterval);
  answered = true;

  const u = questions[currentIdx];
  log.push({ team: u.team, name: u.name, number: u.number, userVal: null, elapsed: null, correct: false });

  for (let i = currentIdx + 1; i < TOTAL_Q; i++) {
    const q = questions[i];
    log.push({ team: q.team, name: q.name, number: q.number, userVal: null, elapsed: null, correct: false });
  }

  showResult();
});

document.getElementById('submit-btn').addEventListener('click', () => {
  const val = parseInt(toHalfWidth(document.getElementById('answer-input').value), 10);
  if (!isNaN(val)) handleAnswer(val);
});

document.getElementById('answer-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = parseInt(toHalfWidth(document.getElementById('answer-input').value), 10);
    if (!isNaN(val)) handleAnswer(val);
  }
});

document.getElementById('answer-input').addEventListener('input', () => {
  if (!autoJudge) return;
  const raw = toHalfWidth(document.getElementById('answer-input').value);
  const val = parseInt(raw, 10);
  if (isNaN(val)) return;
  const u = questions[currentIdx];
  const answerDigits = String(u.number).length;
  const inputDigits = String(val).length;
  if (inputDigits === answerDigits) handleAnswer(val);
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    autoJudge = btn.dataset.mode === 'auto';
  });
});

fetch('news.json')
  .then(res => res.json())
  .then(news => {
    const list = document.getElementById('news-list');
    news.forEach(item => {
      const li = document.createElement('li');
      if (item.name && item.position) {
        li.innerHTML = `
          <span class="news-date">${item.date}</span>
          <span class="news-name">${item.name}　${item.position}</span>
          <span class="news-text">${item.text}</span>
        `;
      } else {
        li.classList.add('news-simple');
        li.innerHTML = `
          <span class="news-date">${item.date}</span>
          <span class="news-text">${item.text}</span>
        `;
      }
      list.appendChild(li);
    });
  })
  .catch(() => { });

document.getElementById('news-btn').addEventListener('click', () => {
  document.getElementById('news-overlay').style.display = 'flex';
});

document.getElementById('news-close-btn').addEventListener('click', () => {
  document.getElementById('news-overlay').style.display = 'none';
});

document.getElementById('news-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('news-overlay')) {
    document.getElementById('news-overlay').style.display = 'none';
  }
});

let enterCount = 0;
let enterTimer = null;

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (document.getElementById('result-screen').style.display === 'none') return;

  enterCount++;
  clearTimeout(enterTimer);

  enterTimer = setTimeout(() => {
    if (enterCount === 1) {
      document.getElementById('retry-btn').click();
    } else if (enterCount >= 2) {
      document.getElementById('review-btn').click();
    }
    enterCount = 0;
  }, 300);
});