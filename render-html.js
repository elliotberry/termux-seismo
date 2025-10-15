
function renderHTML(samples, windowMs) {
  const w = 900,
    h = 220,
    pad = 10;
  const now = Date.now();
  const xs = samples.map(s => s.t);
  const ys = samples.map(s => s.a);
  const minT = now - windowMs;
  const maxA = Math.max(0.5, ...ys); // keep visible if flat
  const points = samples
    .map(s => {
      const x = pad + ((s.t - minT) / windowMs) * (w - 2 * pad);
      const y = pad + (1 - Math.min(s.a / maxA, 1)) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const latest = samples.at(-1);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Seismometer</title>
<style>
  body{font-family:ui-monospace,monospace;background:#0b0e11;color:#e5e7eb;margin:20px}
  .wrap{max-width:${w}px;margin:auto}
  .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
  .tag{background:#111827;border:1px solid #374151;border-radius:6px;padding:6px 10px}
  svg{width:100%;height:auto;background:#0f172a;border:1px solid #334155;border-radius:8px}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Seismometer</h1>
    <div class="row">
      <div class="tag">Window: ${(windowMs / 60000).toFixed(0)} min</div>
      <div class="tag">Samples: ${samples.length}</div>
      <div class="tag">Latest a: ${latest ? latest.a.toFixed(3) : '–'} m/s²</div>
      <div class="tag">Latest xyz: ${latest ? `${latest.x.toFixed(3)}, ${latest.y.toFixed(3)}, ${latest.z.toFixed(3)}` : '–'}</div>
      <div class="tag">Baseline g≈9.81 removed</div>
    </div>
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Seismometer trace">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#93c5fd" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#93c5fd" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <rect x="0" y="${h / 2}" width="${w}" height="1" fill="#1f2937"/>
      <polyline fill="none" stroke="#93c5fd" stroke-width="2" points="${points}"/>
    </svg>
  </div>
</body>
</html>`;
}
export default renderHTML;