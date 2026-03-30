import { useGameState } from '../hooks/useGameState';

export default function WelcomeBack() {
  const { offlineProgress, dismissOfflineProgress } = useGameState();

  if (!offlineProgress) return null;

  const { elapsedSeconds, kills, xpGained, goldGained, levelsGained, itemsFound } = offlineProgress;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="modal-overlay" onClick={dismissOfflineProgress}>
      <div className="modal-content welcome-back" onClick={e => e.stopPropagation()}>
        <h2>Welcome Back!</h2>
        <p>You were away for {formatTime(elapsedSeconds)}</p>
        <div className="offline-summary">
          <div><span>Mobs Killed</span><span>{kills.toLocaleString()}</span></div>
          <div><span>XP Gained</span><span>{xpGained.toLocaleString()}</span></div>
          {levelsGained > 0 && <div><span>Levels Gained</span><span>{levelsGained}</span></div>}
          <div><span>Gold Earned</span><span>{goldGained.toLocaleString()}</span></div>
          <div><span>Items Found</span><span>{itemsFound}</span></div>
        </div>
        <button className="modal-btn" onClick={dismissOfflineProgress}>Continue</button>
      </div>
    </div>
  );
}
