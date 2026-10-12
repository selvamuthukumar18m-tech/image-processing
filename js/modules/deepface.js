/**
 * DeepFace (Taigman et al., 2014) Interactive Module
 * Image and Video Analytics (IVA) Assignment Module
 * 
 * Features:
 * 1. 3D Face Alignment & Frontalization Pipeline Step-Through
 * 2. Locally Connected Layers vs Standard Convolution Interactive Explorer
 * 3. 9-Layer DeepFace Architecture Inspector
 */

(function () {
  let alignCanvas, alignCtx;
  let currentStep = 1;

  const ARCH_LAYERS = [
    {
      name: "Input Layer",
      type: "Input",
      dims: "152 × 152 × 3",
      params: "0",
      details: "RGB aligned and frontalized face crop of dimension 152x152 pixels."
    },
    {
      name: "C1: Convolution",
      type: "Conv2D",
      dims: "142 × 142 × 32",
      params: "~11.6K",
      details: "32 filters of size 11×11×3 with stride 1. Extracts low-level edge and color contrast primitives."
    },
    {
      name: "M2: Max Pooling",
      type: "MaxPool",
      dims: "71 × 71 × 32",
      params: "0",
      details: "3×3 max pooling with stride 2. Provides spatial downsampling and local translation tolerance."
    },
    {
      name: "C3: Convolution",
      type: "Conv2D",
      dims: "63 × 63 × 16",
      params: "~73.7K",
      details: "16 filters of size 9×9×32 with stride 1. Learns intermediate structural motifs."
    },
    {
      name: "L4: Locally Connected",
      type: "LocallyConnected",
      dims: "55 × 55 × 16",
      params: "~1.4M",
      details: "16 unshared filters of size 9×9 per spatial location. Critical: Weights are NOT shared across the spatial grid because the face is rigidly 3D-aligned!"
    },
    {
      name: "L5: Locally Connected",
      type: "LocallyConnected",
      dims: "49 × 49 × 16",
      params: "~1.0M",
      details: "16 unshared filters of size 7×7. Extracts specialized facial morphology (e.g. eye corners vs nasal bridge)."
    },
    {
      name: "L6: Locally Connected",
      type: "LocallyConnected",
      dims: "45 × 45 × 16",
      params: "~0.6M",
      details: "16 unshared filters of size 5×5. Fine-grained local feature synthesis without parameter sharing."
    },
    {
      name: "F7: Fully Connected",
      type: "Dense (Representation)",
      dims: "4096-D",
      params: "~132M",
      details: "The core 4,096-dimensional facial representation feature vector used for face verification."
    },
    {
      name: "F8: Softmax Output",
      type: "Output Classification",
      dims: "4,030 identities",
      params: "~16.5M",
      details: "Softmax classification over 4,030 training identities from the Social Face Classification (SFC) dataset."
    }
  ];

  function init() {
    initAlignmentVisualizer();
    initArchitectureExplorer();
  }

  let customDFFaceImg = null;

  /* -------------------------------------------------------------
     1. 3D Face Alignment & Frontalization Pipeline
  ------------------------------------------------------------- */
  function initAlignmentVisualizer() {
    alignCanvas = document.getElementById('df-align-canvas');
    if (!alignCanvas) return;

    alignCtx = alignCanvas.getContext('2d');
    alignCanvas.width = 280;
    alignCanvas.height = 280;

    const stepBtns = document.querySelectorAll('.df-step-btn');
    stepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stepBtns.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
        btn.classList.add('bg-blue-600', 'text-white');
        currentStep = parseInt(btn.dataset.step, 10);
        renderAlignmentStep();
      });
    });

    const uploadInput = document.getElementById('df-upload-face');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            customDFFaceImg = img;
            const badge = document.getElementById('df-custom-badge');
            if (badge) badge.classList.remove('hidden');
            renderAlignmentStep();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    const resetBtn = document.getElementById('df-btn-reset-face');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        customDFFaceImg = null;
        if (uploadInput) uploadInput.value = '';
        const badge = document.getElementById('df-custom-badge');
        if (badge) badge.classList.add('hidden');
        renderAlignmentStep();
      });
    }

    renderAlignmentStep();
  }

  function renderAlignmentStep() {
    alignCtx.clearRect(0, 0, alignCanvas.width, alignCanvas.height);
    const descEl = document.getElementById('df-step-description');

    const cx = 140, cy = 140;

    function renderFace(ctx, tilt) {
      if (customDFFaceImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(customDFFaceImg, -80, -80, 160, 160);
        ctx.restore();
      } else {
        drawFaceBase(ctx, 0, 0);
      }
    }

    if (currentStep === 1) {
      // Step 1: Raw Unaligned Tilted Face
      alignCtx.save();
      alignCtx.translate(cx, cy);
      alignCtx.rotate(-0.25); // 15-degree tilt
      renderFace(alignCtx, -0.25);

      // Raw bounding box
      alignCtx.strokeStyle = '#ef4444';
      alignCtx.lineWidth = 2;
      alignCtx.strokeRect(-75, -85, 150, 170);
      alignCtx.restore();

      if (descEl) {
        descEl.innerHTML = `<span class="text-rose-400 font-bold">Step 1: 2D Face Detection & Cropping</span><br>
        Standard Viola-Jones or CNN detector identifies bounding box. Notice arbitrary roll/yaw and scale variance in unaligned wild images.`;
      }
    } else if (currentStep === 2) {
      // Step 2: 2D Fiducial Landmark Anchors
      alignCtx.save();
      alignCtx.translate(cx, cy);
      alignCtx.rotate(-0.25);
      renderFace(alignCtx, -0.25);

      // 6 primary fiducial points
      const points = [
        { x: -30, y: -15, label: "L-Eye" },
        { x: 30, y: -15, label: "R-Eye" },
        { x: 0, y: 15, label: "Nose" },
        { x: -22, y: 48, label: "M-L" },
        { x: 22, y: 48, label: "M-R" },
        { x: 0, y: 72, label: "Chin" }
      ];

      points.forEach(p => {
        alignCtx.fillStyle = '#10b981';
        alignCtx.beginPath();
        alignCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        alignCtx.fill();
        alignCtx.strokeStyle = '#ffffff';
        alignCtx.lineWidth = 1.5;
        alignCtx.stroke();
      });
      alignCtx.restore();

      if (descEl) {
        descEl.innerHTML = `<span class="text-emerald-400 font-bold">Step 2: 2D Fiducial Localization (6 Anchors)</span><br>
        DeepFace localizes 6 fundamental landmarks (2 ocular centers, nasal tip, 2 labial commissures, mental point) via an iterative SVR pipeline.`;
      }
    } else if (currentStep === 3) {
      // Step 3: Delaunay Triangulation on 3D Model
      alignCtx.save();
      alignCtx.translate(cx, cy);
      alignCtx.rotate(-0.1);
      renderFace(alignCtx, -0.1);

      // Draw Delaunay Mesh Wireframe
      alignCtx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
      alignCtx.lineWidth = 1;

      const mesh = [
        [-50, -60], [0, -70], [50, -60],
        [-30, -15], [30, -15], [0, -15],
        [-40, 20], [0, 15], [40, 20],
        [-25, 50], [25, 50], [0, 75]
      ];

      for (let i = 0; i < mesh.length; i++) {
        for (let j = i + 1; j < mesh.length; j++) {
          const d = Math.hypot(mesh[i][0] - mesh[j][0], mesh[i][1] - mesh[j][1]);
          if (d < 55) {
            alignCtx.beginPath();
            alignCtx.moveTo(mesh[i][0], mesh[i][1]);
            alignCtx.lineTo(mesh[j][0], mesh[j][1]);
            alignCtx.stroke();
          }
        }
      }

      // Landmarks
      mesh.forEach(p => {
        alignCtx.fillStyle = '#38bdf8';
        alignCtx.beginPath();
        alignCtx.arc(p[0], p[1], 2.5, 0, Math.PI * 2);
        alignCtx.fill();
      });

      alignCtx.restore();

      if (descEl) {
        descEl.innerHTML = `<span class="text-cyan-400 font-bold">Step 3: 67-Point 3D Generic Model Fitting</span><br>
        Extends the 6 anchors to 67 fiducial points. Fits a generic 3D surface model and constructs a 3D Delaunay triangulation mesh to resolve out-of-plane rotation (yaw).`;
      }
    } else {
      // Step 4: Frontalized Warped Face (Canonical 152x152)
      alignCtx.save();
      alignCtx.translate(cx, cy);
      // Perfect vertical alignment, zero tilt
      renderFace(alignCtx, 0);

      // Canonical registration grid
      alignCtx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      alignCtx.lineWidth = 1;
      alignCtx.strokeRect(-65, -75, 130, 150);

      // Symmetry axis
      alignCtx.setLineDash([4, 4]);
      alignCtx.strokeStyle = '#a855f7';
      alignCtx.beginPath();
      alignCtx.moveTo(0, -75);
      alignCtx.lineTo(0, 75);
      alignCtx.stroke();
      alignCtx.setLineDash([]);

      alignCtx.restore();

      if (descEl) {
        descEl.innerHTML = `<span class="text-purple-400 font-bold">Step 4: 3D Piecewise-Affine Frontalization</span><br>
        Warps the triangular patches onto the canonical frontal camera plane. Soft visibility masking handles occluded facial halves, producing a standardized 152×152 input crop.`;
      }
    }
  }

  function drawFaceBase(ctx, ox, oy) {
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(ox, oy, 65, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(ox - 28, oy - 15, 14, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(ox + 28, oy - 15, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(ox, oy - 8);
    ctx.lineTo(ox - 6, oy + 18);
    ctx.lineTo(ox + 6, oy + 18);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(ox, oy + 48, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* -------------------------------------------------------------
     2. Architecture Explorer
  ------------------------------------------------------------- */
  function initArchitectureExplorer() {
    const listContainer = document.getElementById('df-layers-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    ARCH_LAYERS.forEach((layer, idx) => {
      const item = document.createElement('div');
      item.className = `p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
        idx === 4 
          ? 'bg-blue-900/30 border-blue-500 shadow-md ring-1 ring-blue-500/50' 
          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
      }`;
      item.innerHTML = `
        <div>
          <div class="text-sm font-semibold ${layer.type.includes('Locally') ? 'text-amber-400' : 'text-slate-200'}">
            ${layer.name}
          </div>
          <div class="text-xs text-slate-400">${layer.dims}</div>
        </div>
        <div class="text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
          ${layer.params}
        </div>
      `;

      item.addEventListener('click', () => {
        // Highlight active item
        document.querySelectorAll('#df-layers-list > div').forEach(el => {
          el.classList.remove('ring-1', 'ring-blue-500/50', 'bg-blue-900/30', 'border-blue-500');
        });
        item.classList.add('ring-1', 'ring-blue-500/50', 'bg-blue-900/30', 'border-blue-500');

        // Update detail inspector
        const titleEl = document.getElementById('df-inspector-title');
        const typeEl = document.getElementById('df-inspector-type');
        const dimsEl = document.getElementById('df-inspector-dims');
        const paramsEl = document.getElementById('df-inspector-params');
        const bodyEl = document.getElementById('df-inspector-body');

        if (titleEl) titleEl.textContent = layer.name;
        if (typeEl) typeEl.textContent = layer.type;
        if (dimsEl) dimsEl.textContent = layer.dims;
        if (paramsEl) paramsEl.textContent = layer.params;
        if (bodyEl) bodyEl.textContent = layer.details;
      });

      listContainer.appendChild(item);
    });
  }

  window.initDeepFace = init;
})();
