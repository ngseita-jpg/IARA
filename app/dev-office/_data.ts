export type Accessory = 'bow' | 'glasses' | 'tablet' | 'coffee' | 'antenna' | 'headphones' | 'clipboard' | 'chart'

export interface Task { label: string; done: boolean }
export interface DeptFile { name: string; path: string; status: 'done' | 'wip' | 'todo' }

export interface Dept {
  id: string
  name: string
  emoji: string
  npc: { name: string; role: string; color: string; accessory: Accessory }
  gridPos: [number, number] // [col, row] 0-indexed in 3×3 grid
  files: DeptFile[]
  tasks: Task[]
  xpBreakdown: { tasks: number; bugs: number; build: number; coverage: number; deploy: number }
  bugs: number
  notes: string
}

export function calcXP(dept: Dept): number {
  const b = dept.xpBreakdown
  const bugPenalty = Math.min(b.bugs * 15, 70)
  return Math.round(
    b.tasks * 0.40 +
    (100 - bugPenalty) * 0.15 +
    b.build * 0.20 +
    b.coverage * 0.15 +
    b.deploy * 0.10
  )
}

export const LEVEL_NAMES = ['Rascunho', 'Em Campo', 'Em Ritmo', 'Polindo', 'Shipping 🚀']

export function getLevel(xp: number): number {
  if (xp < 25) return 0
  if (xp < 45) return 1
  if (xp < 65) return 2
  if (xp < 80) return 3
  return 4
}

export const DEPTS: Dept[] = [
  {
    id: 'reception',
    name: 'Recepção',
    emoji: '⭐',
    npc: { name: 'Iara', role: 'Assistente Principal', color: '#a855f7', accessory: 'tablet' },
    gridPos: [0, 0],
    files: [
      { name: 'app/page.tsx', path: 'app/page.tsx', status: 'done' },
      { name: 'app/layout.tsx', path: 'app/layout.tsx', status: 'done' },
      { name: 'CLAUDE.md', path: 'CLAUDE.md', status: 'done' },
    ],
    tasks: [
      { label: 'Home page publicada', done: true },
      { label: 'Logo 4 pontas integrado', done: true },
      { label: 'Auth flow completo', done: true },
      { label: 'Middleware de proteção ativo', done: true },
    ],
    xpBreakdown: { tasks: 100, bugs: 0, build: 100, coverage: 40, deploy: 100 },
    bugs: 0,
    notes: '',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    emoji: '📣',
    npc: { name: 'Ana', role: 'Diretora de Copy', color: '#ec4899', accessory: 'bow' },
    gridPos: [1, 0],
    files: [
      { name: 'app/page.tsx (landing)', path: 'app/page.tsx', status: 'done' },
      { name: 'app/marca/onboarding/page.tsx', path: 'app/marca/onboarding/page.tsx', status: 'wip' },
    ],
    tasks: [
      { label: 'Proposta de valor na home', done: true },
      { label: 'CTA para Stripe configurado', done: false },
      { label: 'Onboarding de marca revisado', done: false },
      { label: 'Copies de e-mail configuradas', done: true },
    ],
    xpBreakdown: { tasks: 50, bugs: 1, build: 100, coverage: 20, deploy: 100 },
    bugs: 1,
    notes: '',
  },
  {
    id: 'design',
    name: 'Design / UI',
    emoji: '🎨',
    npc: { name: 'Leo', role: 'UI Designer', color: '#06b6d4', accessory: 'glasses' },
    gridPos: [2, 0],
    files: [
      { name: 'tailwind.config.ts', path: 'tailwind.config.ts', status: 'done' },
      { name: 'app/globals.css', path: 'app/globals.css', status: 'done' },
    ],
    tasks: [
      { label: 'Dark mode em todos os módulos', done: true },
      { label: 'Componentes iara-card / gradients', done: true },
      { label: 'Responsividade mobile completa', done: false },
      { label: 'Loading states consistentes', done: true },
    ],
    xpBreakdown: { tasks: 75, bugs: 1, build: 100, coverage: 30, deploy: 100 },
    bugs: 1,
    notes: '',
  },
  {
    id: 'ia',
    name: 'IA & Prompts',
    emoji: '🤖',
    npc: { name: 'Zuri', role: 'Engenheira de IA', color: '#6366f1', accessory: 'tablet' },
    gridPos: [0, 1],
    files: [
      { name: 'app/api/carrossel/route.ts', path: 'app/api/carrossel/route.ts', status: 'done' },
      { name: 'app/api/roteiros/route.ts', path: 'app/api/roteiros/route.ts', status: 'done' },
      { name: 'app/api/ia/route.ts', path: 'app/api/ia/route.ts', status: 'done' },
    ],
    tasks: [
      { label: 'Todos os módulos com IA', done: true },
      { label: 'Prompt caching Anthropic ativo', done: false },
      { label: 'maxDuration=60 em rotas IA', done: true },
      { label: 'Rate limiting por plano', done: true },
    ],
    xpBreakdown: { tasks: 75, bugs: 0, build: 100, coverage: 40, deploy: 100 },
    bugs: 0,
    notes: '',
  },
  {
    id: 'backend',
    name: 'Backend',
    emoji: '⚙️',
    npc: { name: 'Rafa', role: 'Dev Backend', color: '#10b981', accessory: 'coffee' },
    gridPos: [1, 1],
    files: [
      { name: 'supabase_schema_completo.sql', path: 'supabase_schema_completo.sql', status: 'done' },
      { name: 'lib/checkLimite.ts', path: 'lib/checkLimite.ts', status: 'done' },
      { name: 'middleware.ts', path: 'middleware.ts', status: 'done' },
    ],
    tasks: [
      { label: 'Schema Supabase + RLS completos', done: true },
      { label: 'Auth + middleware de proteção', done: true },
      { label: 'Stripe webhooks', done: false },
      { label: 'Storage bucket configurado', done: true },
    ],
    xpBreakdown: { tasks: 75, bugs: 0, build: 100, coverage: 50, deploy: 100 },
    bugs: 0,
    notes: '',
  },
  {
    id: 'qa',
    name: 'QA / Debug',
    emoji: '🐛',
    npc: { name: 'Bot', role: 'QA Robô', color: '#ef4444', accessory: 'antenna' },
    gridPos: [2, 1],
    files: [
      { name: 'qa_robot.py', path: 'qa_robot.py', status: 'wip' },
      { name: 'qa_report/', path: 'qa_report/', status: 'wip' },
    ],
    tasks: [
      { label: 'qa_robot.py funcionando', done: true },
      { label: 'Relatório de QA gerado', done: true },
      { label: 'Testes automatizados (Jest)', done: false },
      { label: 'E2E com Playwright', done: false },
      { label: 'Zero erros críticos em produção', done: false },
    ],
    xpBreakdown: { tasks: 40, bugs: 5, build: 100, coverage: 10, deploy: 100 },
    bugs: 5,
    notes: '',
  },
  {
    id: 'modulos',
    name: 'Módulos',
    emoji: '📦',
    npc: { name: 'Time', role: 'Squad de Produto', color: '#f59e0b', accessory: 'headphones' },
    gridPos: [0, 2],
    files: [
      { name: 'app/dashboard/ (14 módulos)', path: 'app/dashboard/', status: 'done' },
      { name: 'app/marca/dashboard/', path: 'app/marca/dashboard/', status: 'wip' },
    ],
    tasks: [
      { label: '14 módulos do criador ativos', done: true },
      { label: 'Dashboard marca em produção', done: false },
      { label: 'Histórico de conteúdo funcional', done: true },
      { label: 'Sistema de gamificação (pontos)', done: true },
    ],
    xpBreakdown: { tasks: 87, bugs: 1, build: 100, coverage: 30, deploy: 100 },
    bugs: 1,
    notes: '',
  },
  {
    id: 'deploy',
    name: 'Deploy',
    emoji: '🚀',
    npc: { name: 'Vera', role: 'DevOps Engineer', color: '#8b5cf6', accessory: 'clipboard' },
    gridPos: [1, 2],
    files: [
      { name: 'vercel.json', path: 'vercel.json', status: 'done' },
      { name: 'next.config.js', path: 'next.config.js', status: 'done' },
      { name: '.gitignore', path: '.gitignore', status: 'wip' },
    ],
    tasks: [
      { label: 'Deploy automático Vercel ativo', done: true },
      { label: 'Env vars configuradas no Vercel', done: true },
      { label: 'Domínio iarahubapp.com.br ativo', done: true },
      { label: 'Build sem erros TypeScript', done: true },
    ],
    xpBreakdown: { tasks: 100, bugs: 0, build: 100, coverage: 0, deploy: 100 },
    bugs: 0,
    notes: '',
  },
  {
    id: 'monetizacao',
    name: 'Monetização',
    emoji: '💰',
    npc: { name: 'Max', role: 'Growth & Revenue', color: '#f97316', accessory: 'chart' },
    gridPos: [2, 2],
    files: [
      { name: 'app/api/stripe/ (pendente)', path: 'app/api/stripe/', status: 'todo' },
    ],
    tasks: [
      { label: 'Planos definidos no schema', done: true },
      { label: 'Integração Stripe completa', done: false },
      { label: 'Webhooks de pagamento ativos', done: false },
      { label: 'Portal do cliente Stripe', done: false },
    ],
    xpBreakdown: { tasks: 25, bugs: 0, build: 100, coverage: 0, deploy: 0 },
    bugs: 0,
    notes: '',
  },
]
