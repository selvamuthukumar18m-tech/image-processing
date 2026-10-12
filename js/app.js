/**
 * IVA Assignment Web Platform - Main Application Controller
 * Handles Navigation, Dark/Light Themes, KaTeX Rendering, and Interactive Quiz.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Initializer
  initTheme();

  // 2. Navigation & Tab Switching
  initNavigation();

  // 3. KaTeX Equations Auto-render
  renderFormulas();

  // 4. Initialize Interactive Submodules
  if (window.initTemplateMatching) window.initTemplateMatching();
  if (window.initViolaJones) window.initViolaJones();
  if (window.initDeepFace) window.initDeepFace();
  if (window.initFaceNet) window.initFaceNet();
  if (window.initComparisonCharts) window.initComparisonCharts();

  // 5. Initialize Interactive Quiz
  initQuiz();

  // 6. Print / Export Handler
  initExportHandler();
});

/* -------------------------------------------------------------
   1. Dark / Light Theme Logic
------------------------------------------------------------- */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('iva-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('iva-theme', next);
      updateThemeIcon(next);
      if (window.initComparisonCharts) window.initComparisonCharts();
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.className = 'fas fa-moon text-slate-700';
  } else {
    icon.className = 'fas fa-sun text-amber-400';
  }
}

/* -------------------------------------------------------------
   2. Navigation & Tab Routing
------------------------------------------------------------- */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-tab-btn');
  const sections = document.querySelectorAll('.topic-section');

  function switchTab(targetId) {
    sections.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.remove('hidden');
        sec.classList.add('animate-fade-in');
      } else {
        sec.classList.add('hidden');
      }
    });

    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === targetId) {
        link.classList.add('active', 'text-blue-500', 'font-semibold');
        link.classList.remove('text-slate-400');
      } else {
        link.classList.remove('active', 'text-blue-500', 'font-semibold');
        link.classList.add('text-slate-400');
      }
    });

    // Re-render math or charts if entering respective tab
    if (targetId === 'comparative-analysis' && window.initComparisonCharts) {
      setTimeout(() => window.initComparisonCharts(), 50);
    }
    renderFormulas();
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      switchTab(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    // Close on mobile link click
    mobileMenu.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

/* -------------------------------------------------------------
   3. KaTeX Equations Renderer
------------------------------------------------------------- */
function renderFormulas() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  } else {
    // Retry in 200ms if KaTeX CDN script is still downloading
    setTimeout(renderFormulas, 200);
  }
}

/* -------------------------------------------------------------
   4. Interactive Assessment / Quiz
------------------------------------------------------------- */
function initQuiz() {
  const quizForm = document.getElementById('iva-quiz-form');
  const resetBtn = document.getElementById('quiz-reset-btn');
  const resultCard = document.getElementById('quiz-result-card');

  if (!quizForm) return;

  const correctAnswers = {
    q1: 'c', // O(1)
    q2: 'b', // Fixed 3D alignment removes translational invariance necessity
    q3: 'b', // d(a,p)^2 < d(a,n)^2 < d(a,p)^2 + alpha
    q4: 'c', // Scale and rotation distortions
    q5: 'a'  // Rapidly reject over 95% of non-faces early
  };

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(quizForm);
    let score = 0;
    const total = Object.keys(correctAnswers).length;

    for (const [qKey, correctVal] of Object.entries(correctAnswers)) {
      const userVal = formData.get(qKey);
      const explanationEl = document.getElementById(`${qKey}-exp`);

      if (userVal === correctVal) {
        score++;
        if (explanationEl) {
          explanationEl.classList.remove('hidden', 'text-rose-400');
          explanationEl.classList.add('text-emerald-400');
          explanationEl.innerHTML = `<i class="fas fa-check-circle mr-1"></i> Correct!`;
        }
      } else {
        if (explanationEl) {
          explanationEl.classList.remove('hidden', 'text-emerald-400');
          explanationEl.classList.add('text-rose-400');
          explanationEl.innerHTML = `<i class="fas fa-times-circle mr-1"></i> Incorrect. Option (${correctVal.toUpperCase()}) is the correct answer.`;
        }
      }
    }

    if (resultCard) {
      resultCard.classList.remove('hidden');
      const scoreEl = document.getElementById('quiz-score-val');
      const percentEl = document.getElementById('quiz-percent-val');
      const badgeEl = document.getElementById('quiz-feedback-badge');

      const pct = (score / total) * 100;
      if (scoreEl) scoreEl.textContent = `${score} / ${total}`;
      if (percentEl) percentEl.textContent = `${pct.toFixed(0)}%`;

      if (badgeEl) {
        if (pct >= 80) {
          badgeEl.className = 'px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 font-semibold';
          badgeEl.textContent = 'Distinction: Mastery of IVA Principles';
        } else if (pct >= 60) {
          badgeEl.className = 'px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500 font-semibold';
          badgeEl.textContent = 'Competent: Good grasp of facial recognition pipelines';
        } else {
          badgeEl.className = 'px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500 font-semibold';
          badgeEl.textContent = 'Review Needed: Revisit Viola-Jones & FaceNet notes';
        }
      }

      resultCard.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      quizForm.reset();
      document.querySelectorAll('.quiz-exp').forEach(el => el.classList.add('hidden'));
      if (resultCard) resultCard.classList.add('hidden');
    });
  }
}

/* -------------------------------------------------------------
   5. Assignment Submission Print Handler
------------------------------------------------------------- */
function initExportHandler() {
  const printBtn = document.getElementById('export-assignment-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Temporarily reveal all sections for clean printout
      const hiddenSections = document.querySelectorAll('.topic-section.hidden');
      hiddenSections.forEach(s => s.classList.remove('hidden'));
      window.print();
      // Restore view
      const activeBtn = document.querySelector('.nav-tab-btn.active');
      if (activeBtn) {
        const activeTarget = activeBtn.getAttribute('data-target');
        document.querySelectorAll('.topic-section').forEach(s => {
          if (s.id !== activeTarget) s.classList.add('hidden');
        });
      }
    });
  }
}
