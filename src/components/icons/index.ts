import type { EquipSlot } from '../../types';
import SwordIcon from './SwordIcon';
import ShieldIcon from './ShieldIcon';
import HelmetIcon from './HelmetIcon';
import ChestplateIcon from './ChestplateIcon';
import LeggingsIcon from './LeggingsIcon';
import BootsIcon from './BootsIcon';
import RingIcon from './RingIcon';
import AmuletIcon from './AmuletIcon';

export type { SlotIconProps } from './SwordIcon';

export const SLOT_ICONS: Record<EquipSlot, React.FC<{ size?: number; color?: string; className?: string }>> = {
  weapon: SwordIcon,
  offhand: ShieldIcon,
  helmet: HelmetIcon,
  chest: ChestplateIcon,
  legs: LeggingsIcon,
  boots: BootsIcon,
  ring: RingIcon,
  amulet: AmuletIcon,
};
