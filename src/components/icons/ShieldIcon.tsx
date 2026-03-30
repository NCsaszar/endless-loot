import type { SlotIconProps } from './SwordIcon';

export default function ShieldIcon({ size = 24, color = 'currentColor', className }: SlotIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2 L4 6 L4 12 C4 17 12 22 12 22 C12 22 20 17 20 12 L20 6 Z" />
    </svg>
  );
}
