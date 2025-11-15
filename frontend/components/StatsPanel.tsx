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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Icon className={`h-4 w-4 mb-1 ${stat.color}`} />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground text-center">
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
