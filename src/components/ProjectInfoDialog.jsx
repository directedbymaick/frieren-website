import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../hooks/useModal';
import { useTransitionPresence } from '../hooks/useTransitionPresence';
import { HapticsToggle } from '../lib/haptics';
import { Close } from '../icons';

export function ProjectInfoDialog({ note, onClose }) {
  const ref = useRef(null);
  const previousNote = useRef(note);
  if (note) previousNote.current = note;
  const content = note || previousNote.current;
  const { present, phase } = useTransitionPresence(Boolean(note));
  useModal(present, ref);
  useEffect(() => {
    if (!note) return;
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [note, onClose]);
  if (!present || !content) return null;
  return createPortal(<div className={`project-dialog-backdrop ${phase}`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} className={`project-dialog t-modal ${phase}`} role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" tabIndex={-1}>
      <button type="button" className="portrait-close" onClick={onClose} aria-label="Close project information"><Close className="w-5 h-5" /></button>
      <span className="editorial-eyebrow">Mad Makers · Frieren concept</span>
      <h2 id="project-dialog-title" className="font-serif">{content.title}</h2>
      <p>{content.body}</p>
      {content.id === 'accessibility' && <div className="feedback-settings"><HapticsToggle /></div>}
      <a href="https://mad-makers.fr" target="_blank" rel="noopener noreferrer">Visit Mad Makers ↗</a>
    </section>
  </div>, document.body);
}
