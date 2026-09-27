import { PROJECT_NOTES } from '../data/project';
import { HapticsToggle } from '../lib/haptics';
import { Accordion } from './Accordion';

export function ProjectNotes() {
  return <div className="project-notes">
    {PROJECT_NOTES.map(note => <Accordion id={`project-${note.id}`} key={note.id} title={note.title}>
      <p>{note.body}</p>
    </Accordion>)}
    <div className="feedback-settings"><HapticsToggle /></div>
  </div>;
}
