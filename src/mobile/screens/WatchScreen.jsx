import { MobileScreenShell } from '../MobileScreenShell';

export function WatchScreen() {
  return (
    <MobileScreenShell title="Watch">
      <div className="mobile-screen__placeholder">
        <span className="mobile-screen__placeholder-label">Watch</span>
        <span className="mobile-screen__placeholder-hint">
          Opening II + the long memory cinematic.
        </span>
      </div>
    </MobileScreenShell>
  );
}
