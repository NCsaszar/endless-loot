import type { SlotIconProps } from './SwordIcon';

export default function BootsIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 L10 2 L10 10 L18 14 L20 18 L20 22 L4 22 L4 18 L6 10 Z" />
    </svg>
  );
}
