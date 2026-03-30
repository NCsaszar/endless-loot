import type { SlotIconProps } from './SwordIcon';

export default function RingIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="14" r="7" />
      <circle cx="12" cy="14" r="4" />
      <path d="M10 7 L12 2 L14 7" />
    </svg>
  );
}
