export interface SlotIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function SwordIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Blade */}
      <path d="M12 2 L14.5 10 L12 18 L9.5 10 Z" fill={color} fillOpacity="0.15" />
      {/* Blade edges */}
      <line x1="12" y1="2" x2="14.5" y2="10" />
      <line x1="14.5" y1="10" x2="12" y2="18" />
      <line x1="12" y1="18" x2="9.5" y2="10" />
      <line x1="9.5" y1="10" x2="12" y2="2" />
      {/* Fuller (center line) */}
      <line x1="12" y1="4" x2="12" y2="15" strokeOpacity="0.4" />
      {/* Crossguard */}
      <rect x="7" y="17.5" width="10" height="1.5" rx="0.75" fill={color} fillOpacity="0.3" />
      {/* Grip */}
      <line x1="12" y1="19" x2="12" y2="21.5" strokeWidth="2" />
      {/* Grip wrap marks */}
      <line x1="11.2" y1="19.5" x2="12.8" y2="19.5" strokeWidth="0.75" strokeOpacity="0.5" />
      <line x1="11.2" y1="20.5" x2="12.8" y2="20.5" strokeWidth="0.75" strokeOpacity="0.5" />
      {/* Pommel */}
      <circle cx="12" cy="22.5" r="1" fill={color} fillOpacity="0.3" />
    </svg>
  );
}
