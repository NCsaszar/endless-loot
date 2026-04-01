const TOOLTIP_WIDTH = 210;

export function computeTooltipPosition(rect: DOMRect): { x: number; y: number } {
  const halfW = TOOLTIP_WIDTH / 2;
  const x = Math.max(halfW + 4, Math.min(window.innerWidth - halfW - 4, rect.left + rect.width / 2));
  return { x, y: rect.top };
}
