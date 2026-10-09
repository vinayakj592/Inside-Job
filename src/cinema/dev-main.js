// Isolated dev entry for the cinema lab: /src/cinema/dev.html?dev=gallery|portraits|transition|script
// Loads only the shared styles + cinema modules, so it keeps working while other screens are mid-edit.
import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/ui.css';
import './cinema.css';
import { mountDev } from './dev.js';

const q = new URLSearchParams(location.search);
const stage = document.getElementById('stage');
const root = document.createElement('section');
root.className = 'screen scr-cinema';
stage.append(root);
await document.fonts?.ready;
mountDev(root, q.get('dev') || 'gallery', q);
