'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  policy: string;
  onPolicyChange: (policy: string) => void;
  tickSpeedMs: number;
  onTickSpeedChange: (speedMs: number) => void;
}

export default function ControlPanel({
  isRunning,
  onToggle,
  onReset,
  policy,
  onPolicyChange,
  tickSpeedMs,
  onTickSpeedChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={onToggle}
          className="flex-1"
          variant={isRunning ? 'secondary' : 'default'}
        >
          {isRunning ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start
            </>
          )}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
      <div className="space-y-1">
        <label htmlFor="policy-select" className="text-xs font-medium">
          Routing Policy
        </label>
        <select
          id="policy-select"
          value={policy}
          onChange={(e) => onPolicyChange(e.target.value)}
          disabled={isRunning}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="naive">Naive</option>
          <option value="finite_horizon_greedy">Finite Horizon Greedy</option>
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="tick-speed" className="text-xs font-medium">
          Tick Speed: {tickSpeedMs}ms
        </label>
        <input
          id="tick-speed"
          type="range"
          min="100"
          max="3000"
          step="100"
          value={tickSpeedMs}
          onChange={(e) => onTickSpeedChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>
    </div>
  );
}

