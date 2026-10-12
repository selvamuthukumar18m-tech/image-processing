/**
 * Viola-Jones Algorithm Interactive Simulator
 * Image and Video Analytics (IVA) Assignment Module
 * 
 * Includes:
 * 1. Interactive Integral Image O(1) Rectangle Sum Calculator
 * 2. Haar-like Feature Morphology Visualizer
 * 3. Multi-Stage Attentional Cascade Funnel
 */

(function () {
  const GRID_SIZE = 6;
  let rawPixels = [];
  let integralImg = [];

  // Current selected rectangle coordinates in the grid: (r1, c1) to (r2, c2)
  let selR1 = 2, selC1 = 2, selR2 = 4, selC2 = 4;

  let haarCanvas, haarCtx;
  let currentHaarType = 'edge-h';

  function init() {
    initIntegralGrid();
    initHaarVisualizer();
    initCascadeFunnel();
  }

  /* -------------------------------------------------------------
     1. Integral Image Calculator
  ------------------------------------------------------------- */
  function initIntegralGrid() {
    // Generate deterministic clean numbers for clear classroom demo
    rawPixels = [
      [3, 5, 2, 8, 4, 1],
      [4, 1, 6, 3, 2, 5],
      [7, 3, 9, 4, 8, 2],
      [2, 8, 5, 1, 6, 7],
      [6, 4, 2, 7, 3, 4],
      [1, 9, 3, 5, 2, 8]
    ];

    computeIntegralImage();
    renderGrids();
    updateIntegralCalculation();

    // Attach randomize button
    const btnRand = document.getElementById('vj-btn-randomize');
    if (btnRand) {
      btnRand.addEventListener('click', () => {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            rawPixels[r][c] = Math.floor(Math.random() * 9) + 1;
          }
        }
        computeIntegralImage();
        renderGrids();
        updateIntegralCalculation();
      });
    }

    // Attach coordinate controls
    ['r1', 'c1', 'r2', 'c2'].forEach(id => {
      const el = document.getElementById(`vj-sel-${id}`);
      if (el) {
        el.addEventListener('change', handleRectCoordChange);
      }
    });
  }

  function computeIntegralImage() {
    integralImg = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = rawPixels[r][c];
        const left = c > 0 ? integralImg[r][c - 1] : 0;
        const up = r > 0 ? integralImg[r - 1][c] : 0;
        const diag = (r > 0 && c > 0) ? integralImg[r - 1][c - 1] : 0;
        integralImg[r][c] = val + left + up - diag;
      }
    }
  }

  function handleRectCoordChange() {
    const r1 = parseInt(document.getElementById('vj-sel-r1')?.value || '2', 10);
    const c1 = parseInt(document.getElementById('vj-sel-c1')?.value || '2', 10);
    const r2 = parseInt(document.getElementById('vj-sel-r2')?.value || '4', 10);
    const c2 = parseInt(document.getElementById('vj-sel-c2')?.value || '4', 10);

    selR1 = Math.min(r1, r2);
    selR2 = Math.max(r1, r2);
    selC1 = Math.min(c1, c2);
    selC2 = Math.max(c1, c2);

    renderGrids();
    updateIntegralCalculation();
  }

  function renderGrids() {
    const rawContainer = document.getElementById('vj-raw-grid');
    const iiContainer = document.getElementById('vj-ii-grid');

    if (!rawContainer || !iiContainer) return;

    rawContainer.innerHTML = '';
    iiContainer.innerHTML = '';

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // Raw pixel cell
        const rawCell = document.createElement('div');
        const isInside = r >= selR1 && r <= selR2 && c >= selC1 && c <= selC2;
        rawCell.className = `w-8 h-8 flex items-center justify-center rounded border text-xs font-mono transition-colors ${
          isInside ? 'bg-blue-600/30 border-blue-400 font-bold text-blue-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`;
        rawCell.textContent = rawPixels[r][c];
        rawContainer.appendChild(rawCell);

        // Integral image cell
        const iiCell = document.createElement('div');
        let cornerClass = '';

        // Label corner lookups D (r2, c2), B (r1-1, c2), C (r2, c1-1), A (r1-1, c1-1)
        if (r === selR2 && c === selC2) {
          cornerClass = 'corner-d text-purple-200 ring-2 ring-purple-500 font-bold'; // D
        } else if (r === selR1 - 1 && c === selC2) {
          cornerClass = 'corner-b text-amber-200 ring-2 ring-amber-500 font-bold'; // B
        } else if (r === selR2 && c === selC1 - 1) {
          cornerClass = 'corner-c text-emerald-200 ring-2 ring-emerald-500 font-bold'; // C
        } else if (r === selR1 - 1 && c === selC1 - 1) {
          cornerClass = 'corner-a text-rose-200 ring-2 ring-rose-500 font-bold'; // A
        } else if (isInside) {
          cornerClass = 'bg-blue-900/20 text-slate-300';
        } else {
          cornerClass = 'bg-slate-800/80 text-slate-400';
        }

        iiCell.className = `w-8 h-8 flex items-center justify-center rounded border border-slate-700 text-xs font-mono transition-all ${cornerClass}`;
        iiCell.textContent = integralImg[r][c];
        iiContainer.appendChild(iiCell);
      }
    }
  }

  function updateIntegralCalculation() {
    // Corner lookup values:
    const valD = integralImg[selR2][selC2];
    const valB = selR1 > 0 ? integralImg[selR1 - 1][selC2] : 0;
    const valC = selC1 > 0 ? integralImg[selR2][selC1 - 1] : 0;
    const valA = (selR1 > 0 && selC1 > 0) ? integralImg[selR1 - 1][selC1 - 1] : 0;

    const fastSum = valD - valB - valC + valA;

    // Brute force sum verification:
    let bruteSum = 0;
    for (let r = selR1; r <= selR2; r++) {
      for (let c = selC1; c <= selC2; c++) {
        bruteSum += rawPixels[r][c];
      }
    }

    const dEl = document.getElementById('vj-calc-d');
    const bEl = document.getElementById('vj-calc-b');
    const cEl = document.getElementById('vj-calc-c');
    const aEl = document.getElementById('vj-calc-a');
    const resEl = document.getElementById('vj-calc-res');
    const bruteEl = document.getElementById('vj-calc-brute');

    if (dEl) dEl.textContent = valD;
    if (bEl) bEl.textContent = valB;
    if (cEl) cEl.textContent = valC;
    if (aEl) aEl.textContent = valA;
    if (resEl) resEl.textContent = fastSum;
    if (bruteEl) bruteEl.textContent = bruteSum;
  }

  /* -------------------------------------------------------------
     2. Haar-like Feature Morphology Visualizer
  ------------------------------------------------------------- */
  let customVJFaceImg = null;

  function initHaarVisualizer() {
    haarCanvas = document.getElementById('vj-haar-canvas');
    if (!haarCanvas) return;

    haarCtx = haarCanvas.getContext('2d');
    haarCanvas.width = 240;
    haarCanvas.height = 260;

    const select = document.getElementById('vj-haar-type');
    if (select) {
      select.addEventListener('change', (e) => {
        currentHaarType = e.target.value;
        drawHaarOverlay();
      });
    }

    const uploadInput = document.getElementById('vj-upload-face');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customVJFaceImg = img;
            const badge = document.getElementById('vj-custom-badge');
            if (badge) badge.classList.remove('hidden');
            drawHaarOverlay();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const resetBtn = document.getElementById('vj-btn-reset-face');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        customVJFaceImg = null;
        if (uploadInput) uploadInput.value = '';
        const badge = document.getElementById('vj-custom-badge');
        if (badge) badge.classList.add('hidden');
        drawHaarOverlay();
      });
    }

    drawHaarOverlay();
  }

  function drawSyntheticFace(ctx) {
    // Face oval
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(120, 130, 75, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Forehead highlight
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(120, 80, 50, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Darker regions)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(90, 115, 18, 9, 0, 0, Math.PI * 2); // Left eye
    ctx.ellipse(150, 115, 18, 9, 0, 0, Math.PI * 2); // Right eye
    ctx.fill();

    // Eyebrows
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.rect(75, 96, 30, 6);
    ctx.rect(135, 96, 30, 6);
    ctx.fill();

    // Nose bridge (Brighter vertical strip)
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.rect(114, 115, 12, 45);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(120, 185, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHaarOverlay() {
    haarCtx.clearRect(0, 0, haarCanvas.width, haarCanvas.height);
    if (customVJFaceImg) {
      haarCtx.drawImage(customVJFaceImg, 0, 0, haarCanvas.width, haarCanvas.height);
    } else {
      drawSyntheticFace(haarCtx);
    }

    const descEl = document.getElementById('vj-haar-desc');

    if (currentHaarType === 'eye-forehead') {
      // Horizontal Two-Rectangle across eyes & upper cheeks
      // Eyes are darker, cheeks are brighter
      const x = 70, y = 105, w = 100, h = 30;
      haarCtx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Dark rectangle
      haarCtx.fillRect(x, y, w, h / 2);
      haarCtx.fillStyle = 'rgba(255, 255, 255, 0.75)'; // White rectangle
      haarCtx.fillRect(x, y + h / 2, w, h / 2);

      haarCtx.strokeStyle = '#ef4444';
      haarCtx.lineWidth = 2;
      haarCtx.strokeRect(x, y, w, h);

      if (descEl) {
        descEl.innerHTML = `<strong>Edge Feature (Eyes vs Cheeks):</strong> Leverages the biological property that the ocular band is naturally darker than the contiguous upper zygomatic cheek area. Calculated as: <br><span class="text-blue-400 font-mono">Δ = Sum(White Rect) - Sum(Black Rect)</span>`;
      }
    } else if (currentHaarType === 'nose-bridge') {
      // Three-Rectangle Line Feature across eyes and nose bridge
      const x = 85, y = 110, w = 70, h = 25;
      const third = w / 3;

      // Dark (Left eye)
      haarCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      haarCtx.fillRect(x, y, third, h);
      // Bright (Nose bridge)
      haarCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      haarCtx.fillRect(x + third, y, third, h);
      // Dark (Right eye)
      haarCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      haarCtx.fillRect(x + 2 * third, y, third, h);

      haarCtx.strokeStyle = '#10b981';
      haarCtx.lineWidth = 2;
      haarCtx.strokeRect(x, y, w, h);

      if (descEl) {
        descEl.innerHTML = `<strong>Line Feature (Nose Bridge vs Eyes):</strong> The vertical nasal bridge is substantially brighter than the bilateral eye sockets. Three-rectangle feature computes: <br><span class="text-emerald-400 font-mono">Δ = Sum(Center White) - [Sum(Left Black) + Sum(Right Black)]</span>`;
      }
    } else if (currentHaarType === 'mouth-chin') {
      // Horizontal Two-Rectangle across mouth & chin
      const x = 95, y = 175, w = 50, h = 26;
      haarCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      haarCtx.fillRect(x, y, w, h / 2);
      haarCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      haarCtx.fillRect(x, y + h / 2, w, h / 2);

      haarCtx.strokeStyle = '#f59e0b';
      haarCtx.lineWidth = 2;
      haarCtx.strokeRect(x, y, w, h);

      if (descEl) {
        descEl.innerHTML = `<strong>Mouth-Chin Contrast Feature:</strong> Detects lip fissure transition against the mental protuberance (chin highlight).`;
      }
    } else {
      // Four-Rectangle Diagonal Feature
      const x = 95, y = 100, s = 25;
      haarCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      haarCtx.fillRect(x, y, s, s);
      haarCtx.fillRect(x + s, y + s, s, s);
      haarCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      haarCtx.fillRect(x + s, y, s, s);
      haarCtx.fillRect(x, y + s, s, s);

      haarCtx.strokeStyle = '#8b5cf6';
      haarCtx.lineWidth = 2;
      haarCtx.strokeRect(x, y, s * 2, s * 2);

      if (descEl) {
        descEl.innerHTML = `<strong>Four-Rectangle Diagonal Feature:</strong> Computes diagonal differential across 4 equal sub-quadrants: <br><span class="text-purple-400 font-mono">Δ = (W1 + W2) - (B1 + B2)</span>`;
      }
    }
  }

  /* -------------------------------------------------------------
     3. Attentional Cascade Funnel
  ------------------------------------------------------------- */
  function initCascadeFunnel() {
    const stages = [
      { stage: 1, features: 2, passRate: 50.0, falsePositiveAcc: '5.0e-1' },
      { stage: 2, features: 10, passRate: 20.0, falsePositiveAcc: '1.0e-1' },
      { stage: 3, features: 25, passRate: 5.0, falsePositiveAcc: '1.2e-2' },
      { stage: 10, features: 50, passRate: 0.1, falsePositiveAcc: '1.0e-4' },
      { stage: 20, features: 100, passRate: 0.001, falsePositiveAcc: '1.0e-6' },
      { stage: 38, features: 200, passRate: 0.0001, falsePositiveAcc: '1.0e-7' }
    ];

    const slider = document.getElementById('vj-cascade-slider');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value, 10);
      const data = stages[idx];

      const stageEl = document.getElementById('vj-casc-stage');
      const featEl = document.getElementById('vj-casc-feat');
      const passEl = document.getElementById('vj-casc-pass');
      const fpEl = document.getElementById('vj-casc-fp');
      const barEl = document.getElementById('vj-casc-bar');

      if (stageEl) stageEl.textContent = `Stage ${data.stage} of 38`;
      if (featEl) featEl.textContent = `${data.features} features`;
      if (passEl) passEl.textContent = `${data.passRate}%`;
      if (fpEl) fpEl.textContent = data.falsePositiveAcc;
      if (barEl) {
        barEl.style.width = `${Math.max(2, data.passRate)}%`;
      }
    });
  }

  window.initViolaJones = init;
})();
