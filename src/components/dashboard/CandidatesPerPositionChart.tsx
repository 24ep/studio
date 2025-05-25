
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Candidate, Position } from "@/lib/types"

interface CandidatesPerPositionChartProps {
  candidates: Candidate[];
  positions: Position[];
}

export function CandidatesPerPositionChart({ candidates, positions }: CandidatesPerPositionChartProps) {
  const data = positions.map(position => {
    const candidateCount = candidates.filter(c => c.positionId === position.id).length;
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

  const chartConfig = {
    candidates: {
      label: "Candidates",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates per Position</CardTitle>
        <CardDescription>Overview of candidate distribution across open positions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="position"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  labelKey="fullPositionTitle"
                  formatter={(value, name, props) => (
                    <>
                     <div className="font-medium">{props.payload.fullPositionTitle}</div>
                     <div className="text-muted-foreground">{`${value} candidates`}</div>
                    </>
                  )}
                />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="candidates" fill="var(--color-candidates)" radius={4}>
                <LabelList
                  position="top"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
