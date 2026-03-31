import type { DeathInfo, DerivedStats } from '../types';

interface DeathModalProps {
  deathInfo: DeathInfo;
  derived: DerivedStats;
  onRetreat: () => void;
  onRetry: () => void;
}

function getRecommendations(deathInfo: DeathInfo, derived: DerivedStats): string[] {
  const tips: string[] = [];
  const { killerAtk } = deathInfo;

  if (derived.defense < killerAtk * 0.4) {
    tips.push('Your Defense is very low for this zone. Equip better armor or invest in VIT.');
  }
  if (derived.maxHp < killerAtk * 6) {
    tips.push('Your HP pool is too small. Allocate more VIT or find gear with Max Life affixes.');
  }
  if (derived.dodgeChance < 0.05) {
    tips.push('Your Dodge Chance is almost zero. Some DEX investment could help you survive longer.');
  }
  if (derived.hpRegen < killerAtk * 0.05) {
    tips.push('Your HP Regen is too low to sustain against this enemy. Look for HP Regen affixes.');
  }
  if (derived.attackPower < killerAtk * 0.8) {
    tips.push('Your Attack Power is low compared to this enemy. Upgrade your weapon or invest in STR.');
  }

  if (tips.length === 0) {
    tips.push('This enemy is tough! Try farming in a lower zone for better gear.');
  }

  return tips;
}

const GENERIC_TIPS = [
  'Farm easier zones to level up and find better gear.',
  'Use the Blacksmith to slot essences and strengthen your equipment.',
  'Balance your stats — pure offense leaves you vulnerable.',
  'Check the comparison modal to find gear upgrades in your inventory.',
];

export default function DeathModal({ deathInfo, derived, onRetreat, onRetry }: DeathModalProps) {
  const recommendations = getRecommendations(deathInfo, derived);
  const genericTip = GENERIC_TIPS[Math.floor(Math.random() * GENERIC_TIPS.length)];

  return (
    <div className="modal-overlay death-modal-overlay">
      <div className="modal-content death-modal" onClick={e => e.stopPropagation()}>
        <div className="death-modal-header">
          <h2>You Died!</h2>
        </div>

        <div className="death-modal-info">
          <div className="death-detail">
            <span className="death-label">Killed by</span>
            <span className="death-value death-killer">{deathInfo.killerName}</span>
          </div>
          <div className="death-detail">
            <span className="death-label">Zone</span>
            <span className="death-value">#{deathInfo.zoneId} {deathInfo.zoneName}</span>
          </div>
          <div className="death-detail">
            <span className="death-label">Enemy Level</span>
            <span className="death-value">Lv.{deathInfo.killerLevel}</span>
          </div>
          <div className="death-stats-row">
            <span>Enemy ATK: {deathInfo.killerAtk}</span>
            <span>Your DEF: {Math.floor(derived.defense)}</span>
            <span>Your HP: {Math.floor(derived.maxHp)}</span>
          </div>
        </div>

        <div className="death-recommendations">
          <h3>Analysis</h3>
          {recommendations.map((tip, i) => (
            <div key={i} className="death-rec-item">{tip}</div>
          ))}
        </div>

        <div className="death-generic-tip">
          {genericTip}
        </div>

        <div className="death-modal-actions">
          <button className="death-btn death-btn-retreat" onClick={onRetreat}>
            Retreat to Safety
          </button>
          {!deathInfo.wasEndless && (
            <button className="death-btn death-btn-retry" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>

        {!deathInfo.wasEndless && (
          <div className="death-warning">
            Retreating will re-lock this zone and all zones beyond it.
          </div>
        )}
      </div>
    </div>
  );
}
