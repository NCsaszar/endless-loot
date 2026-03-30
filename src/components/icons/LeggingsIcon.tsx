import type { SlotIconProps } from './SwordIcon';

export default function LeggingsIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 L18 2 L18 8 L16 22 L13 22 L12 12 L11 22 L8 22 L6 8 Z" />
    </svg>
  );
}
