# Image & Video Analytics (IVA): Face & Object Recognition Analytics Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://selvamuthukumar18m-tech.github.io/image-processing/)
[![Assignment](https://img.shields.io/badge/Coursework-IVA%20Assignment%202-blue?style=for-the-badge)](https://github.com/selvamuthukumar18m-tech/image-processing)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

An academic-grade, interactive computer vision laboratory exploring the four pivotal architectural paradigms in face and object recognition:
1. **Template Matching** (Traditional sliding-window pixel correlation)
2. **Viola-Jones Algorithm** (Real-time boosted Haar cascades & $O(1)$ Integral Image)
3. **DeepFace** (Facebook 2014: 3D face alignment & locally connected layers)
4. **FaceNet** (Google 2015: Direct 128-D Euclidean metric embedding & Triplet Loss)

---

## 🚀 Live Demo

Access the interactive application directly in your browser:
👉 **[https://selvamuthukumar18m-tech.github.io/image-processing/](https://selvamuthukumar18m-tech.github.io/image-processing/)**

---

## 📸 Key Features & Interactive Simulators

### 1. Template Matching
- **Similarity Metrics**: Mathematical evaluation of Sum of Squared Differences ($R_{SSD}$), Normalized Cross-Correlation ($R_{CCORR}$), and Normalized Correlation Coefficient ($R_{CCOEFF\_NORMED}$).
- **Interactive Sliding-Window Scanner**: Step-through scan animation generating a real-time thermal correlation heatmap.
- **Custom Image Upload & Auto-Crop**: Upload any custom search photo or click directly on the canvas to crop a custom $40\times 40$ template.
- **Transformation Sensitivity**: Sliders for rotation angle ($0^\circ - 180^\circ$) and Gaussian noise ($0\% - 60\%$) demonstrating classical correlation failure modes.

### 2. Viola-Jones Algorithm (2001)
- **Interactive Integral Image $O(1)$ Calculator**: 
  - Dynamic 6×6 pixel grid where selecting any sub-rectangle immediately computes:
    $$\text{Sum} = D - B - C + A$$
  - Real-time corner highlighting ($A, B, C, D$) verified against brute-force summation.
- **Haar Feature Morphology**: Visual overlay of Edge, Line, and Diagonal filters on anatomical landmarks (eyes vs cheeks, nose bridge vs eye sockets) with support for **custom uploaded portraits**.
- **Attentional Cascade Funnel**: Multi-stage rejection visualization demonstrating how $>95\%$ of negative sub-windows are eliminated in early stages.

### 3. DeepFace (Taigman et al., 2014)
- **3D Face Alignment & Frontalization Pipeline**:
  - Interactive 4-step pipeline: Raw 2D crop $\to$ 6-point fiducial localization $\to$ 67-point 3D generic model fitting (Delaunay triangulation) $\to$ 3D piecewise-affine frontalization.
  - Supports **custom face upload** to visualize real alignment steps.
- **Locally Connected Layers Inspector**: Detailed architectural breakdown explaining why parameter sharing is omitted in layers L4, L5, and L6 for 3D-aligned facial features.

### 4. FaceNet (Schroff et al., 2015)
- **Interactive Triplet Loss Playground**:
  - Drag Anchor ($A$), Positive ($P$), and Negative ($N$) embeddings on a 2D Euclidean coordinate canvas.
  - Dynamic calculation of distance spheres, margin parameter $\alpha$, and instantaneous Triplet Loss:
    $$\mathcal{L} = \max\left(0, \|f(x^a) - f(x^p)\|_2^2 - \|f(x^a) - f(x^n)\|_2^2 + \alpha\right)$$
  - Real-time classification into **Easy**, **Semi-Hard**, and **Hard** negative triplet regimes.
- **128-D Euclidean Face Verification Engine**:
  - Upload two custom photos to extract normalized 128-D embeddings $f(x) \in \mathbb{S}^{127}$.
  - Computes exact Euclidean distance $d = \|f(x_1) - f(x_2)\|_2$ and classifies matching identity against threshold $\tau = 1.24$.

### 5. Comparative Benchmarks & Assessment
- **Comprehensive Benchmark Matrix**: Comparison across accuracy (LFW), inference speed (FPS), scale/rotation invariance, hardware requirements, and loss functions.
- **Live Radar & Bar Charts**: Normalized performance visualization powered by Chart.js.
- **Interactive Knowledge Quiz**: 5-question conceptual and mathematical assessment with instant feedback, scoring, and academic explanations.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ modular, Canvas API)
- **Styling**: Tailwind CSS (CDN) + Custom Glassmorphism Theme (Dark/Light mode support)
- **Mathematics**: KaTeX for crystal-clear LaTeX formula typesetting
- **Data Visualization**: Chart.js for comparative performance radar and bar charts
- **Icons**: FontAwesome 6

---

## 📁 Repository Structure

```
image-processing/
├── index.html                   # Core IVA assignment platform (Template Matching, Viola-Jones, DeepFace, FaceNet)
├── convolution-lab.html         # Pixel Matrix Convolution Lab (spatial filtering & kernels)
├── css/
│   └── styles.css               # Custom theme styles, matrix cell highlighting, animations
├── js/
│   ├── app.js                   # Navigation router, theme switcher, KaTeX equation auto-renderer, quiz engine
│   ├── comparison-chart.js      # Benchmark radar chart and LFW accuracy bar chart (Chart.js)
│   └── modules/
│       ├── template-matching.js # Sliding window scanner, live correlation heatmaps, image upload & crop
│       ├── viola-jones.js       # O(1) Integral image calculator, Haar feature visualizer, cascade funnel
│       ├── deepface.js          # 4-step 3D face alignment pipeline & locally connected layer inspector
│       └── facenet.js           # 2D Triplet loss playground & 128-D Euclidean face verification engine
├── IVA_Assignment_Website.zip   # Offline standalone package (~39 KB)
└── README.md                    # Project documentation
```

---

## 💻 How to Run Locally

### Option 1: Direct Browser Launch
Simply double-click `index.html` in your file explorer to open it in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).

### Option 2: Local HTTP Server (Python)
```bash
# Clone the repository
git clone https://github.com/selvamuthukumar18m-tech/image-processing.git
cd image-processing

# Start local server
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📚 Academic References

1. **Viola, P., & Jones, M. (2001).** *Rapid object detection using a boosted cascade of simple features.* In Proceedings of the IEEE Computer Society Conference on Computer Vision and Pattern Recognition (CVPR 2001), Vol. 1, pp. I-511. IEEE.
2. **Taigman, Y., Yang, M., Ranzato, M. A., & Wolf, L. (2014).** *DeepFace: Closing the gap to human-level performance in face verification.* In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2014), pp. 1701-1708.
3. **Schroff, F., Kalenichenko, D., & Philbin, J. (2015).** *FaceNet: A unified embedding for face recognition and clustering.* In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2015), pp. 815-823.
4. **Lewis, J. P. (1995).** *Fast normalized cross-correlation.* In Vision interface, Vol. 10, No. 1, pp. 120-123.
