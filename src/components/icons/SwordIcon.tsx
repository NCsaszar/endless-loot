export interface SlotIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function SwordIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" y1="20" x2="18" y2="6" />
      <path d="M15 3 l6 0 l0 6" />
      <line x1="21" y1="3" x2="18" y2="6" />
      <path d="M6.5 15.5 l-3 3 M5 14 l-3 3" />
    </svg>
  );
}
