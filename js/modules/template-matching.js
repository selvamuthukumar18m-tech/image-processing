/**
 * Template Matching Interactive Simulator
 * Image and Video Analytics (IVA) Assignment Module
 */

(function () {
  let mainCanvas, mainCtx, heatmapCanvas, heatmapCtx;
  let isScanning = false;
  let scanAnimationId = null;
  let currentMethod = 'ccoeff_normed';

  // Synthetic image generation parameters
  const IMG_W = 260;
  const IMG_H = 180;
  const TPL_W = 40;
  const TPL_H = 40;

  let sceneData = null;
  let templateData = null;
  let targetX = 140;
  let targetY = 70;

  let customSearchImg = null;
  let customTemplateImg = null;

  function init() {
    mainCanvas = document.getElementById('tm-search-canvas');
    heatmapCanvas = document.getElementById('tm-heatmap-canvas');

    if (!mainCanvas || !heatmapCanvas) return;

    mainCtx = mainCanvas.getContext('2d');
    heatmapCtx = heatmapCanvas.getContext('2d');

    mainCanvas.width = IMG_W;
    mainCanvas.height = IMG_H;
    heatmapCanvas.width = IMG_W - TPL_W + 1;
    heatmapCanvas.height = IMG_H - TPL_H + 1;

    setupEventListeners();
    updateFormulaDisplay();
    generateScene();
    runMatching();
  }

  function setupEventListeners() {
    // Custom Image Upload Listeners
    const uploadSearchInput = document.getElementById('tm-upload-search');
    if (uploadSearchInput) {
      uploadSearchInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customSearchImg = img;
            const badge = document.getElementById('tm-custom-badge');
            if (badge) badge.classList.remove('hidden');
            generateScene();
            runMatching();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const uploadTemplateInput = document.getElementById('tm-upload-template');
    if (uploadTemplateInput) {
      uploadTemplateInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customTemplateImg = img;
            generateScene();
            runMatching();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const btnResetPresets = document.getElementById('tm-btn-reset-preset');
    if (btnResetPresets) {
      btnResetPresets.addEventListener('click', () => {
        customSearchImg = null;
        customTemplateImg = null;
        if (uploadSearchInput) uploadSearchInput.value = '';
        if (uploadTemplateInput) uploadTemplateInput.value = '';
        const badge = document.getElementById('tm-custom-badge');
        if (badge) badge.classList.add('hidden');
        generateScene();
        runMatching();
      });
    }

    // Click on search canvas to crop template from clicked position!
    if (mainCanvas) {
      mainCanvas.addEventListener('click', (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = mainCanvas.width / rect.width;
        const scaleY = mainCanvas.height / rect.height;
        const clickX = Math.floor((e.clientX - rect.left) * scaleX);
        const clickY = Math.floor((e.clientY - rect.top) * scaleY);

        const cropX = Math.max(0, Math.min(IMG_W - TPL_W, clickX - TPL_W / 2));
        const cropY = Math.max(0, Math.min(IMG_H - TPL_H, clickY - TPL_H / 2));

        // Create cropped template from search canvas
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = TPL_W;
        cropCanvas.height = TPL_H;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(mainCanvas, cropX, cropY, TPL_W, TPL_H, 0, 0, TPL_W, TPL_H);

        const croppedImg = new Image();
        croppedImg.onload = () => {
          customTemplateImg = croppedImg;
          generateScene();
          runMatching();
        };
        croppedImg.src = cropCanvas.toDataURL();
      });
    }

    const methodSelect = document.getElementById('tm-method-select');
    if (methodSelect) {
      methodSelect.addEventListener('change', (e) => {
        currentMethod = e.target.value;
        updateFormulaDisplay();
        runMatching();
      });
    }

    const sceneSelect = document.getElementById('tm-scene-select');
    if (sceneSelect) {
      sceneSelect.addEventListener('change', () => {
        customSearchImg = null;
        customTemplateImg = null;
        const badge = document.getElementById('tm-custom-badge');
        if (badge) badge.classList.add('hidden');
        generateScene();
        runMatching();
      });
    }

    const noiseSlider = document.getElementById('tm-noise-slider');
    const scaleSlider = document.getElementById('tm-scale-slider');
    const rotSlider = document.getElementById('tm-rot-slider');

    if (noiseSlider) {
      noiseSlider.addEventListener('input', (e) => {
        document.getElementById('tm-noise-val').textContent = e.target.value + '%';
        generateScene();
        runMatching();
      });
    }
    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        document.getElementById('tm-scale-val').textContent = e.target.value + 'x';
        generateScene();
        runMatching();
      });
    }
    if (rotSlider) {
      rotSlider.addEventListener('input', (e) => {
        document.getElementById('tm-rot-val').textContent = e.target.value + '°';
        generateScene();
        runMatching();
      });
    }

    const btnAnimate = document.getElementById('tm-btn-animate');
    if (btnAnimate) {
      btnAnimate.addEventListener('click', toggleScanAnimation);
    }
  }

  function updateFormulaDisplay() {
    const el = document.getElementById('tm-active-formula');
    if (!el) return;
    let mathStr = '';
    if (currentMethod === 'sqdiff_normed') {
      mathStr = 'R(x,y) = \\frac{\\sum_{x\',y\'} (T(x\',y\') - I(x+x\', y+y\'))^2}{\\sqrt{\\sum (T)^2 \\cdot \\sum (I)^2}} \\quad (\\text{Min = Best})';
    } else if (currentMethod === 'ccorr_normed') {
      mathStr = 'R(x,y) = \\frac{\\sum_{x\',y\'} T(x\',y\') \\cdot I(x+x\', y+y\')}{\\sqrt{\\sum (T)^2 \\cdot \\sum (I)^2}} \\quad (\\text{Max = Best})';
    } else {
      mathStr = 'R(x,y) = \\frac{\\sum (T\' \\cdot I\')}{\\sqrt{\\sum (T\')^2 \\cdot \\sum (I\')^2}} \\quad (\\text{Normalized Correlation Coefficient})';
    }
    if (window.katex) {
      katex.render(mathStr, el, { throwOnError: false });
    } else {
      el.textContent = mathStr;
      setTimeout(updateFormulaDisplay, 250);
    }
  }

  function generateScene() {
    const sceneType = document.getElementById('tm-scene-select')?.value || 'face';
    const noise = parseInt(document.getElementById('tm-noise-slider')?.value || '0', 10);
    const scale = parseFloat(document.getElementById('tm-scale-slider')?.value || '1.0');
    const rot = (parseFloat(document.getElementById('tm-rot-slider')?.value || '0') * Math.PI) / 180;

    // 1. Draw base template (40x40)
    const tCanvas = document.createElement('canvas');
    tCanvas.width = TPL_W;
    tCanvas.height = TPL_H;
    const tCtx = tCanvas.getContext('2d');
    tCtx.fillStyle = '#1e293b';
    tCtx.fillRect(0, 0, TPL_W, TPL_H);

    if (customTemplateImg) {
      tCtx.drawImage(customTemplateImg, 0, 0, TPL_W, TPL_H);
    } else if (customSearchImg) {
      // Auto-crop center 40x40 if only search image uploaded
      tCtx.drawImage(customSearchImg, 
        Math.max(0, (customSearchImg.width / 2) - 20), 
        Math.max(0, (customSearchImg.height / 2) - 20), 
        40, 40, 0, 0, TPL_W, TPL_H);
    } else if (sceneType === 'face') {
      // Draw an eye / ocular template
      tCtx.fillStyle = '#f8fafc';
      tCtx.beginPath();
      tCtx.ellipse(20, 20, 14, 8, 0, 0, Math.PI * 2);
      tCtx.fill();
      // Iris
      tCtx.fillStyle = '#3b82f6';
      tCtx.beginPath();
      tCtx.arc(20, 20, 6, 0, Math.PI * 2);
      tCtx.fill();
      // Pupil
      tCtx.fillStyle = '#0f172a';
      tCtx.beginPath();
      tCtx.arc(20, 20, 3, 0, Math.PI * 2);
      tCtx.fill();
      // Eyebrow
      tCtx.strokeStyle = '#64748b';
      tCtx.lineWidth = 3;
      tCtx.beginPath();
      tCtx.arc(20, 16, 12, Math.PI * 1.1, Math.PI * 1.9);
      tCtx.stroke();
    } else {
      // Draw geometric glyph / icon
      tCtx.fillStyle = '#e2e8f0';
      tCtx.beginPath();
      tCtx.arc(20, 20, 14, 0, Math.PI * 2);
      tCtx.fill();
      tCtx.fillStyle = '#ef4444';
      tCtx.fillRect(14, 14, 12, 12);
    }

    templateData = tCtx.getImageData(0, 0, TPL_W, TPL_H);

    // Draw template preview
    const tplPreview = document.getElementById('tm-template-preview');
    if (tplPreview) {
      tplPreview.width = TPL_W;
      tplPreview.height = TPL_H;
      const tpCtx = tplPreview.getContext('2d');
      tpCtx.putImageData(templateData, 0, 0);
    }

    // 2. Draw scene image (260x180)
    mainCtx.fillStyle = '#0f172a';
    mainCtx.fillRect(0, 0, IMG_W, IMG_H);

    if (customSearchImg) {
      // Draw custom uploaded image scaled to fit search canvas
      mainCtx.save();
      mainCtx.translate(IMG_W / 2, IMG_H / 2);
      mainCtx.rotate(rot);
      mainCtx.scale(scale, scale);
      mainCtx.drawImage(customSearchImg, -IMG_W / 2, -IMG_H / 2, IMG_W, IMG_H);
      mainCtx.restore();
      targetX = Math.floor(IMG_W / 2 - TPL_W / 2);
      targetY = Math.floor(IMG_H / 2 - TPL_H / 2);
    } else {
      // Background texture/distractors
      mainCtx.fillStyle = '#1e293b';
      for (let i = 0; i < 6; i++) {
        mainCtx.beginPath();
        mainCtx.arc(30 + i * 40, 30 + ((i % 2) * 80), 18, 0, Math.PI * 2);
        mainCtx.fill();
      }

      // Place target object with scale & rotation
      targetX = 140;
      targetY = 70;

      mainCtx.save();
      mainCtx.translate(targetX + TPL_W / 2, targetY + TPL_H / 2);
      mainCtx.rotate(rot);
      mainCtx.scale(scale, scale);
      mainCtx.drawImage(tCanvas, -TPL_W / 2, -TPL_H / 2);
      mainCtx.restore();
    }

    // Add noise if specified
    if (noise > 0) {
      const imgData = mainCtx.getImageData(0, 0, IMG_W, IMG_H);
      const data = imgData.data;
      const noiseLevel = (noise / 100) * 128;
      for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * noiseLevel;
        data[i] = Math.min(255, Math.max(0, data[i] + n));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
      }
      mainCtx.putImageData(imgData, 0, 0);
    }

    sceneData = mainCtx.getImageData(0, 0, IMG_W, IMG_H);
  }

  function runMatching() {
    if (!sceneData || !templateData) return;

    const outW = IMG_W - TPL_W + 1;
    const outH = IMG_H - TPL_H + 1;
    const heatmap = new Float32Array(outW * outH);

    const sData = sceneData.data;
    const tData = templateData.data;

    let bestVal = currentMethod === 'sqdiff_normed' ? Infinity : -Infinity;
    let bestX = 0, bestY = 0;

    // Precalculate template grayscale & mean
    const tGray = new Float32Array(TPL_W * TPL_H);
    let tMean = 0;
    let tNormSq = 0;
    for (let i = 0; i < TPL_W * TPL_H; i++) {
      const idx = i * 4;
      const g = 0.299 * tData[idx] + 0.587 * tData[idx + 1] + 0.114 * tData[idx + 2];
      tGray[i] = g;
      tMean += g;
      tNormSq += g * g;
    }
    tMean /= (TPL_W * TPL_H);

    let tDevSq = 0;
    for (let i = 0; i < TPL_W * TPL_H; i++) {
      const dev = tGray[i] - tMean;
      tDevSq += dev * dev;
    }
    const tStd = Math.sqrt(tDevSq) || 1e-5;

    // Fast sub-sampled computation for snappy UI
    for (let y = 0; y < outH; y += 2) {
      for (let x = 0; x < outW; x += 2) {
        let score = 0;

        if (currentMethod === 'sqdiff_normed') {
          let ssd = 0;
          let patchNormSq = 0;
          for (let ty = 0; ty < TPL_H; ty += 2) {
            for (let tx = 0; tx < TPL_W; tx += 2) {
              const sIdx = ((y + ty) * IMG_W + (x + tx)) * 4;
              const sg = 0.299 * sData[sIdx] + 0.587 * sData[sIdx + 1] + 0.114 * sData[sIdx + 2];
              const tg = tGray[ty * TPL_W + tx];
              const diff = tg - sg;
              ssd += diff * diff;
              patchNormSq += sg * sg;
            }
          }
          const denom = Math.sqrt(tNormSq * patchNormSq) || 1e-5;
          score = Math.min(1, Math.max(0, ssd / denom));

          if (score < bestVal) {
            bestVal = score;
            bestX = x;
            bestY = y;
          }
        } else if (currentMethod === 'ccorr_normed') {
          let ccorr = 0;
          let patchNormSq = 0;
          for (let ty = 0; ty < TPL_H; ty += 2) {
            for (let tx = 0; tx < TPL_W; tx += 2) {
              const sIdx = ((y + ty) * IMG_W + (x + tx)) * 4;
              const sg = 0.299 * sData[sIdx] + 0.587 * sData[sIdx + 1] + 0.114 * sData[sIdx + 2];
              const tg = tGray[ty * TPL_W + tx];
              ccorr += tg * sg;
              patchNormSq += sg * sg;
            }
          }
          const denom = Math.sqrt(tNormSq * patchNormSq) || 1e-5;
          score = ccorr / denom;
          if (score > bestVal) {
            bestVal = score;
            bestX = x;
            bestY = y;
          }
        } else {
          // ccoeff_normed
          let patchMean = 0;
          for (let ty = 0; ty < TPL_H; ty += 2) {
            for (let tx = 0; tx < TPL_W; tx += 2) {
              const sIdx = ((y + ty) * IMG_W + (x + tx)) * 4;
              patchMean += 0.299 * sData[sIdx] + 0.587 * sData[sIdx + 1] + 0.114 * sData[sIdx + 2];
            }
          }
          patchMean /= ((TPL_W / 2) * (TPL_H / 2));

          let num = 0;
          let patchDevSq = 0;
          for (let ty = 0; ty < TPL_H; ty += 2) {
            for (let tx = 0; tx < TPL_W; tx += 2) {
              const sIdx = ((y + ty) * IMG_W + (x + tx)) * 4;
              const sg = 0.299 * sData[sIdx] + 0.587 * sData[sIdx + 1] + 0.114 * sData[sIdx + 2];
              const tg = tGray[ty * TPL_W + tx];
              const sDev = sg - patchMean;
              const tDev = tg - tMean;
              num += sDev * tDev;
              patchDevSq += sDev * sDev;
            }
          }
          const denom = (tStd * Math.sqrt(patchDevSq)) || 1e-5;
          score = num / denom;
          if (score > bestVal) {
            bestVal = score;
            bestX = x;
            bestY = y;
          }
        }

        // Fill 2x2 for speed
        heatmap[y * outW + x] = score;
        if (x + 1 < outW) heatmap[y * outW + (x + 1)] = score;
        if (y + 1 < outH) {
          heatmap[(y + 1) * outW + x] = score;
          if (x + 1 < outW) heatmap[(y + 1) * outW + (x + 1)] = score;
        }
      }
    }

    renderHeatmap(heatmap, outW, outH);
    renderDetections(bestX, bestY, bestVal);
  }

  function renderHeatmap(heatmap, outW, outH) {
    const imgData = heatmapCtx.createImageData(outW, outH);
    const data = imgData.data;

    let min = Infinity, max = -Infinity;
    for (let i = 0; i < heatmap.length; i++) {
      if (heatmap[i] < min) min = heatmap[i];
      if (heatmap[i] > max) max = heatmap[i];
    }
    const range = (max - min) || 1e-5;

    for (let i = 0; i < heatmap.length; i++) {
      let val = (heatmap[i] - min) / range; // 0 to 1
      if (currentMethod === 'sqdiff_normed') {
        val = 1 - val; // lower is hotter
      }

      const pixelIdx = i * 4;
      // Thermal color map: Blue -> Cyan -> Green -> Yellow -> Red
      const r = Math.min(255, Math.max(0, Math.floor(255 * (val > 0.5 ? (val - 0.5) * 2 : 0))));
      const g = Math.min(255, Math.max(0, Math.floor(255 * (val < 0.5 ? val * 2 : 2 - val * 2))));
      const b = Math.min(255, Math.max(0, Math.floor(255 * (val < 0.5 ? 1 - val * 2 : 0))));

      data[pixelIdx] = r;
      data[pixelIdx + 1] = g;
      data[pixelIdx + 2] = b;
      data[pixelIdx + 3] = 255;
    }

    heatmapCtx.putImageData(imgData, 0, 0);
  }

  function renderDetections(x, y, score) {
    // Redraw base scene
    mainCtx.putImageData(sceneData, 0, 0);

    // Draw detected bounding box
    mainCtx.strokeStyle = '#10b981';
    mainCtx.lineWidth = 2;
    mainCtx.setLineDash([4, 2]);
    mainCtx.strokeRect(x, y, TPL_W, TPL_H);
    mainCtx.setLineDash([]);

    // Corner highlights
    mainCtx.fillStyle = '#10b981';
    mainCtx.fillRect(x - 2, y - 2, 6, 6);
    mainCtx.fillRect(x + TPL_W - 4, y - 2, 6, 6);
    mainCtx.fillRect(x - 2, y + TPL_H - 4, 6, 6);
    mainCtx.fillRect(x + TPL_W - 4, y + TPL_H - 4, 6, 6);

    // Label
    mainCtx.font = '10px Inter, sans-serif';
    mainCtx.fillStyle = '#10b981';
    const displayScore = currentMethod === 'sqdiff_normed'
      ? `Loss: ${score.toFixed(3)}`
      : `Score: ${(score * 100).toFixed(1)}%`;
    mainCtx.fillText(`Match (${x},${y})`, x, Math.max(12, y - 4));

    // Update readout metrics in UI
    const scoreEl = document.getElementById('tm-best-score');
    const locEl = document.getElementById('tm-best-loc');
    const distEl = document.getElementById('tm-ground-truth-dist');

    if (scoreEl) scoreEl.textContent = displayScore;
    if (locEl) locEl.textContent = `(${x}, ${y})`;

    const errorDist = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    if (distEl) {
      distEl.textContent = `${errorDist.toFixed(1)} px`;
      distEl.className = errorDist <= 5 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
    }
  }

  function toggleScanAnimation() {
    const btn = document.getElementById('tm-btn-animate');
    if (isScanning) {
      isScanning = false;
      cancelAnimationFrame(scanAnimationId);
      if (btn) btn.innerHTML = '<i class="fas fa-play mr-1"></i> Scan Animation';
      runMatching();
      return;
    }

    isScanning = true;
    if (btn) btn.innerHTML = '<i class="fas fa-pause mr-1"></i> Stop Animation';

    let curY = 0;
    let curX = 0;
    const step = 8;

    function stepScan() {
      if (!isScanning) return;

      mainCtx.putImageData(sceneData, 0, 0);

      // Draw active sliding window
      mainCtx.strokeStyle = '#3b82f6';
      mainCtx.lineWidth = 2;
      mainCtx.strokeRect(curX, curY, TPL_W, TPL_H);
      mainCtx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      mainCtx.fillRect(curX, curY, TPL_W, TPL_H);

      curX += step;
      if (curX > IMG_W - TPL_W) {
        curX = 0;
        curY += step;
        if (curY > IMG_H - TPL_H) {
          curY = 0;
        }
      }

      scanAnimationId = requestAnimationFrame(stepScan);
    }

    scanAnimationId = requestAnimationFrame(stepScan);
  }

  window.initTemplateMatching = init;
})();
