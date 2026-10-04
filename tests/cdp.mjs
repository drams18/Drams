/* Mini pilote Chrome (DevTools Protocol), sans dépendance : Chrome headless
   + WebSocket natif de Node. Sert aux tests navigateur du mode aventure. */
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function launch({ width = 1280, height = 800, mobile = false, touch = false, dpr = 1 } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'cdp-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  // GPU=1 : garde l'accélération matérielle (mesures de performance).
  const proc = spawn(CHROME, ['--headless=new', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=metal'] : ['--disable-gpu']), '--mute-audio', '--no-first-run', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });

  let target;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(150);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch (e) { /* pas encore prêt */ }
  }
  if (!target) { proc.kill(); throw new Error('Chrome ne répond pas'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const errors = [];
  const logs = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && d.exception.description) || d.text);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ');
      (msg.params.type === 'error' ? errors : logs).push(text);
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    pending.set(++id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const KEYS = { ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Space: 32, Enter: 13, Escape: 27, KeyP: 80, KeyD: 68, KeyA: 65, Tab: 9 };
  // Entrée et Espace portent un caractère : sans lui, un bouton focalisé n'est pas activé.
  const TEXT = { Enter: '\r', Space: ' ' };
  const keyEvent = (type, code) => send('Input.dispatchKeyEvent', {
    type: type === 'rawKeyDown' && TEXT[code] ? 'keyDown' : type, code,
    key: code === 'Space' ? ' ' : code.startsWith('Key') ? code.slice(3).toLowerCase() : code,
    text: type === 'rawKeyDown' ? TEXT[code] : undefined,
    windowsVirtualKeyCode: KEYS[code], nativeVirtualKeyCode: KEYS[code],
  });

  const page = {
    errors, logs, send, sleep,
    async goto(url, wait = 700) { await send('Page.navigate', { url }); await sleep(wait); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    down: (code) => keyEvent('rawKeyDown', code),
    up: (code) => keyEvent('keyUp', code),
    async press(code, hold = 60) { await keyEvent('rawKeyDown', code); await sleep(hold); await keyEvent('keyUp', code); },
    async click(selector) {
      const box = await page.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      if (!box) throw new Error('Introuvable : ' + selector);
      await page.clickAt(box.x, box.y);
    },
    async clickAt(x, y) {
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    async swipe(x1, y1, x2, y2) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: (x1 + x2) / 2, y: (y1 + y2) / 2, button: 'left' });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
    },
    async shot(file) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(file, Buffer.from(r.data, 'base64'));
    },
    setViewport: (w, h, o = {}) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: o.dpr || 1, mobile: !!o.mobile }),
    reducedMotion: (on) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] }),
    async close() { ws.close(); proc.kill(); await sleep(200); await rm(dir, { recursive: true, force: true }).catch(() => {}); },
  };
  return page;
}
