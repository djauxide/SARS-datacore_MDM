export type EquipmentRecord = {
  id: number
  name: string
  vendor: string
  model: string
  role: string
  facility: string
  status: 'online' | 'degraded' | 'offline'
  protocols: string[]
  cpuLoad: number
  temperature: number
  latencyMs: number
  lastSeen: string
}

export type UserRole = 'operator' | 'engineer' | 'trainee' | 'admin'

export type UserRecord = {
  id: number
  name: string
  email: string
  role: UserRole
  tenantId: number
  siteId: number
}

export type TenantRecord = {
  id: number
  name: string
  region: string
  tier: 'Enterprise' | 'Broadcast Group' | 'Training'
}

export type SiteRecord = {
  id: number
  tenantId: number
  name: string
  location: string
  mode: 'Production' | 'Backup' | 'Training'
  health: 'healthy' | 'watch' | 'critical'
  activeServices: number
  ptpOffsetNs: number
}

export type NmosNodeRecord = {
  id: number
  label: string
  nodeId: string
  kind: 'sender' | 'receiver' | 'node'
  transport: string
  subscription: string
  status: 'registered' | 'warning' | 'missing'
}

export type ConnectorRecord = {
  id: number
  siteId: number
  name: string
  type: 'NMOS' | 'GPIO' | 'Router' | 'Replay' | 'Cloud' | 'Audio'
  vendor: string
  status: 'connected' | 'degraded' | 'offline'
  protocol: string
  lastSync: string
}

export type GpioRecord = {
  id: number
  port: string
  label: string
  direction: 'GPI' | 'GPO'
  state: 0 | 1
  deviceName: string
}

export type AlertRecord = {
  id: number
  title: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
  acknowledged: boolean
}

export type ScenarioRecord = {
  id: number
  slug: string
  name: string
  description: string
  status: 'ready' | 'active'
}

export type RunbookRecord = {
  id: number
  name: string
  purpose: string
  eta: string
  state: 'idle' | 'running' | 'complete'
}

export type EventRecord = {
  id: number
  time: string
  title: string
  detail: string
}

export type PlatformSnapshot = {
  generatedAt: string
  facilities: string[]
  tenants: TenantRecord[]
  sites: SiteRecord[]
  users: UserRecord[]
  connectors: ConnectorRecord[]
  metrics: {
    onAirServices: number
    activeIncidents: number
    registeredNmosNodes: number
    protectedFlows: number
    gpioActive: number
    connectedSites: number
    connectedConnectors: number
  }
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
}

export type SessionRecord = {
  name: string
  email: string
  role: UserRole
  tenantId: number
  siteId: number
}
