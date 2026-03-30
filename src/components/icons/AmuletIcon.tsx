import type { SlotIconProps } from './SwordIcon';

export default function AmuletIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2 C8 2 6 6 6 8 L12 6 L18 8 C18 6 16 2 16 2" />
      <circle cx="12" cy="14" r="6" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  );
}
