'use client';

import { Edge } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Snowflake, TrendingUp, CheckCircle2, Network } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryEntry {
  tick: number;
  totalSnowCleared: number;
}

interface StatsPanelProps {
  edges: Edge[];
  history: HistoryEntry[];
}

export default function StatsPanel({ edges, history }: StatsPanelProps) {
  const totalSnow = edges.reduce((sum, edge) => sum + edge.snowDepth, 0);
  const maxSnow = edges.length * 5; // max possible snow (5 per edge)
  const clearedPercent = ((maxSnow - totalSnow) / maxSnow) * 100;
  const averageSnow = edges.length > 0 ? totalSnow / edges.length : 0;

  const stats = [
    {
      label: 'Total Snow',
      value: totalSnow.toFixed(2),
      icon: Snowflake,
      color: 'text-blue-500',
    },
    {
      label: 'Avg per Edge',
      value: averageSnow.toFixed(2),
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      label: 'Cleared',
      value: `${clearedPercent.toFixed(1)}%`,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Total Edges',
      value: edges.length.toString(),
      icon: Network,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-3">
      <Card className="w-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg">Snow Cleared Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="tick" 
                  label={{ value: '', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis 
                  label={{ value: '', angle: -90, position: 'insideLeft', offset: 10 }}
                  className="text-xs"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [value.toFixed(0), 'Snow Cleared (m·depth)']}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalSnowCleared" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Start simulation to see data
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Icon className={`h-5 w-5 mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
