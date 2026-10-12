/**
 * Comparative Benchmark Charts Module (Chart.js)
 * Image and Video Analytics (IVA) Assignment Platform
 */

(function () {
  let radarChartInstance = null;
  let barChartInstance = null;

  function init() {
    initRadarChart();
    initAccuracyBarChart();
  }

  function initRadarChart() {
    const ctx = document.getElementById('benchmark-radar-chart');
    if (!ctx) return;

    if (radarChartInstance) {
      radarChartInstance.destroy();
    }

    const data = {
      labels: [
        'LFW Accuracy',
        'Inference Speed (FPS)',
        'Scale/Rotation Invariance',
        'Pose/Illumination Robustness',
        'Lightweight / Simplicity'
      ],
      datasets: [
        {
          label: 'Template Matching (SSD/NCC)',
          data: [35, 75, 15, 10, 95],
          borderColor: 'rgba(239, 68, 68, 0.85)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#ef4444'
        },
        {
          label: 'Viola-Jones (Haar + Cascade)',
          data: [60, 95, 40, 35, 80],
          borderColor: 'rgba(245, 158, 11, 0.85)',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b'
        },
        {
          label: 'DeepFace (Taigman et al.)',
          data: [97.35, 55, 90, 88, 30],
          borderColor: 'rgba(59, 130, 246, 0.85)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6'
        },
        {
          label: 'FaceNet (Schroff et al.)',
          data: [99.63, 70, 98, 97, 45],
          borderColor: 'rgba(16, 185, 129, 0.85)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981'
        }
      ]
    };

    radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: { tension: 0.15 }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: {
              color: '#94a3b8',
              font: { size: 11, family: 'Inter' }
            },
            ticks: {
              display: false,
              backdropColor: 'transparent',
              stepSize: 20
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 11 },
              padding: 12
            }
          }
        }
      }
    });
  }

  function initAccuracyBarChart() {
    const ctx = document.getElementById('benchmark-bar-chart');
    if (!ctx) return;

    if (barChartInstance) {
      barChartInstance.destroy();
    }

    const data = {
      labels: ['Template Matching', 'Viola-Jones', 'Human Eye (LFW)', 'DeepFace (2014)', 'FaceNet (2015)'],
      datasets: [{
        label: 'Accuracy on LFW Benchmark (%)',
        data: [42.1, 62.4, 97.53, 97.35, 99.63],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(148, 163, 184, 0.5)',
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.85)'
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#94a3b8',
          '#3b82f6',
          '#10b981'
        ],
        borderWidth: 1.5,
        borderRadius: 6
      }]
    };

    barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: {
              color: '#94a3b8',
              callback: (val) => val + '%'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#cbd5e1',
              font: { size: 11 }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Accuracy: ${context.parsed.y}%`
            }
          }
        }
      }
    });
  }

  window.initComparisonCharts = init;
})();
