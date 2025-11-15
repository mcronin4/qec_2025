'use client';

import { Edge } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Snowflake, TrendingUp, CheckCircle2, Network } from 'lucide-react';

interface StatsPanelProps {
  edges: Edge[];
}

export default function StatsPanel({ edges }: StatsPanelProps) {
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
  );
}
