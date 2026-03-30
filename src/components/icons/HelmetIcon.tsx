import type { SlotIconProps } from './SwordIcon';

export default function HelmetIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14 L4 10 C4 5.6 7.6 2 12 2 C16.4 2 20 5.6 20 10 L20 14" />
      <path d="M2 14 L22 14 L22 18 L2 18 Z" />
      <line x1="8" y1="18" x2="8" y2="22" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  );
}
