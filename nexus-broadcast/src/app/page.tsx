'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformSnapshot } from '@/lib/types'

type Workspace = 'operator' | 'engineer' | 'trainee'

const workspaceCopy: Record<Workspace, { label: string; title: string; summary: string }> = {
  operator: {
    label: 'Operator',
    title: 'Live production control for directors, TDs, and transmission teams.',
    summary: 'Run scenarios, watch incidents, supervise runbooks, and keep on-air services stable.',
  },
  engineer: {
    label: 'Engineer',
    title: 'Engineering control for NMOS, discovery, monitoring, and legacy integration.',
    summary: 'Manage IP/SDI interoperability, observe hardware health, and drive GPIO for older devices.',
  },
  trainee: {
    label: 'Trainee',
    title: 'Structured onboarding for operators, engineers, and junior support staff.',
    summary: 'Turn the system into a teachable product with guided modules and practice paths.',
  },
}

async function requestJson(url: string, init?: RequestInit) {
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

  return response.json()
}

export default function NexusProductPage() {
  const [workspace, setWorkspace] = useState<Workspace>('operator')
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = async () => {
    try {
      const data = (await requestJson('/api/system')) as PlatformSnapshot
      setSnapshot(data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load platform state.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSnapshot()
    const timer = window.setInterval(() => {
      void loadSnapshot()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const derived = useMemo(() => {
    if (!snapshot) return null

    const criticalAlerts = snapshot.alerts.filter((alert) => alert.severity === 'critical' && !alert.acknowledged).length
    const degradedEquipment = snapshot.equipment.filter((item) => item.status !== 'online').length
    const registeredNmos = snapshot.nmosNodes.filter((item) => item.status === 'registered').length

    return {
      criticalAlerts,
      degradedEquipment,
      registeredNmos,
    }
  }, [snapshot])

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

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Nexus Broadcast Orchestrate</p>
          <h1>One control plane for live production, engineering operations, NMOS discovery, and training.</h1>
          <p className="lede">
            Built as a sellable product foundation that merges operator workflows, engineering visibility, and trainee enablement into a single platform.
          </p>
        </div>
        <div className="heroMeta">
          <div className="statusPill live">{loading ? 'Loading' : 'Live product state'}</div>
          <Link href="/training" className="ghostButton">
            Open trainee curriculum
          </Link>
        </div>
      </section>

      <section className="kpiGrid">
        <article className="kpiCard">
          <span>On-air services</span>
          <strong>{snapshot?.metrics.onAirServices ?? '--'}</strong>
          <small>Stable production capacity across facilities</small>
        </article>
        <article className="kpiCard">
          <span>Active incidents</span>
          <strong>{snapshot?.metrics.activeIncidents ?? '--'}</strong>
          <small>{derived?.criticalAlerts ?? 0} critical alerts require action</small>
        </article>
        <article className="kpiCard">
          <span>NMOS registry</span>
          <strong>{snapshot?.metrics.registeredNmosNodes ?? '--'}</strong>
          <small>{derived?.registeredNmos ?? 0} registered nodes visible now</small>
        </article>
        <article className="kpiCard">
          <span>GPIO active</span>
          <strong>{snapshot?.metrics.gpioActive ?? '--'}</strong>
          <small>{snapshot?.facilities.join(' • ') ?? 'Waiting for facilities'}</small>
        </article>
      </section>

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

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="panelLabel">{workspaceCopy[workspace].label} workspace</p>
            <h2>{workspaceCopy[workspace].title}</h2>
          </div>
          <p className="lede" style={{ margin: 0, maxWidth: 520 }}>
            {workspaceCopy[workspace].summary}
          </p>
        </div>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}

      {workspace === 'operator' ? (
        <section className="workspace" style={{ marginTop: 18 }}>
          <div className="primaryColumn">
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Live scenarios</p>
                  <h2>Production modes</h2>
                </div>
              </div>
              <div className="trainingGrid">
                {snapshot?.scenarios.map((scenario) => (
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
                  <p className="panelLabel">Runbooks</p>
                  <h2>Operational automation</h2>
                </div>
              </div>
              <div className="automationGrid">
                {snapshot?.runbooks.map((runbook) => (
                  <article key={runbook.id} className="automationCard">
                    <div className="automationHeader">
                      <strong>{runbook.name}</strong>
                      <span className={`statusPill ${runbook.state === 'complete' ? 'live' : runbook.state === 'running' ? 'warning' : 'subtle'}`}>
                        {runbook.state}
                      </span>
                    </div>
                    <p>{runbook.purpose}</p>
                    <div className="automationMeta">
                      <small>ETA {runbook.eta}</small>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="sideColumn">
            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Alerts</p>
                  <h2>On-air risk</h2>
                </div>
              </div>
              <div className="alertList">
                {snapshot?.alerts.map((alert) => (
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

            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Event feed</p>
                  <h2>Production audit</h2>
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
          </aside>
        </section>
      ) : null}

      {workspace === 'engineer' ? (
        <section className="workspace" style={{ marginTop: 18 }}>
          <div className="primaryColumn">
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Discovery + inventory</p>
                  <h2>Equipment and monitoring</h2>
                </div>
                <button type="button" className="ghostButton activeToggle" onClick={() => void discoverEquipment()} disabled={busyAction === 'discovery'}>
                  {busyAction === 'discovery' ? 'Scanning...' : 'Run equipment discovery'}
                </button>
              </div>
              <div className="deviceList">
                {snapshot?.equipment.map((item) => (
                  <article key={item.id} className="deviceCard">
                    <div className="deviceIdentity">
                      <div className={`healthDot ${item.status}`} />
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.vendor} {item.model} • {item.role}
                        </p>
                      </div>
                    </div>
                    <div className="deviceStats">
                      <span>{item.facility}</span>
                      <span>CPU {item.cpuLoad}%</span>
                      <span>{item.temperature} C</span>
                      <span>{item.latencyMs} ms</span>
                    </div>
                    <p className="trainingText">{item.protocols.join(' • ')}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">NMOS integration</p>
                  <h2>Registry and connection visibility</h2>
                </div>
              </div>
              <div className="trainingGrid">
                {snapshot?.nmosNodes.map((node) => (
                  <article key={node.id} className="trainingCard">
                    <div className="trainingCardHeader">
                      <span className={node.status === 'registered' ? 'badge live' : 'badge warning'}>{node.status}</span>
                      <small>{node.kind}</small>
                    </div>
                    <h3>{node.label}</h3>
                    <p>{node.subscription}</p>
                    <div className="trainingMeta">
                      <small>Node ID: {node.nodeId}</small>
                      <small>Transport: {node.transport}</small>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="sideColumn">
            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Legacy control</p>
                  <h2>GPI / GPIO bridge</h2>
                </div>
              </div>
              <div className="alertList">
                {snapshot?.gpioPorts.map((port) => (
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

            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Engineering posture</p>
                  <h2>Quick summary</h2>
                </div>
              </div>
              <ul className="trainingList">
                <li>{derived?.degradedEquipment ?? 0} equipment records are degraded or offline.</li>
                <li>{snapshot?.metrics.gpioActive ?? 0} GPIO ports are currently active.</li>
                <li>{snapshot?.metrics.registeredNmosNodes ?? 0} NMOS nodes are visible to the registry.</li>
                <li>Database-backed state is persisted locally for equipment, alerts, scenarios, GPIO, and audit events.</li>
              </ul>
            </article>
          </aside>
        </section>
      ) : null}

      {workspace === 'trainee' ? (
        <section className="workspace" style={{ marginTop: 18 }}>
          <div className="primaryColumn">
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Trainee enablement</p>
                  <h2>Structured learning inside the product</h2>
                </div>
              </div>
              <div className="trainingGrid">
                <article className="trainingCard">
                  <h3>Operator learning path</h3>
                  <p>Startup checks, route safety, live source switching, on-air incident containment, and shift handovers.</p>
                </article>
                <article className="trainingCard">
                  <h3>Engineer learning path</h3>
                  <p>Equipment discovery, NMOS understanding, monitoring interpretation, legacy GPIO integration, and platform troubleshooting.</p>
                </article>
                <article className="trainingCard">
                  <h3>Scenario-based practice</h3>
                  <p>Rehearse sports events, breaking news, and disaster recovery using the same product shell operators use live.</p>
                </article>
              </div>
            </article>
          </div>

          <aside className="sideColumn">
            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Training hub</p>
                  <h2>Open full curriculum</h2>
                </div>
              </div>
              <p className="trainingText">
                The training section now acts as the trainee workspace for onboarding operators and engineers directly inside the product.
              </p>
              <Link href="/training" className="ghostButton activeToggle" style={{ marginTop: 16, display: 'inline-flex' }}>
                Launch trainee modules
              </Link>
            </article>
          </aside>
        </section>
      ) : null}
    </main>
  )
}
