// office-npcs.jsx — IsoNPC, RoomLabel

function IsoNPC({ gx, gy, gz=0, color, name, selected, usagePill, onClick }) {
  const pos = isoPos(gx, gy, gz);
  const sx = pos.x, sy = pos.y;

  const bodyH = 22, bodyW = 15, headR = 9;
  const headCy = sy - bodyH - headR + 1;

  return React.createElement('g', {
    onClick,
    style: { cursor: 'pointer', transformOrigin: `${sx}px ${sy}px` },
    className: 'npc-breathing',
  },
    // shadow
    React.createElement('ellipse', { cx: sx, cy: sy+3, rx: 12, ry: 5, fill: '#000', opacity: 0.28 }),

    // selected ring
    selected && React.createElement('circle', {
      cx: sx, cy: sy - bodyH/2 - 2, r: 23,
      fill: 'none', stroke: color, strokeWidth: 2, opacity: 0.5,
      className: 'npc-ring',
    }),

    // body capsule
    React.createElement('rect', {
      x: sx - bodyW/2, y: sy - bodyH,
      width: bodyW, height: bodyH, rx: bodyW/2,
      fill: color, opacity: 0.92,
    }),
    // body shading
    React.createElement('rect', {
      x: sx - bodyW/2, y: sy - bodyH,
      width: bodyW/2, height: bodyH, rx: bodyW/2,
      fill: 'rgba(0,0,0,0.18)',
    }),

    // head
    React.createElement('circle', { cx: sx, cy: headCy, r: headR, fill: color }),
    // head highlight
    React.createElement('circle', { cx: sx-3, cy: headCy-3, r: 3.5, fill: 'rgba(255,255,255,0.15)' }),
    // eyes
    React.createElement('circle', { cx: sx-3, cy: headCy-0.5, r: 1.5, fill: '#08080f' }),
    React.createElement('circle', { cx: sx+3, cy: headCy-0.5, r: 1.5, fill: '#08080f' }),

    // usage pill
    React.createElement('g', { className: 'pill-float' },
      React.createElement('rect', {
        x: sx-20, y: headCy - headR - 20,
        width: 40, height: 14, rx: 7,
        fill: '#0d0b18', stroke: color, strokeWidth: 1,
      }),
      React.createElement('text', {
        x: sx, y: headCy - headR - 10,
        textAnchor: 'middle', fill: color,
        fontSize: 8.5, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700,
      }, usagePill),
    ),

    // name tag
    React.createElement('text', {
      x: sx, y: sy + 14,
      textAnchor: 'middle', fill: color,
      fontSize: 7.5, fontFamily: 'IBM Plex Mono, monospace', opacity: 0.75,
    }, name),
  );
}

function RoomLabel({ gx, gy, gz=3.2, text, color }) {
  const pos = isoPos(gx, gy, gz);
  const sx = pos.x, sy = pos.y;
  const W = text.length * 6.5 + 18;

  return React.createElement('g', {},
    // plate
    React.createElement('rect', {
      x: sx - W/2, y: sy - 10, width: W, height: 16, rx: 3,
      fill: '#0a0818', stroke: color, strokeWidth: 0.7, opacity: 0.92,
    }),
    // text
    React.createElement('text', {
      x: sx, y: sy + 3.5,
      textAnchor: 'middle', fill: color,
      fontSize: 7.5, fontFamily: 'IBM Plex Mono, monospace',
      fontWeight: 700, letterSpacing: 1.2,
    }, text.toUpperCase()),
    // hanging wire
    React.createElement('line', {
      x1: sx, y1: sy + 6, x2: sx, y2: sy + 22,
      stroke: color, strokeWidth: 0.6, opacity: 0.3,
      strokeDasharray: '2 2',
    }),
  );
}

Object.assign(window, { IsoNPC, RoomLabel });
