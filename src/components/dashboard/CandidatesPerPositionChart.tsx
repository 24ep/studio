"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Candidate, Position } from "@/lib/types"
// Static imports for chart elements
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CandidatesPerPositionChartProps {
  candidates: Candidate[];
  positions: Position[];
}

export function CandidatesPerPositionChart({ candidates, positions }: CandidatesPerPositionChartProps) {
  // Ensure inputs are arrays before processing
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safePositions = Array.isArray(positions) ? positions : [];
  
  const data = safePositions.map(position => {
    const candidateCount = safeCandidates.filter(c => c.positionId === position.id).length;
    return {
      position: position.title.length > 15 ? `${position.title.substring(0,12)}...` : position.title, // Truncate long titles
      fullPositionTitle: position.title,
      candidates: candidateCount,
    };
  }).filter(item => item.candidates > 0); // Only show positions with candidates

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidates per Position</CardTitle>
          <CardDescription>Overview of candidate distribution across open positions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No candidate data available for positions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates per Position</CardTitle>
        <CardDescription>Overview of candidate distribution across open positions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Bar
          data={{
            labels: data.map(d => d.position),
            datasets: [
              {
                label: 'Candidates',
                data: data.map(d => d.candidates),
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.7,
              },
            ],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return ` ${context.parsed.x} candidates`;
                  }
                }
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: 'rgba(100,116,139,0.1)' },
                ticks: { color: '#64748b', font: { size: 13 } },
              },
              y: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 13 } },
              },
            },
          }}
          height={300}
        />
      </CardContent>
    </Card>
  )
}
