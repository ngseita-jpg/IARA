'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEPTS, calcXP, getLevel, LEVEL_NAMES, type Dept, type Accessory } from './_data'

// ─── World constants ──────────────────────────────────────────────────────────
const ROOM_W = 310
const ROOM_H = 210
const GAP = 60
const WORLD_W = GAP + 3 * (ROOM_W + GAP)   // 1170
const WORLD_H = GAP + 3 * (ROOM_H + GAP)   // 870
const PLAYER_SPEED = 4
const INTERACT_RADIUS = 90

function roomPos(col: number, row: number) {
  return { x: GAP + col * (ROOM_W + GAP), y: GAP + row * (ROOM_H + GAP) }
}
function npcPos(col: number, row: number) {
  const r = roomPos(col, row)
  return { x: r.x + ROOM_W / 2, y: r.y + ROOM_H / 2 + 10 }
}

// ─── NPC SVG ─────────────────────────────────────────────────────────────────
function NpcSvg({ accessory, color, lit }: { accessory: Accessory; color: string; lit: boolean }) {
  return (
    <svg width="34" height="56" viewBox="0 0 34 56" fill="none" style={{ overflow: 'visible' }}>
      {/* Glow ring when nearby */}
      {lit && <circle cx="17" cy="13" r="14" fill={color} opacity="0.15" />}
      {/* Body */}
      <rect x="10" y="22" width="14" height="22" rx="7" fill={color} />
      {/* Head */}
      <circle cx="17" cy="13" r="11" fill={color} />
      {/* Eyes */}
      {accessory === 'antenna' ? (
        <>
          <circle cx="13" cy="13" r="2.2" fill="#ef4444" />
          <circle cx="21" cy="13" r="2.2" fill="#ef4444" />
          <circle cx="13" cy="13" r="0.8" fill="#fff" />
          <circle cx="21" cy="13" r="0.8" fill="#fff" />
        </>
      ) : (
        <>
          <circle cx="13" cy="13" r="2" fill="#08080f" />
          <circle cx="21" cy="13" r="2" fill="#08080f" />
        </>
      )}
      {/* Smile */}
      <path d="M13 18 Q17 21 21 18" stroke="#08080f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* ── Accessories ── */}
      {accessory === 'bow' && (
        <>
          <path d="M11 3 L17 7 L11 11 Z" fill={color} opacity="0.75" />
          <path d="M23 3 L17 7 L23 11 Z" fill={color} opacity="0.75" />
          <circle cx="17" cy="7" r="2.5" fill="white" opacity="0.6" />
        </>
      )}
      {accessory === 'glasses' && (
        <>
          <rect x="8" y="11" width="7" height="4.5" rx="2" fill="none" stroke="#00e5ff" strokeWidth="1.3" />
          <rect x="19" y="11" width="7" height="4.5" rx="2" fill="none" stroke="#00e5ff" strokeWidth="1.3" />
          <line x1="15" y1="13.5" x2="19" y2="13.5" stroke="#00e5ff" strokeWidth="0.9" />
          <line x1="6" y1="13.5" x2="8" y2="13.5" stroke="#00e5ff" strokeWidth="0.9" />
          <line x1="26" y1="13.5" x2="28" y2="13.5" stroke="#00e5ff" strokeWidth="0.9" />
        </>
      )}
      {accessory === 'tablet' && (
        <>
          <rect x="27" y="22" width="9" height="13" rx="2" fill="#1a1a2e" stroke={color} strokeWidth="1.2" />
          <rect x="28.5" y="23.5" width="6" height="10" rx="1" fill={color} opacity="0.25" />
          <line x1="30" y1="26" x2="34" y2="26" stroke={color} strokeWidth="0.7" opacity="0.9" />
          <line x1="30" y1="28.5" x2="34" y2="28.5" stroke={color} strokeWidth="0.7" opacity="0.9" />
          <line x1="30" y1="31" x2="33" y2="31" stroke={color} strokeWidth="0.7" opacity="0.9" />
        </>
      )}
      {accessory === 'coffee' && (
        <>
          <rect x="27" y="26" width="9" height="10" rx="1.5" fill="#5d4037" />
          <path d="M36 29 Q39 29 39 32 Q39 35 36 35" fill="none" stroke="#795548" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M29 26 Q29 22 31 22 Q33 22 33 26" fill="none" stroke="#9e9e9e" strokeWidth="0.9" opacity="0.5" />
          <path d="M31 26 Q31 23 33 23 Q35 23 35 26" fill="none" stroke="#9e9e9e" strokeWidth="0.9" opacity="0.35" />
        </>
      )}
      {accessory === 'antenna' && (
        <>
          <line x1="17" y1="2" x2="17" y2="-5" stroke="#374151" strokeWidth="2" />
          <circle cx="17" cy="-7" r="3" fill="#ef4444" />
          <circle cx="17" cy="-7" r="1.2" fill="#fff" opacity="0.6" />
        </>
      )}
      {accessory === 'headphones' && (
        <>
          <path d="M6 13 Q6 1 17 1 Q28 1 28 13" fill="none" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
          <rect x="4" y="11" width="5" height="8" rx="2.5" fill="#374151" />
          <rect x="25" y="11" width="5" height="8" rx="2.5" fill="#374151" />
          <rect x="4.5" y="12" width="4" height="6" rx="2" fill={color} opacity="0.5" />
          <rect x="25.5" y="12" width="4" height="6" rx="2" fill={color} opacity="0.5" />
        </>
      )}
      {accessory === 'clipboard' && (
        <>
          <rect x="27" y="20" width="10" height="14" rx="1.5" fill="#1a1a2e" stroke={color} strokeWidth="1" />
          <rect x="29.5" y="18" width="5" height="4" rx="1" fill={color} opacity="0.7" />
          <line x1="29.5" y1="25" x2="35" y2="25" stroke={color} strokeWidth="1" opacity="0.7" />
          <line x1="29.5" y1="27.5" x2="35" y2="27.5" stroke={color} strokeWidth="1" opacity="0.7" />
          <line x1="29.5" y1="30" x2="33" y2="30" stroke={color} strokeWidth="1" opacity="0.7" />
        </>
      )}
      {accessory === 'chart' && (
        <>
          <circle cx="29" cy="28" r="7.5" fill="#1a1a2e" stroke={color} strokeWidth="1" />
          <path d="M29 28 L29 20.5 A7.5 7.5 0 0 1 35.5 31.5 Z" fill={color} opacity="0.85" />
          <path d="M29 28 L35.5 31.5 A7.5 7.5 0 0 1 22.5 31.5 Z" fill={color} opacity="0.5" />
          <path d="M29 28 L22.5 31.5 A7.5 7.5 0 0 1 29 20.5 Z" fill={color} opacity="0.25" />
        </>
      )}
    </svg>
  )
}

// ─── Player SVG ───────────────────────────────────────────────────────────────
function PlayerSvg({ facing }: { facing: 'left' | 'right' }) {
  return (
    <svg width="28" height="48" viewBox="0 0 28 48" fill="none" style={{ transform: facing === 'left' ? 'scaleX(-1)' : 'none' }}>
      {/* Halo */}
      <ellipse cx="14" cy="4" rx="8" ry="2.5" fill="none" stroke="#6366f1" strokeWidth="1.8" opacity="0.8" />
      {/* Body */}
      <rect x="8" y="20" width="12" height="20" rx="6" fill="white" opacity="0.92" />
      {/* Head */}
      <circle cx="14" cy="13" r="9" fill="white" opacity="0.92" />
      {/* Eyes */}
      <circle cx="11" cy="13" r="1.5" fill="#08080f" />
      <circle cx="17" cy="13" r="1.5" fill="#08080f" />
      {/* Smile */}
      <path d="M11 17 Q14 20 17 17" stroke="#08080f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ─── Monitor animation ────────────────────────────────────────────────────────
function Monitor({ color }: { color: string }) {
  const lines = ['██ ▌▌ ██', '▌▌ ██ ▌▌', '██ ▌▌ ▌▌']
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 3), 1200)
    return () => clearInterval(t)
  }, [])
  return (
    <div
      className="absolute rounded-sm border flex items-center justify-center"
      style={{ width: 64, height: 44, background: '#08080f', borderColor: color + '60', boxShadow: `0 0 8px ${color}30`, bottom: 36, left: '50%', transform: 'translateX(-50%)' }}
    >
      <div className="text-[5px] leading-[7px] font-mono" style={{ color: color + 'cc' }}>
        {lines[frame].split('\n').map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

// ─── XP bar color ─────────────────────────────────────────────────────────────
function xpColor(xp: number): string {
  if (xp >= 80) return '#10b981'
  if (xp >= 65) return '#06b6d4'
  if (xp >= 45) return '#f59e0b'
  if (xp >= 25) return '#f97316'
  return '#ef4444'
}

// ─── Dev Panel ────────────────────────────────────────────────────────────────
function DevPanel({ dept, onClose, note, onNoteChange }: {
  dept: Dept
  onClose: () => void
  note: string
  onNoteChange: (v: string) => void
}) {
  const xp = calcXP(dept)
  const level = getLevel(xp)
  const doneTasks = dept.tasks.filter(t => t.done).length
  const color = dept.npc.color

  return (
    <motion.div
      key={dept.id}
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="absolute right-0 top-0 h-full w-[390px] flex flex-col overflow-hidden z-30"
      style={{ background: '#0f0f1e', borderLeft: `1px solid ${color}30` }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b" style={{ borderColor: color + '20' }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18', border: `1px solid ${color}40` }}>
          <NpcSvg accessory={dept.npc.accessory} color={color} lit={false} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-base">{dept.npc.name}</div>
          <div className="text-xs opacity-50 truncate">{dept.npc.role}</div>
          <div className="text-xs mt-0.5 font-medium" style={{ color }}>{dept.emoji} {dept.name}</div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg opacity-40 hover:opacity-80 transition-opacity text-white text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* XP */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color }}>NÍVEL {level + 1} — {LEVEL_NAMES[level]}</span>
            <span className="text-xs font-bold" style={{ color }}>{xp} XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
              initial={{ width: 0 }}
              animate={{ width: `${xp}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] opacity-30 text-white">
            {[0, 25, 45, 65, 80, 100].map(n => <span key={n}>{n}</span>)}
          </div>
          {/* XP breakdown */}
          <div className="mt-3 grid grid-cols-5 gap-1">
            {[
              { label: 'Tarefas', val: dept.xpBreakdown.tasks },
              { label: 'Bugs', val: Math.max(0, 100 - dept.xpBreakdown.bugs * 15) },
              { label: 'Build', val: dept.xpBreakdown.build },
              { label: 'Cobertura', val: dept.xpBreakdown.coverage },
              { label: 'Deploy', val: dept.xpBreakdown.deploy },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: xpColor(val) }} />
                </div>
                <span className="text-[8px] opacity-30 text-white text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bugs badge */}
        {dept.bugs > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#ef444418', border: '1px solid #ef444430' }}>
            <span className="text-red-400 text-sm">🐛</span>
            <span className="text-xs text-red-400 font-medium">{dept.bugs} bug{dept.bugs > 1 ? 's' : ''} aberto{dept.bugs > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Tasks */}
        <div>
          <div className="text-xs font-semibold opacity-50 text-white uppercase tracking-wide mb-2">
            Tarefas — {doneTasks}/{dept.tasks.length}
          </div>
          <div className="space-y-1.5">
            {dept.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: task.done ? color + '30' : '#ffffff0a', border: `1px solid ${task.done ? color : '#ffffff20'}` }}>
                  {task.done && <span style={{ color, fontSize: 9, lineHeight: 1 }}>✓</span>}
                </div>
                <span className="text-xs text-white" style={{ opacity: task.done ? 0.9 : 0.45, textDecoration: task.done ? 'none' : 'none' }}>{task.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Files */}
        <div>
          <div className="text-xs font-semibold opacity-50 text-white uppercase tracking-wide mb-2">Arquivos</div>
          <div className="space-y-1">
            {dept.files.map((file, i) => (
              <button
                key={i}
                onClick={() => navigator.clipboard.writeText(file.path)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                title="Clique para copiar o caminho"
              >
                <span className="text-xs flex-shrink-0" style={{
                  color: file.status === 'done' ? '#10b981' : file.status === 'wip' ? '#f59e0b' : '#ef4444'
                }}>
                  {file.status === 'done' ? '●' : file.status === 'wip' ? '◐' : '○'}
                </span>
                <span className="text-xs text-white/70 font-mono truncate group-hover:text-white/90 transition-colors">{file.name}</span>
                <span className="text-[9px] opacity-0 group-hover:opacity-40 transition-opacity text-white flex-shrink-0">copiar</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="text-xs font-semibold opacity-50 text-white uppercase tracking-wide mb-2">Notas rápidas</div>
          <textarea
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Digite suas notas aqui…"
            rows={4}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-xs text-white/80 placeholder:opacity-25 outline-none focus:ring-1 transition-all"
            style={{ background: '#ffffff08', border: `1px solid ${color}30`, caretColor: color }}
            onFocus={e => (e.target.style.borderColor = color + '70')}
            onBlur={e => (e.target.style.borderColor = color + '30')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: color + '20' }}>
        <button
          onClick={() => navigator.clipboard.writeText(`cd "c:/Users/ngsei/OneDrive/Área de Trabalho/IARA" && code .`)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          Abrir projeto no VS Code
        </button>
      </div>
    </motion.div>
  )
}

// ─── Minimap ──────────────────────────────────────────────────────────────────
function Minimap({ playerX, playerY, selected }: { playerX: number; playerY: number; selected: string | null }) {
  const scale = 0.12
  const W = Math.round(WORLD_W * scale)
  const H = Math.round(WORLD_H * scale)
  return (
    <div className="absolute bottom-4 left-4 rounded-xl overflow-hidden" style={{ width: W, height: H, background: '#0a0a18', border: '1px solid #ffffff10' }}>
      {DEPTS.map(d => {
        const rp = roomPos(...d.gridPos)
        const isSelected = selected === d.id
        return (
          <div key={d.id} className="absolute rounded-sm" style={{
            left: rp.x * scale, top: rp.y * scale,
            width: ROOM_W * scale, height: ROOM_H * scale,
            background: isSelected ? d.npc.color + '40' : '#13131f',
            border: `1px solid ${isSelected ? d.npc.color : '#ffffff10'}`,
          }} />
        )
      })}
      {/* Player dot */}
      <div className="absolute w-2 h-2 rounded-full bg-white" style={{
        left: playerX * scale - 4, top: playerY * scale - 4,
        boxShadow: '0 0 4px white',
      }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DevOfficePage() {
  const [playerPos, setPlayerPos] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 })
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const [selectedDept, setSelectedDept] = useState<Dept | null>(null)
  const [nearDept, setNearDept] = useState<Dept | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [viewport, setViewport] = useState({ w: 1200, h: 700 })

  const keysRef = useRef<Set<string>>(new Set())
  const nearDeptRef = useRef<Dept | null>(null)
  const loopRef = useRef<number>()

  // Load notes from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('iara-dev-office-notes') || '{}')
      setNotes(saved)
    } catch {}
  }, [])

  const saveNote = useCallback((id: string, val: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: val }
      localStorage.setItem('iara-dev-office-notes', JSON.stringify(next))
      return next
    })
  }, [])

  // Viewport
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Game loop + key handling
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if ((e.key === 'e' || e.key === 'E') && nearDeptRef.current) {
        setSelectedDept(nearDeptRef.current)
      }
      if (e.key === 'Escape') setSelectedDept(null)
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)

    const loop = () => {
      setPlayerPos(prev => {
        const k = keysRef.current
        let { x, y } = prev
        const s = PLAYER_SPEED
        if (k.has('arrowup') || k.has('w')) y -= s
        if (k.has('arrowdown') || k.has('s')) y += s
        if (k.has('arrowleft') || k.has('a')) { x -= s; setFacing('left') }
        if (k.has('arrowright') || k.has('d')) { x += s; setFacing('right') }
        return { x: Math.max(12, Math.min(WORLD_W - 12, x)), y: Math.max(12, Math.min(WORLD_H - 12, y)) }
      })
      loopRef.current = requestAnimationFrame(loop)
    }
    loopRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      if (loopRef.current) cancelAnimationFrame(loopRef.current)
    }
  }, [])

  // Proximity detection
  useEffect(() => {
    let closest: Dept | null = null
    let closestDist = Infinity
    for (const dept of DEPTS) {
      const np = npcPos(...dept.gridPos)
      const dist = Math.hypot(playerPos.x - np.x, playerPos.y - np.y)
      if (dist < INTERACT_RADIUS && dist < closestDist) { closest = dept; closestDist = dist }
    }
    setNearDept(closest)
    nearDeptRef.current = closest
  }, [playerPos])

  // Camera: clamp so player stays near center
  const camX = Math.max(0, Math.min(WORLD_W - viewport.w, playerPos.x - viewport.w / 2))
  const camY = Math.max(0, Math.min(WORLD_H - viewport.h, playerPos.y - viewport.h / 2))

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#08080f] relative select-none" tabIndex={0}>
      {/* World */}
      <div
        className="absolute"
        style={{ width: WORLD_W, height: WORLD_H, transform: `translate(${-camX}px, ${-camY}px)`, willChange: 'transform' }}
      >
        {/* Floor grid */}
        <svg className="absolute inset-0 pointer-events-none" width={WORLD_W} height={WORLD_H}>
          <defs>
            <pattern id="dot" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="0.8" fill="#1e1e38" />
            </pattern>
          </defs>
          <rect width={WORLD_W} height={WORLD_H} fill="url(#dot)" />
        </svg>

        {/* Rooms + NPCs */}
        {DEPTS.map(dept => {
          const rp = roomPos(...dept.gridPos)
          const np = npcPos(...dept.gridPos)
          const isNear = nearDept?.id === dept.id
          const isSelected = selectedDept?.id === dept.id
          const xp = calcXP(dept)

          return (
            <div key={dept.id}>
              {/* Room */}
              <div
                className="absolute rounded-2xl transition-all duration-300"
                style={{
                  left: rp.x, top: rp.y, width: ROOM_W, height: ROOM_H,
                  background: '#13131f',
                  border: `1px solid ${isNear || isSelected ? dept.npc.color + '80' : '#1e1e3a'}`,
                  boxShadow: isNear || isSelected ? `0 0 28px ${dept.npc.color}22` : 'none',
                }}
              >
                {/* Room name */}
                <div className="absolute top-3 left-4 flex items-center gap-1.5">
                  <span className="text-sm">{dept.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: dept.npc.color + 'cc' }}>{dept.name}</span>
                </div>

                {/* XP mini bar */}
                <div className="absolute top-3 right-4 flex items-center gap-1.5">
                  <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xp}%`, background: dept.npc.color + '99' }} />
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: dept.npc.color + '99' }}>{xp}%</span>
                </div>

                {/* Desk */}
                <div className="absolute rounded-full opacity-30" style={{ width: 90, height: 6, background: dept.npc.color, bottom: 20, left: '50%', transform: 'translateX(-50%)' }} />

                {/* Monitor */}
                <Monitor color={dept.npc.color} />
              </div>

              {/* NPC */}
              <motion.div
                className="absolute z-10 cursor-pointer"
                style={{ left: np.x - 17, top: np.y - 28 }}
                animate={{ y: isNear ? [0, -3, 0] : [0, -1.5, 0] }}
                transition={{ repeat: Infinity, duration: isNear ? 1.2 : 2.8, ease: 'easeInOut' }}
                onClick={() => setSelectedDept(dept)}
              >
                <NpcSvg accessory={dept.npc.accessory} color={dept.npc.color} lit={isNear} />

                {/* Name tag */}
                <div className="absolute text-[10px] font-semibold whitespace-nowrap"
                  style={{ color: dept.npc.color, bottom: -18, left: '50%', transform: 'translateX(-50%)' }}>
                  {dept.npc.name}
                </div>

                {/* Press E bubble */}
                <AnimatePresence>
                  {isNear && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: 6 }}
                      transition={{ type: 'spring', damping: 18 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap px-2 py-1 rounded-full text-white font-bold shadow-lg"
                      style={{ background: dept.npc.color }}
                    >
                      Pressione E
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )
        })}

        {/* Player character */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: playerPos.x - 14, top: playerPos.y - 24, transition: 'left 0.016s linear, top 0.016s linear' }}
        >
          <PlayerSvg facing={facing} />
          <div className="absolute text-[9px] font-bold text-white/70 whitespace-nowrap" style={{ bottom: -16, left: '50%', transform: 'translateX(-50%)' }}>
            Você
          </div>
        </div>
      </div>

      {/* HUD — top left */}
      <div className="absolute top-4 left-4 z-20 text-white/50 bg-black/50 rounded-xl px-4 py-3 backdrop-blur-md text-xs space-y-0.5 border border-white/5">
        <div className="font-bold text-white/80 text-sm mb-1">IARA Dev Office</div>
        <div>WASD / ← → ↑ ↓ mover</div>
        <div>E ou clique no NPC → abre painel</div>
        <div>ESC → fecha</div>
      </div>

      {/* HUD — top center: global XP */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/50 rounded-xl px-5 py-2.5 backdrop-blur-md border border-white/5">
        {(() => {
          const total = Math.round(DEPTS.reduce((sum, d) => sum + calcXP(d), 0) / DEPTS.length)
          return (
            <>
              <span className="text-xs text-white/50">Progresso geral</span>
              <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${total}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: '#a855f7' }}>{total}%</span>
            </>
          )
        })()}
      </div>

      {/* Minimap */}
      <Minimap playerX={playerPos.x} playerY={playerPos.y} selected={selectedDept?.id ?? null} />

      {/* Dev Panel */}
      <AnimatePresence>
        {selectedDept && (
          <DevPanel
            dept={selectedDept}
            onClose={() => setSelectedDept(null)}
            note={notes[selectedDept.id] ?? ''}
            onNoteChange={v => saveNote(selectedDept.id, v)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
