'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export default function ControlPanel({
  isRunning,
  onToggle,
  onReset,
}: ControlPanelProps) {
  return (
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
  );
}

