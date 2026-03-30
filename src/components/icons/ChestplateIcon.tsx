import type { SlotIconProps } from './SwordIcon';

export default function ChestplateIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4 L8 2 L12 4 L16 2 L20 4 L20 12 L18 20 L6 20 L4 12 Z" />
      <line x1="12" y1="4" x2="12" y2="14" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
  );
}
