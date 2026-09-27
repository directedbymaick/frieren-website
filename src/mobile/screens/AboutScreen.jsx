import { MobileScreenShell } from '../MobileScreenShell';
import { ProjectNotes } from '../../components/ProjectNotes';

export function AboutScreen() {
  return <MobileScreenShell title="About">
    <div className="mobile-editorial">
      <p className="editorial-eyebrow">Epilogue · a fan concept</p>
      <h2 className="font-serif">And so the road bends <em>forward.</em></h2>
      <p className="editorial-intro font-serif">Some chapters do not end — they simply walk on, unhurried, carrying the names of those they cannot quite forget.</p>
      <div className="editorial-studio">
        <span className="editorial-eyebrow">Crafted at</span>
        <h3 className="font-serif">Mad Makers</h3>
        <p>An independent exploration of memory, friendship and the passage of time, through design and motion.</p>
        <a href="https://mad-makers.fr" target="_blank" rel="noopener noreferrer">Visit the studio ↗</a>
      </div>
      <ProjectNotes />
    </div>
  </MobileScreenShell>;
}
