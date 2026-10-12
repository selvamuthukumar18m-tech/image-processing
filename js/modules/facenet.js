/**
 * FaceNet (Schroff, Kalenichenko & Philbin, 2015) Interactive Module
 * Image and Video Analytics (IVA) Assignment Module
 * 
 * Features:
 * 1. Interactive Triplet Loss 2D Embedding Space Playground
 * 2. Easy, Semi-Hard, and Hard Negative Mining Simulator
 * 3. 128-D Euclidean Distance Face Verification Demo
 */

(function () {
  let canvas, ctx;
  let isDragging = false;
  let draggedPoint = null;

  // Embedding points in canvas coordinates (normalized around center 160, 150)
  const points = {
    anchor: { x: 140, y: 150, label: "Anchor (A)", color: "#3b82f6", r: 10 },
    positive: { x: 175, y: 130, label: "Positive (P)", color: "#10b981", r: 10 },
    negative: { x: 230, y: 170, label: "Negative (N)", color: "#ef4444", r: 10 }
  };

  let alpha = 0.2; // Triplet margin in normalized space

  function init() {
    canvas = document.getElementById('fn-triplet-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    canvas.width = 340;
    canvas.height = 300;

    setupEvents();
    renderTripletCanvas();
    initVerificationDemo();
  }

  function setupEvents() {
    const marginSlider = document.getElementById('fn-margin-slider');
    if (marginSlider) {
      marginSlider.addEventListener('input', (e) => {
        alpha = parseFloat(e.target.value);
        const valEl = document.getElementById('fn-margin-val');
        if (valEl) valEl.textContent = alpha.toFixed(2);
        renderTripletCanvas();
      });
    }

    // Preset configurations
    const btnEasy = document.getElementById('fn-preset-easy');
    const btnSemi = document.getElementById('fn-preset-semi');
    const btnHard = document.getElementById('fn-preset-hard');

    if (btnEasy) {
      btnEasy.addEventListener('click', () => {
        points.anchor.x = 130; points.anchor.y = 150;
        points.positive.x = 160; points.positive.y = 140;
        points.negative.x = 265; points.negative.y = 165;
        renderTripletCanvas();
      });
    }
    if (btnSemi) {
      btnSemi.addEventListener('click', () => {
        points.anchor.x = 130; points.anchor.y = 150;
        points.positive.x = 175; points.positive.y = 140;
        points.negative.x = 210; points.negative.y = 175;
        renderTripletCanvas();
      });
    }
    if (btnHard) {
      btnHard.addEventListener('click', () => {
        points.anchor.x = 130; points.anchor.y = 150;
        points.positive.x = 210; points.positive.y = 140;
        points.negative.x = 165; points.negative.y = 155;
        renderTripletCanvas();
      });
    }

    // Drag and drop interaction
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch support for mobile devices
    canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });

    window.addEventListener('touchend', () => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  }

  function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  function handleMouseDown(e) {
    const pos = getMousePos(e);
    for (const key in points) {
      const p = points[key];
      const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (dist <= p.r + 5) {
        isDragging = true;
        draggedPoint = p;
        break;
      }
    }
  }

  function handleMouseMove(e) {
    if (!isDragging || !draggedPoint) return;
    const pos = getMousePos(e);
    // Constrain within canvas boundaries
    draggedPoint.x = Math.max(20, Math.min(canvas.width - 20, pos.x));
    draggedPoint.y = Math.max(20, Math.min(canvas.height - 20, pos.y));
    renderTripletCanvas();
  }

  function handleMouseUp() {
    isDragging = false;
    draggedPoint = null;
  }

  function renderTripletCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid backdrop
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const ax = points.anchor.x, ay = points.anchor.y;
    const px = points.positive.x, py = points.positive.y;
    const nx = points.negative.x, ny = points.negative.y;

    // Distances in pixel space (scaled for display metric)
    const scaleFactor = 0.01;
    const dAP_pixels = Math.hypot(ax - px, ay - py);
    const dAN_pixels = Math.hypot(ax - nx, ay - ny);

    const dAP_sq = Math.pow(dAP_pixels * scaleFactor, 2);
    const dAN_sq = Math.pow(dAN_pixels * scaleFactor, 2);

    // Loss = max(0, ||xa - xp||^2 - ||xa - xn||^2 + alpha)
    const loss = Math.max(0, dAP_sq - dAN_sq + alpha);

    // Draw positive distance sphere (radius dAP)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.beginPath();
    ctx.arc(ax, ay, dAP_pixels, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();

    // Draw Margin boundary sphere: radius where ||xa - x||^2 = ||xa - xp||^2 + alpha
    const marginRadius_pixels = Math.sqrt(dAP_sq + alpha) / scaleFactor;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    ctx.beginPath();
    ctx.arc(ax, ay, marginRadius_pixels, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Margin label
    ctx.font = '10px Inter, monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Margin (+α)`, ax + 6, ay - marginRadius_pixels + 12);

    // Connection vectors
    // A to P
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(px, py);
    ctx.stroke();

    // A to N
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // Draw points
    for (const key in points) {
      const p = points[key];
      // Glow
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.label, p.x + 12, p.y + 4);
    }

    // Determine Triplet regime
    let regime = "";
    let regimeClass = "";
    if (dAN_sq >= dAP_sq + alpha) {
      regime = "EASY TRIPLET (Loss = 0.00)";
      regimeClass = "text-emerald-400";
    } else if (dAP_sq < dAN_sq && dAN_sq < dAP_sq + alpha) {
      regime = "SEMI-HARD TRIPLET (Mining Target)";
      regimeClass = "text-amber-400 font-bold";
    } else {
      regime = "HARD TRIPLET (Negative Closer Than Positive!)";
      regimeClass = "text-rose-400 font-bold";
    }

    // Update UI Metric readouts
    const apEl = document.getElementById('fn-dist-ap');
    const anEl = document.getElementById('fn-dist-an');
    const lossEl = document.getElementById('fn-loss-val');
    const regimeEl = document.getElementById('fn-regime-badge');

    if (apEl) apEl.textContent = dAP_sq.toFixed(3);
    if (anEl) anEl.textContent = dAN_sq.toFixed(3);
    if (lossEl) {
      lossEl.textContent = loss.toFixed(4);
      lossEl.className = loss === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
    }
    if (regimeEl) {
      regimeEl.textContent = regime;
      regimeEl.className = `px-3 py-1 text-xs rounded-full border border-slate-700 bg-slate-800 ${regimeClass}`;
    }
  }

  /* -------------------------------------------------------------
     2. 128-D Face Verification Classifier Demo
  ------------------------------------------------------------- */
  let customFace1Img = null;
  let customFace2Img = null;

  // Extracts a normalized 128-D feature embedding on the unit sphere
  function computeImageEmbedding(img) {
    const embCanvas = document.createElement('canvas');
    embCanvas.width = 16;
    embCanvas.height = 8; // 16 * 8 = 128 dimensions
    const eCtx = embCanvas.getContext('2d');
    eCtx.drawImage(img, 0, 0, 16, 8);
    const imgData = eCtx.getImageData(0, 0, 16, 8).data;

    const vec = new Float32Array(128);
    let sumSq = 0;
    for (let i = 0; i < 128; i++) {
      const idx = i * 4;
      // Perceptual luminance
      const lum = (0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2]) / 255.0;
      vec[i] = lum;
      sumSq += lum * lum;
    }

    // L2 unit normalization onto unit hypersphere S^127
    const norm = Math.sqrt(sumSq) || 1e-5;
    for (let i = 0; i < 128; i++) {
      vec[i] = vec[i] / norm;
    }
    return vec;
  }

  function initVerificationDemo() {
    const pairSelect = document.getElementById('fn-pair-select');
    const threshSlider = document.getElementById('fn-thresh-slider');

    if (!pairSelect || !threshSlider) return;

    // Listeners for custom face uploads
    const upload1 = document.getElementById('fn-upload-1');
    const upload2 = document.getElementById('fn-upload-2');

    if (upload1) {
      upload1.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customFace1Img = img;
            const thumb = document.getElementById('fn-thumb-1');
            if (thumb) {
              thumb.src = evt.target.result;
              thumb.classList.remove('hidden');
            }
            if (pairSelect) pairSelect.value = 'custom';
            runVerify();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (upload2) {
      upload2.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customFace2Img = img;
            const thumb = document.getElementById('fn-thumb-2');
            if (thumb) {
              thumb.src = evt.target.result;
              thumb.classList.remove('hidden');
            }
            if (pairSelect) pairSelect.value = 'custom';
            runVerify();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const runVerify = () => {
      const selected = pairSelect.value;
      const tau = parseFloat(threshSlider.value);
      document.getElementById('fn-thresh-val').textContent = tau.toFixed(2);

      let dist = 0.65;
      let img1Desc = "Subject A (Photo 1)", img2Desc = "Subject A (Photo 2)";

      if (selected === 'custom' && customFace1Img && customFace2Img) {
        // Calculate true 128-D Euclidean distance
        const v1 = computeImageEmbedding(customFace1Img);
        const v2 = computeImageEmbedding(customFace2Img);
        let distSq = 0;
        for (let i = 0; i < 128; i++) {
          const diff = v1[i] - v2[i];
          distSq += diff * diff;
        }
        // Scaled to FaceNet metric range [0, 2]
        dist = Math.sqrt(distSq) * 1.414;
        img1Desc = "Uploaded Photo 1";
        img2Desc = "Uploaded Photo 2";
      } else if (selected === 'same-1') {
        dist = 0.68;
        img1Desc = "Person 1 (Studio Lighting)";
        img2Desc = "Person 1 (Outdoor Sunlight)";
      } else if (selected === 'same-2') {
        dist = 1.05;
        img1Desc = "Person 2 (Neutral Expression)";
        img2Desc = "Person 2 (Smiling + Eyeglasses)";
      } else if (selected === 'diff-1') {
        dist = 1.48;
        img1Desc = "Person A (Male, 28y)";
        img2Desc = "Person B (Male, 30y)";
      } else if (selected === 'diff-2') {
        dist = 1.32;
        img1Desc = "Person C (Female, Brown Hair)";
        img2Desc = "Person D (Female, Brown Hair)";
      }

      const isMatch = dist < tau;
      const distEl = document.getElementById('fn-verif-dist');
      const resultEl = document.getElementById('fn-verif-result');
      const desc1 = document.getElementById('fn-face1-desc');
      const desc2 = document.getElementById('fn-face2-desc');

      if (distEl) distEl.textContent = dist.toFixed(2);
      if (desc1) desc1.textContent = img1Desc;
      if (desc2) desc2.textContent = img2Desc;

      if (resultEl) {
        if (isMatch) {
          resultEl.innerHTML = `<span class="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold">MATCH (Same Person)</span>`;
        } else {
          resultEl.innerHTML = `<span class="px-3 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/50 font-bold">DIFFERENT IDENTITIES</span>`;
        }
      }
    };

    pairSelect.addEventListener('change', runVerify);
    threshSlider.addEventListener('input', runVerify);
    runVerify();
  }

  window.initFaceNet = init;
})();
