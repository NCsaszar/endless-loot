import { useRef, useEffect, useState } from 'react';

interface AttackBarProps {
  progress: number; // 0 to 1
  color: string;    // base color, e.g. '#4af'
  height?: number;
}

export default function AttackBar({ progress, color, height = 10 }: AttackBarProps) {
  const prevProgress = useRef(progress);
  const [fireKey, setFireKey] = useState(0);

  useEffect(() => {
    // Detect attack fire: progress was high, now reset low
    if (prevProgress.current > 0.7 && progress < 0.2) {
      setFireKey(k => k + 1);
    }
    prevProgress.current = progress;
  }, [progress]);

  // Brighten as bar fills (opacity from 0.6 to 1.0)
  const fillOpacity = 0.6 + progress * 0.4;

  return (
    <div className="attack-bar" style={{ height }}>
      <div
        className="attack-bar-fill"
        style={{
          width: `${Math.min(progress, 1) * 100}%`,
          background: `linear-gradient(90deg, ${color}88 0%, ${color} 70%, #ffffffcc 100%)`,
          opacity: fillOpacity,
          height: '100%',
        }}
      />
      {fireKey > 0 && (
        <div
          key={fireKey}
          className="attack-bar-fire"
          style={{ '--pulse-color': color } as React.CSSProperties}
        />
      )}
    </div>
  );
}
