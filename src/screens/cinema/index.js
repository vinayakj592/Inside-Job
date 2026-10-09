// CINEMA screen: plays a comic script (prologue, briefings, replays, story beats, epilogue, credits).
// params: { script: Page[], next: { screen, params }, skippable?: true }
// dev:    { devJob, devScript: 'briefing'|'success'|'failure'|'after'|'prologue'|'epilogue' }
//         ?dev=gallery|portraits|transition in the URL mounts a dev harness instead.
import '../../cinema/cinema.css';
import { go } from '../../core/router.js';
import { ambience, duck } from '../../core/audio.js';
import { JOBS, PROLOGUE, EPILOGUE } from '../../data/jobs.js';
import { ComicPlayer } from '../../cinema/engine.js';
import { removeInkCover, noirToBlueprint, inkOut } from '../../cinema/transition.js';

let player = null;
let credits = null;

function resolveScript(params) {
  if (params.script) return params.script;
  const which = params.devScript;
  if (which === 'prologue') return PROLOGUE;
  if (which === 'epilogue') return EPILOGUE;
  const job = JOBS.find((j) => j.id === params.devJob) || JOBS[0];
  if (!job) return [];
  if (which === 'success') return job.replay?.success || [];
  if (which === 'failure') return job.replay?.failure || [];
  if (which === 'after') return job.after || [];
  return job.briefing || [];
}

export default {
  id: 'cinema',
  async mount(root, params = {}) {
    const q = new URLSearchParams(location.search);
    const dev = q.get('dev');
    if (dev && !params.script && !params.credits) {
      const { mountDev } = await import('../../cinema/dev.js');
      removeInkCover();
      return mountDev(root, dev, q);
    }
    ambience('noir');
    const next = params.next || { screen: 'hub', params: {} };
    const finish = async () => {
      duck(1);
      if (next.screen === 'planning') {
        // failure replay: ink the screen, swap to the table, then let the blueprint bleed back through
        await inkOut();
        await go(next.screen, next.params || {}, { transition: 'none' });
        noirToBlueprint();
        return;
      }
      go(next.screen, next.params || {}, { transition: next.screen === 'cinema' ? 'none' : 'wipe' });
    };
    if (params.credits) {
      const { playCredits } = await import('../../cinema/credits.js');
      credits = playCredits(root, { onDone: finish });
      removeInkCover();
      return;
    }
    const script = resolveScript(params);
    if (!script || !script.length) {
      removeInkCover();
      finish();
      return;
    }
    player = new ComicPlayer(root, script, {
      skippable: params.skippable !== false,
      onFirstPage: () => removeInkCover(),
      onDone: finish,
    });
    player.start();
  },
  unmount() {
    player?.destroy();
    player = null;
    credits?.destroy?.();
    credits = null;
    duck(1);
  },
};
