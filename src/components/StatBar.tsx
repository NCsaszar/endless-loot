interface StatBarProps {
  current: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
  showText?: boolean;
}

export default function StatBar({
  current,
  max,
  color = '#e44',
  height = 18,
  label,
  showText = true,
}: StatBarProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className="stat-bar" style={{ height }}>
      <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      {showText && (
        <span className="stat-bar-text">
          {label ? `${label}: ` : ''}
          {Math.floor(current)} / {Math.floor(max)}
        </span>
      )}
    </div>
  );
}
