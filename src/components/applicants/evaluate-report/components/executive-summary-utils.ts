import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import type { GroupedSkill, GroupedTrait } from '../types';

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getChartColorWithAlpha(color: string, alpha: number) {
  return color.startsWith('#') ? hexToRgba(color, alpha) : color;
}

export function getGroupedTraitAveragePercentage(group: GroupedTrait) {
  if (group.traits.length === 0) {
    return 0;
  }

  return Math.round(
    group.traits.reduce((sum, trait) => sum + trait.percentage, 0) / group.traits.length
  );
}

export function getGroupedSkillAveragePercentage(group: GroupedSkill) {
  if (group.skills.length === 0) {
    return 0;
  }

  return Math.round(
    group.skills.reduce((sum, skill) => sum + skill.percentage, 0) / group.skills.length
  );
}

export function getOverallExpertiseAverage(expertiseGroups: GroupedSkill[]) {
  const allSkills = expertiseGroups.flatMap((group) => group.skills);

  if (allSkills.length === 0) {
    return 0;
  }

  return allSkills.reduce((sum, skill) => sum + skill.percentage, 0) / allSkills.length;
}

export function buildPersonalityRadarData(personalityGroups: GroupedTrait[]): ChartData<'radar'> {
  return {
    labels: personalityGroups.map((group) => group.groupName),
    datasets: [{
      label: 'Average Score (%)',
      data: personalityGroups.map(getGroupedTraitAveragePercentage),
      backgroundColor: personalityGroups.map((group) => getChartColorWithAlpha(group.groupColor, 0.2)),
      borderColor: personalityGroups.map((group) => group.groupColor),
      borderWidth: 2,
      pointBackgroundColor: personalityGroups.map((group) => group.groupColor),
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: personalityGroups.map((group) => group.groupColor),
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };
}

export function buildPersonalityRadarOptions(): ChartOptions<'radar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${Math.round(context.parsed.r ?? 0)}%`,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${Math.round(Number(value))}%`,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
      },
    },
  };
}

export function createExpertiseBarGradientBackground(expertiseGroups: GroupedSkill[]) {
  return (context: ScriptableContext<'bar'>) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) {
      return 'rgba(59, 130, 246, 0.35)';
    }

    const color = expertiseGroups[context.dataIndex]?.groupColor || '#3B82F6';
    const validColor = color.startsWith('#') ? color : '#3B82F6';
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);

    gradient.addColorStop(0, hexToRgba(validColor, 0.2));
    gradient.addColorStop(1, validColor);

    return gradient;
  };
}

export function buildExpertiseBarData(expertiseGroups: GroupedSkill[]): ChartData<'bar'> {
  return {
    labels: expertiseGroups.map((group) => group.groupName),
    datasets: [{
      label: 'Average Score (%)',
      data: expertiseGroups.map(getGroupedSkillAveragePercentage),
      backgroundColor: createExpertiseBarGradientBackground(expertiseGroups),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
}

export function buildExpertiseBarOptions(): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${Math.round(context.parsed.y ?? 0)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${Math.round(Number(value))}%`,
        },
      },
    },
  };
}
