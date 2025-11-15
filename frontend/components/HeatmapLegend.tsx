'use client';

export default function HeatmapLegend() {
  const steps = 10;
  const maxSnow = 5;

  return (
    <div className="flex flex-col gap-2 p-3 bg-card border rounded-lg">
      <div className="text-sm font-semibold">Snow Depth Heatmap</div>
      <div className="flex items-center gap-2">
        {/* Color gradient bar */}
        <div className="flex-1 h-6 rounded overflow-hidden border">
          <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heatmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(0, 100, 255)" />
                <stop offset="50%" stopColor="rgb(127, 50, 127)" />
                <stop offset="100%" stopColor="rgb(255, 0, 0)" />
              </linearGradient>
            </defs>
            <rect width="100" height="20" fill="url(#heatmapGradient)" />
          </svg>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 (Clear)</span>
        <span>{maxSnow} (Heavy)</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Blue = Low snow • Red = High snow
      </div>
    </div>
  );
}

