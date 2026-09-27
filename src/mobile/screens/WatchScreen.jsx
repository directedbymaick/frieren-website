import { MobileScreenShell } from '../MobileScreenShell';

export function WatchScreen() {
  return <MobileScreenShell title="Watch">
    <div className="mobile-editorial">
      <p className="editorial-eyebrow">A moment on the road</p>
      <h2 className="font-serif">Let the journey <em>unfold.</em></h2>
      <article className="mobile-watch-card">
        <video controls playsInline preload="none" poster="/assets/images/posters/opening.webp" aria-label="Opening II — Haru yo, Koi">
          <source src="/assets/videos/opening-v2.mp4" type="video/mp4" />
          Your browser cannot play this video.
        </video>
        <h3 className="font-serif">Opening II</h3>
        <p>Haru yo, Koi · an opening to another chapter.</p>
      </article>
      <article className="mobile-watch-card">
        <video controls playsInline preload="none" poster="/assets/images/posters/memory.webp" aria-label="The long memory — a cinematic interlude">
          <source src="/assets/videos/video-scroll-scrub.mp4" type="video/mp4" />
          Your browser cannot play this video.
        </video>
        <h3 className="font-serif">The long memory</h3>
        <p>A quiet interlude. Take it at your own pace.</p>
      </article>
      <a className="mobile-cta mobile-cta--primary" href="https://www.netflix.com/fr/title/81726714" target="_blank" rel="noopener noreferrer">Watch the series on Netflix ↗</a>
    </div>
  </MobileScreenShell>;
}
