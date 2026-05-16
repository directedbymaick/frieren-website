import { MobileScreenShell } from '../MobileScreenShell';

export function AboutScreen() {
  return (
    <MobileScreenShell title="About">
      <div className="mobile-screen__placeholder">
        <span className="mobile-screen__placeholder-label">About</span>
        <span className="mobile-screen__placeholder-hint">
          Epilogue text · Mad Makers credits · fan-concept disclaimer.
        </span>
      </div>
    </MobileScreenShell>
  );
}
