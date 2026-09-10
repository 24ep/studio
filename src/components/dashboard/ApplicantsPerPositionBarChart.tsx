"use client";

import { Bar } from 'react-chartjs-2';

import type { ApplicantsPerPositionDatum } from './applicants-per-position-utils';

const BAR_BACKGROUND_COLORS = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(249, 115, 22, 0.8)',
];

const BAR_HOVER_COLORS = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(34, 197, 94, 1)',
  'rgba(249, 115, 22, 1)',
];

export function ApplicantsPerPositionBarChart({ data }: { data: ApplicantsPerPositionDatum[] }) {
  return (
    <Bar
      data={{
        labels: data.map(item => item.position),
        datasets: [
          {
            label: 'Applicants',
            data: data.map(item => item.applicants),
            backgroundColor: BAR_BACKGROUND_COLORS,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.7,
            borderWidth: 0,
            hoverBackgroundColor: BAR_HOVER_COLORS,
          },
        ],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            bodyColor: '#374151',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => {
                if (!context || !context[0] || typeof context[0].dataIndex === 'undefined') {
                  return '';
                }
                const dataIndex = context[0].dataIndex;
                return data[dataIndex]?.fullPositionTitle || context[0].label;
              },
              label: (context) => ` ${context.parsed.x} applicants`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(100,116,139,0.1)',
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 12,
                weight: 500,
              },
              padding: 8,
            },
            border: {
              display: false,
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 12,
                weight: 500,
              },
              padding: 8,
            },
            border: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
          onProgress: (animation) => {
            const chart = animation.chart;
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0];
            const meta = chart.getDatasetMeta(0);

            meta.data.forEach((bar, index) => {
              const value = dataset.data[index];

              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.font = '12px DM Sans, var(--font-dm-sans), sans-serif';
              ctx.fillStyle = '#374151';

              if (value && typeof value === 'number' && value > 0) {
                ctx.fillText(value.toString(), bar.x + 15, bar.y);
              }
              ctx.restore();
            });
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }}
    />
  );
}
