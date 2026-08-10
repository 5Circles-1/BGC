// The T-15 → T-0 launch readiness runway. Content is the plan of record;
// per-item state (done / gate status / evidence) lives in AppData.readiness.
// Narrative version: docs/PRELAUNCH.md

export type DomainKey = 'compliance' | 'product' | 'sales' | 'marketing' | 'tech' | 'hr' | 'finance' | 'offline'

export const DOMAIN_LABEL: Record<DomainKey, string> = {
  compliance: 'Compliance',
  product: 'Product & backtest',
  sales: 'Sales floor',
  marketing: 'Marketing & ads',
  tech: 'Tech & tools',
  hr: 'HR & hiring',
  finance: 'Finance & cash',
  offline: 'Offline ringfence',
}

export interface PrepStep {
  id: string; day: string; date: string; domain: DomainKey
  action: string; owner: string; output: string; hours: number; dependsOn?: string
}

export interface PrepGate {
  id: string; name: string; domain: DomainKey
  passTest: string; verifier: string; blocksLaunch: boolean; dueDay: string
}

export interface PrepRole {
  role: string; person: string; domain: DomainKey
  mandate: string; ownsNumbers: string[]; stopsDoing: string; deliverables: string[]
}

export interface PrepTool {
  tool: string; purpose: string; domain: DomainKey; owner: string
  costInrMonthly: number | null; leadTime: string; failureMode: string
}

export interface Tripwire { metric: string; threshold: string; action: string; owner: string }

// Populated below by the readiness plan.
export const PREP_GATES: PrepGate[] = []
export const PREP_STEPS: PrepStep[] = []
export const PREP_ROLES: PrepRole[] = []
export const PREP_TOOLS: PrepTool[] = []
export const TRIPWIRES: Tripwire[] = []
