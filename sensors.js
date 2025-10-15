import { spawn } from 'node:child_process';

const INTERVAL_MS = Number(process.env.SAMPLE_INTERVAL_MS || 200);

// Reads one accelerometer sample via termux-api (JSON lines)
async function readAccelOnce() {
  return new Promise((resolve, reject) => {
    const proc = spawn('termux-sensor', ['-n', '1', '-s', 'accelerometer'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(err || `termux-sensor exited ${code}`));
      try {
        // Output is newline-delimited JSON objects; grab last non-empty
        const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
        const obj = JSON.parse(lines.at(-1));
        // Expected shape: { "accelerometer": { "values": [x,y,z], "timestamp": ... } }
        const acc = obj.accelerometer || obj;
        const [x, y, z] = acc.values || [0, 0, 0];
        const t = Date.now();
        const g = Math.sqrt(x*x + y*y + z*z);        // includes gravity
        const a = Math.max(0, Math.abs(g - 9.81));   // simple gravity removal
        resolve({ t, x, y, z, g, a });
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function startSensorLoop(onSample) {
  // quick availability check
  const avail = spawn('sh', ['-lc', 'command -v termux-sensor >/dev/null 2>&1']);
  avail.on('close', (code) => {
    if (code !== 0) {
      console.error('termux-sensor not found. Install Termux:API app and termux-api pkg.');
    }
  });

  let timer = null;
  const tick = async () => {
    try {
      const s = await readAccelOnce();
      await onSample(s);
    } catch (e) {
      // Avoid console spam; one-liner log
      console.error('sensor read error:', e.message);
    } finally {
      timer = setTimeout(tick, INTERVAL_MS);
      timer.unref();
    }
  };

  tick();

  const stop = () => { if (timer) clearTimeout(timer); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}