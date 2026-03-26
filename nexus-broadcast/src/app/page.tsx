'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformSnapshot, SessionRecord, UserRecord, UserRole } from '@/lib/types'

type Workspace = 'operator' | 'engineer' | 'trainee' | 'admin'

const workspaceCopy: Record<Workspace, { label: string; title: string; summary: string }> = {
  operator: {
    label: 'Operator',
    title: 'Live production control for transmission, switching, and on-air continuity.',
    summary: 'Run scenarios, monitor incidents, and keep active services stable across the platform.',
  },
  engineer: {
    label: 'Engineer',
    title: 'Engineering control for discovery, NMOS, monitoring, and legacy integration.',
    summary: 'Track site health, inspect connectors, and operate GPIO-linked legacy devices with live telemetry.',
  },
  trainee: {
    label: 'Trainee',
    title: 'Structured learning and simulation for new operators and engineers.',
    summary: 'Use scenario-driven training and the integrated curriculum to build repeatable operational confidence.',
  },
  admin: {
    label: 'Admin',
    title: 'Enterprise oversight for tenants, sites, users, and platform posture.',
    summary: 'Supervise the whole deployment footprint, role assignments, and service connectivity across regions.',
  },
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

function workspaceForRole(role: UserRole): Workspace {
  if (role === 'admin') return 'admin'
  return role
}

export default function NexusEnterprisePage() {
  const [workspace, setWorkspace] = useState<Workspace>('operator')
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'reconnecting'>('connecting')
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = async () => {
    const data = await requestJson<PlatformSnapshot>('/api/system')
    setSnapshot(data)
  }

  const loadSession = async () => {
    const [sessionResponse, usersResponse] = await Promise.all([
      requestJson<{ session: SessionRecord }>('/api/auth/session'),
      requestJson<{ users: UserRecord[] }>('/api/system-users'),
    ])

    setSession(sessionResponse.session)
    setWorkspace(workspaceForRole(sessionResponse.session.role))
    setUsers(usersResponse.users)
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadSnapshot(), loadSession()])
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load enterprise platform state.')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    const source = new EventSource('/api/stream')

    source.addEventListener('snapshot', (event) => {
      setStreamStatus('live')
      setSnapshot(JSON.parse(event.data) as PlatformSnapshot)
    })

    source.onerror = () => {
      setStreamStatus('reconnecting')
    }

    return () => source.close()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!session) return users
    return users.filter((user) => user.tenantId === session.tenantId)
  }, [session, users])

  const activeSite = useMemo(() => snapshot?.sites.find((site) => site.id === session?.siteId) ?? snapshot?.sites[0], [session, snapshot])

  const runScenario = async (slug: string) => {
    setBusyAction(`scenario-${slug}`)
    await requestJson('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const discoverEquipment = async () => {
    setBusyAction('discovery')
    await requestJson('/api/discovery', { method: 'POST' })
    await loadSnapshot()
    setBusyAction(null)
  }

  const toggleGpio = async (id: number) => {
    setBusyAction(`gpio-${id}`)
    await requestJson('/api/gpio', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const acknowledge = async (id: number) => {
    setBusyAction(`alert-${id}`)
    await requestJson('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const changeConnectorStatus = async (id: number, status: 'connected' | 'degraded' | 'offline') => {
    setBusyAction(`connector-${id}-${status}`)
    await requestJson('/api/connectors', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const toggleRoute = async (id: number) => {
    setBusyAction(`route-${id}`)
    await requestJson('/api/routes', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const executeWorkflow = async (id: number) => {
    setBusyAction(`workflow-${id}`)
    await requestJson('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const runConnectorJob = async (connectorId: number, action: 'sync' | 'switch-route' | 'run-workflow' | 'pulse-gpio') => {
    setBusyAction(`job-${connectorId}-${action}`)
    await requestJson('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ connectorId, action }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const loginAs = async (userId: number) => {
    setBusyAction(`login-${userId}`)
    const response = await requestJson<{ session: SessionRecord }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
    setSession(response.session)
    setWorkspace(workspaceForRole(response.session.role))
    await loadSnapshot()
    setBusyAction(null)
  }

  const logout = async () => {
    setBusyAction('logout')
    await requestJson('/api/auth/logout', { method: 'POST' })
    await loadSession()
    await loadSnapshot()
    setBusyAction(null)
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Nexus Broadcast Orchestrate Enterprise</p>
          <h1>Enterprise orchestration for live production, engineering operations, and broadcast training at multi-site scale.</h1>
          <p className="lede">
            This build adds role-aware sessions, live event streaming, site and tenant visibility, connector management, discovery, NMOS awareness, and legacy control.
          </p>
        </div>
        <div className="heroMeta">
          <div className={`statusPill ${streamStatus === 'live' ? 'live' : 'warning'}`}>{streamStatus}</div>
          <div className="statusPill subtle">{session ? `${session.name} • ${session.role}` : 'Loading session'}</div>
          <Link href="/training" className="ghostButton">
            Open training hub
          </Link>
        </div>
      </section>

      <section className="kpiGrid">
        <article className="kpiCard">
          <span>Connected sites</span>
          <strong>{snapshot?.metrics.connectedSites ?? '--'}</strong>
          <small>{snapshot?.sites.length ?? 0} sites in current footprint</small>
        </article>
        <article className="kpiCard">
          <span>Connectors online</span>
          <strong>{snapshot?.metrics.connectedConnectors ?? '--'}</strong>
          <small>{snapshot?.connectors.length ?? 0} enterprise integrations</small>
        </article>
        <article className="kpiCard">
          <span>On-air services</span>
          <strong>{snapshot?.metrics.onAirServices ?? '--'}</strong>
          <small>{snapshot?.metrics.activeIncidents ?? 0} incidents currently active</small>
        </article>
        <article className="kpiCard">
          <span>Enterprise users</span>
          <strong>{filteredUsers.length}</strong>
          <small>{snapshot?.tenants.length ?? 0} tenants visible</small>
        </article>
        <article className="kpiCard">
          <span>Queued jobs</span>
          <strong>{snapshot?.metrics.queuedJobs ?? '--'}</strong>
          <small>Auditable command execution</small>
        </article>
      </section>

      <section className="workspace" style={{ marginTop: 18 }}>
        <div className="primaryColumn">
          <section className="tabRow">
            {(Object.keys(workspaceCopy) as Workspace[]).map((key) => (
              <button
                key={key}
                type="button"
                className={workspace === key ? 'tab active' : 'tab'}
                onClick={() => setWorkspace(key)}
              >
                {workspaceCopy[key].label}
              </button>
            ))}
          </section>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">{workspaceCopy[workspace].label} workspace</p>
                <h2>{workspaceCopy[workspace].title}</h2>
              </div>
              <p className="lede" style={{ margin: 0, maxWidth: 520 }}>
                {workspaceCopy[workspace].summary}
              </p>
            </div>
          </article>

          {workspace === 'operator' && snapshot ? (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Routing core</p>
                    <h2>Live source-to-destination control</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.routes.map((route) => (
                    <article key={route.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={route.state === 'active' ? 'badge live' : route.state === 'standby' ? 'badge standby' : 'badge critical'}>
                          {route.state}
                        </span>
                        <small>{route.transport}</small>
                      </div>
                      <h3>{route.source}</h3>
                      <p>
                        {route.destination} • {route.controller}
                      </p>
                      <div className="trainingMeta">
                        <small>{route.protected ? 'Protected flow' : 'Single path'}</small>
                        <small>Site {route.siteId}</small>
                      </div>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void toggleRoute(route.id)}
                        disabled={busyAction === `route-${route.id}` || route.state === 'blocked'}
                      >
                        {busyAction === `route-${route.id}` ? 'Switching...' : 'Toggle route'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Live scenarios</p>
                    <h2>Production event control</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.scenarios.map((scenario) => (
                    <article key={scenario.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={scenario.status === 'active' ? 'badge live' : 'badge standby'}>{scenario.status}</span>
                      </div>
                      <h3>{scenario.name}</h3>
                      <p>{scenario.description}</p>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void runScenario(scenario.slug)}
                        disabled={busyAction === `scenario-${scenario.slug}`}
                      >
                        {busyAction === `scenario-${scenario.slug}` ? 'Applying...' : 'Activate scenario'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Operational workflows</p>
                    <h2>Show-control and recovery automations</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.workflows.map((workflow) => (
                    <article key={workflow.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={workflow.state === 'complete' ? 'badge live' : workflow.state === 'running' ? 'badge warning' : 'badge standby'}>
                          {workflow.state}
                        </span>
                        <small>{workflow.category}</small>
                      </div>
                      <h3>{workflow.name}</h3>
                      <p>{workflow.target}</p>
                      <div className="trainingMeta">
                        <small>Last run {workflow.lastRun}</small>
                      </div>
                      <button
                        type="button"
                        className="ghostButton"
                        onClick={() => void executeWorkflow(workflow.id)}
                        disabled={busyAction === `workflow-${workflow.id}`}
                      >
                        {busyAction === `workflow-${workflow.id}` ? 'Launching...' : 'Run workflow'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">On-air risks</p>
                    <h2>Alerts and operator attention</h2>
                  </div>
                </div>
                <div className="alertList">
                  {snapshot.alerts.map((alert) => (
                    <article key={alert.id} className={`alertCard ${alert.severity}`}>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.detail}</p>
                      </div>
                      <div className="alertFooter">
                        <span>{alert.severity}</span>
                        <button
                          type="button"
                          className="ghostButton"
                          onClick={() => void acknowledge(alert.id)}
                          disabled={alert.acknowledged || busyAction === `alert-${alert.id}`}
                        >
                          {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {workspace === 'engineer' && snapshot ? (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Site and device monitoring</p>
                    <h2>Engineering operations</h2>
                  </div>
                  <button type="button" className="ghostButton activeToggle" onClick={() => void discoverEquipment()} disabled={busyAction === 'discovery'}>
                    {busyAction === 'discovery' ? 'Scanning...' : 'Run discovery'}
                  </button>
                </div>
                <div className="siteGrid">
                  {snapshot.sites.map((site) => (
                    <article key={site.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={site.health === 'healthy' ? 'badge live' : site.health === 'watch' ? 'badge warning' : 'badge critical'}>
                          {site.health}
                        </span>
                        <small>{site.mode}</small>
                      </div>
                      <h3>{site.name}</h3>
                      <p>{site.location}</p>
                      <div className="trainingMeta">
                        <small>{site.activeServices} active services</small>
                        <small>PTP offset {site.ptpOffsetNs} ns</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Connectors</p>
                    <h2>Enterprise integrations</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.connectors.map((connector) => (
                    <article key={connector.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={connector.status === 'connected' ? 'badge live' : connector.status === 'degraded' ? 'badge warning' : 'badge critical'}>
                          {connector.status}
                        </span>
                        <small>{connector.type}</small>
                      </div>
                      <h3>{connector.name}</h3>
                      <p>
                        {connector.vendor} • {connector.protocol}
                      </p>
                      <div className="buttonRow">
                        <button type="button" className="ghostButton" onClick={() => void changeConnectorStatus(connector.id, 'connected')}>
                          Connect
                        </button>
                        <button type="button" className="ghostButton" onClick={() => void changeConnectorStatus(connector.id, 'degraded')}>
                          Degrade
                        </button>
                        <button type="button" className="ghostButton dangerButton" onClick={() => void changeConnectorStatus(connector.id, 'offline')}>
                          Offline
                        </button>
                        <button
                          type="button"
                          className="ghostButton activeToggle"
                          onClick={() =>
                            void runConnectorJob(
                              connector.id,
                              connector.type === 'GPIO'
                                ? 'pulse-gpio'
                                : connector.type === 'Cloud' || connector.type === 'Replay'
                                  ? 'run-workflow'
                                  : connector.type === 'Router' || connector.type === 'Audio'
                                    ? 'switch-route'
                                    : 'sync',
                            )
                          }
                          disabled={busyAction?.startsWith(`job-${connector.id}-`) === true}
                        >
                          Execute job
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">NMOS fabric</p>
                    <h2>Discovery and connection inventory</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.nmosFlows.map((flow) => (
                    <article key={flow.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={flow.status === 'active' ? 'badge live' : flow.status === 'standby' ? 'badge standby' : 'badge warning'}>
                          {flow.status}
                        </span>
                        <small>{flow.mediaType}</small>
                      </div>
                      <h3>{flow.label}</h3>
                      <p>{flow.nodeId}</p>
                      <div className="trainingMeta">
                        <small>{flow.format}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {workspace === 'trainee' ? (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Trainee enablement</p>
                  <h2>Integrated curriculum and scenario practice</h2>
                </div>
              </div>
              <div className="trainingGrid">
                <article className="trainingCard">
                  <h3>Operator onboarding</h3>
                  <p>Use the training hub to walk through startup, switching, incident response, and shift handovers.</p>
                </article>
                <article className="trainingCard">
                  <h3>Engineer onboarding</h3>
                  <p>Learn discovery, connector health, NMOS behavior, monitoring posture, and GPIO intervention patterns.</p>
                </article>
                <article className="trainingCard">
                  <h3>Live simulation</h3>
                  <p>The same enterprise shell supports realistic scenario activation and event replay for drills.</p>
                </article>
              </div>
              <Link href="/training" className="ghostButton activeToggle" style={{ marginTop: 18, display: 'inline-flex' }}>
                Launch full curriculum
              </Link>
            </article>
          ) : null}

          {workspace === 'admin' && snapshot ? (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Tenants and sites</p>
                    <h2>Enterprise oversight</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.tenants.map((tenant) => (
                    <article key={tenant.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className="badge standby">{tenant.tier}</span>
                      </div>
                      <h3>{tenant.name}</h3>
                      <p>{tenant.region}</p>
                      <div className="trainingMeta">
                        <small>{snapshot.sites.filter((site) => site.tenantId === tenant.id).length} sites</small>
                        <small>{snapshot.users.filter((user) => user.tenantId === tenant.id).length} users</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Role access</p>
                    <h2>Enterprise user switching</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {filteredUsers.map((user) => (
                    <article key={user.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className="badge standby">{user.role}</span>
                      </div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void loginAs(user.id)}
                        disabled={busyAction === `login-${user.id}`}
                      >
                        {busyAction === `login-${user.id}` ? 'Switching...' : 'Impersonate workspace'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>
            </>
          ) : null}
        </div>

        <aside className="sideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Session</p>
                <h2>Current workspace user</h2>
              </div>
            </div>
            <div className="sessionCard">
              <strong>{session?.name ?? 'Loading user'}</strong>
              <p>{session?.email ?? 'Loading email'}</p>
              <span className="statusPill subtle">{session?.role ?? 'pending'}</span>
              <button type="button" className="ghostButton" onClick={() => void logout()} disabled={busyAction === 'logout'}>
                {busyAction === 'logout' ? 'Refreshing...' : 'Reset session'}
              </button>
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Active site</p>
                <h2>Primary context</h2>
              </div>
            </div>
            {activeSite ? (
              <div className="sessionCard">
                <strong>{activeSite.name}</strong>
                <p>{activeSite.location}</p>
                <span className={activeSite.health === 'healthy' ? 'statusPill live' : activeSite.health === 'watch' ? 'statusPill warning' : 'statusPill danger'}>
                  {activeSite.health}
                </span>
                <small>{activeSite.activeServices} services • PTP {activeSite.ptpOffsetNs} ns</small>
              </div>
            ) : (
              <p className="trainingText">Waiting for site data.</p>
            )}
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Event stream</p>
                <h2>Live enterprise audit</h2>
              </div>
            </div>
            <div className="eventList">
              {snapshot?.events.map((event) => (
                <div key={event.id} className="eventRow">
                  <span>{event.time}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Execution queue</p>
                <h2>Recent jobs</h2>
              </div>
            </div>
            <div className="alertList">
              {snapshot?.jobs.slice(0, 6).map((job) => (
                <article key={job.id} className="alertCard info">
                  <div>
                    <strong>{job.connectorName}</strong>
                    <p>
                      {job.action} • {job.result ?? 'Executing'}
                    </p>
                  </div>
                  <div className="alertFooter">
                    <span>{job.state}</span>
                    <small>{job.createdAt}</small>
                  </div>
                </article>
              ))}
            </div>
          </article>

          {workspace === 'engineer' && snapshot ? (
            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">GPIO bridge</p>
                  <h2>Legacy control</h2>
                </div>
              </div>
              <div className="alertList">
                {snapshot.gpioPorts.map((port) => (
                  <article key={port.id} className="alertCard info">
                    <div>
                      <strong>{port.port}</strong>
                      <p>
                        {port.label} • {port.direction} • {port.deviceName}
                      </p>
                    </div>
                    <div className="alertFooter">
                      <span>{port.state === 1 ? 'High' : 'Low'}</span>
                      <button
                        type="button"
                        className={port.state === 1 ? 'ghostButton activeToggle' : 'ghostButton'}
                        onClick={() => void toggleGpio(port.id)}
                        disabled={busyAction === `gpio-${port.id}`}
                      >
                        {busyAction === `gpio-${port.id}` ? 'Switching...' : 'Toggle'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : null}
        </aside>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">Loading enterprise product state...</p>
        </section>
      ) : null}
    </main>
  )
}
