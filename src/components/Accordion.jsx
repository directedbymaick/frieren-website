import { useId, useState } from 'react';

export function Accordion({ title, children, id }) {
  const unique = useId();
  const [open, setOpen] = useState(false);
  const panelId = `${unique}-panel`;
  return <div id={id} className="t-acc project-accordion" data-open={String(open)}>
    <button id={`${unique}-heading`} type="button" className="t-acc-head" aria-expanded={open} aria-controls={panelId} data-haptic="selection" onClick={() => setOpen(value => !value)}>
      <span className="t-acc-chevron" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6L8 10L12 6" /></svg></span>
      {title}
    </button>
    <div id={panelId} className="t-acc-panel" role="region" aria-labelledby={`${unique}-heading`} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="t-acc-panel-inner">{children}</div>
    </div>
  </div>;
}
