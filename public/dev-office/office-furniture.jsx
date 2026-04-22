// office-furniture.jsx — Desk, Monitor, Chair, Plant

function IsoDesk({ gx, gy, gz=0, color='#6366f1' }) {
  const pol = isoBoxPolygons(gx, gy, gz, 2.0, 0.9, 0.45);
  const topTint = isoBoxPolygons(gx, gy, gz, 2.0, 0.9, 0.45);
  return React.createElement(React.Fragment, null,
    React.createElement('polygon', { points: pol.top,   fill: '#252340' }),
    React.createElement('polygon', { points: pol.left,  fill: '#191730' }),
    React.createElement('polygon', { points: pol.right, fill: '#131128' }),
    React.createElement('polygon', { points: topTint.top, fill: color, opacity: 0.12 }),
  );
}

function IsoMonitor({ gx, gy, gz=0.45, color='#6366f1' }) {
  const mx = gx + 0.3, my = gy + 0.15, mw = 1.3, md = 0.08, mh = 0.95;
  const body = isoBoxPolygons(mx, my, gz, mw, md, mh);
  // screen face (front-left side of monitor)
  const p = (x, y, z) => [(x-y)*(TILE_W/2), (x+y)*(TILE_H/2) - z*TILE_Z];
  const scr = [
    p(mx, my+md, gz+0.08), p(mx+mw, my+md, gz+0.08),
    p(mx+mw, my+md, gz+mh-0.08), p(mx, my+md, gz+mh-0.08),
  ].map(v => v.join(',')).join(' ');
  // screen content lines
  const lineY = (frac) => {
    const t = gz + 0.15 + frac * (mh - 0.25);
    const lx1 = p(mx+0.15, my+md, t);
    const lx2 = p(mx+mw-0.2, my+md, t);
    return `${lx1.join(',')} ${lx2.join(',')}`;
  };
  return React.createElement(React.Fragment, null,
    React.createElement('polygon', { points: body.top,   fill: '#18162e' }),
    React.createElement('polygon', { points: body.left,  fill: '#0c0a1e' }),
    React.createElement('polygon', { points: body.right, fill: '#0e0c22' }),
    React.createElement('polygon', { points: scr, fill: color, opacity: 0.22 }),
    React.createElement('polygon', { points: scr, fill: 'none', stroke: color, strokeWidth: 0.8, opacity: 0.7 }),
    ...[0.15, 0.35, 0.55, 0.72].map((f, i) =>
      React.createElement('polyline', {
        key: i, points: lineY(f),
        fill: 'none', stroke: color, strokeWidth: 0.7, opacity: 0.4 + i * 0.05,
        strokeLinecap: 'round',
      })
    ),
  );
}

function IsoChair({ gx, gy, gz=0, color='#2d2b40' }) {
  // seat
  const seat = isoBoxPolygons(gx, gy, gz, 0.85, 0.85, 0.38);
  // back
  const back = isoBoxPolygons(gx, gy, gz+0.38, 0.85, 0.12, 0.72);
  return React.createElement(React.Fragment, null,
    React.createElement('polygon', { points: seat.top,   fill: '#2d2b40' }),
    React.createElement('polygon', { points: seat.left,  fill: '#1e1c30' }),
    React.createElement('polygon', { points: seat.right, fill: '#191830' }),
    React.createElement('polygon', { points: back.top,   fill: '#252340' }),
    React.createElement('polygon', { points: back.left,  fill: '#191730' }),
    React.createElement('polygon', { points: back.right, fill: '#131128' }),
  );
}

function IsoPlant({ gx, gy, gz=0 }) {
  // pot
  const pot = isoBoxPolygons(gx, gy, gz, 0.5, 0.5, 0.5);
  const pos = isoPos(gx+0.25, gy+0.25, gz+1.1);
  return React.createElement(React.Fragment, null,
    React.createElement('polygon', { points: pot.top,   fill: '#4a3728' }),
    React.createElement('polygon', { points: pot.left,  fill: '#2d2218' }),
    React.createElement('polygon', { points: pot.right, fill: '#231a12' }),
    React.createElement('circle', { cx: pos.x, cy: pos.y,     r: 10, fill: '#166534', opacity: 0.85 }),
    React.createElement('circle', { cx: pos.x-7, cy: pos.y+4, r:  7, fill: '#15803d', opacity: 0.7  }),
    React.createElement('circle', { cx: pos.x+7, cy: pos.y+4, r:  7, fill: '#16a34a', opacity: 0.7  }),
    React.createElement('circle', { cx: pos.x,   cy: pos.y-5, r:  6, fill: '#22c55e', opacity: 0.5  }),
  );
}

Object.assign(window, { IsoDesk, IsoMonitor, IsoChair, IsoPlant });
