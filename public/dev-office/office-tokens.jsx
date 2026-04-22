// office-tokens.jsx — ISO math + primitives

const TILE_W = 80;
const TILE_H = 40;
const TILE_Z = 28;

function isoPos(gx, gy, gz = 0) {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2) - gz * TILE_Z,
  };
}

function isoBoxPolygons(gx, gy, gz, gw, gd, gh) {
  const p = (x, y, z) => [(x - y) * (TILE_W / 2), (x + y) * (TILE_H / 2) - z * TILE_Z];
  const str = (pts) => pts.map(v => v.join(',')).join(' ');
  return {
    top: str([p(gx, gy, gz+gh), p(gx+gw, gy, gz+gh), p(gx+gw, gy+gd, gz+gh), p(gx, gy+gd, gz+gh)]),
    left: str([p(gx, gy+gd, gz), p(gx+gw, gy+gd, gz), p(gx+gw, gy+gd, gz+gh), p(gx, gy+gd, gz+gh)]),
    right: str([p(gx+gw, gy, gz), p(gx+gw, gy+gd, gz), p(gx+gw, gy+gd, gz+gh), p(gx+gw, gy, gz+gh)]),
  };
}

function IsoBox({ gx, gy, gz=0, gw=1, gd=1, gh=1, topColor, leftColor, rightColor, topOpacity=1 }) {
  const pol = isoBoxPolygons(gx, gy, gz, gw, gd, gh);
  return React.createElement(React.Fragment, null,
    React.createElement('polygon', { points: pol.top,   fill: topColor   || '#2a2840', opacity: topOpacity }),
    React.createElement('polygon', { points: pol.left,  fill: leftColor  || '#1a1825' }),
    React.createElement('polygon', { points: pol.right, fill: rightColor || '#13111e' }),
  );
}

function IsoTile({ gx, gy, fill, stroke, strokeOpacity=0.08 }) {
  const pos = isoPos(gx, gy, 0);
  const pts = [
    `${pos.x},${pos.y - TILE_H/2}`, `${pos.x + TILE_W/2},${pos.y}`,
    `${pos.x},${pos.y + TILE_H/2}`, `${pos.x - TILE_W/2},${pos.y}`,
  ].join(' ');
  return React.createElement('polygon', {
    points: pts, fill: fill || '#1a1825',
    stroke: stroke || `rgba(168,85,247,${strokeOpacity})`, strokeWidth: 0.5,
  });
}

Object.assign(window, { TILE_W, TILE_H, TILE_Z, isoPos, isoBoxPolygons, IsoBox, IsoTile });
