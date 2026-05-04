'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformManagementRecord, PlatformSnapshot } from '@/lib/types'

type ManagementResponse = PlatformManagementRecord

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

function badgeTone(status: string) {
  if (['active', 'live', 'complete', 'ready'].includes(status)) return 'live'
  if (['blocked', 'degraded', 'suspended', 'paused'].includes(status)) return 'warning'
  return 'standby'
}

export default function ManagementPage() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [management, setManagement] = useState<ManagementResponse | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const [systemData, managementData] = await Promise.all([
      requestJson<PlatformSnapshot>('/api/system'),
      requestJson<ManagementResponse>('/api/management'),
    ])
    setSnapshot(systemData)
    setManagement(managementData)
  }

  useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load platform management.'))
  }, [])

  const runAction = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    setError(null)
    try {
      await requestJson('/api/management', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.')
    } finally {
      setBusy(null)
    }
  }

  const launchCustomer = async () => {
    const suffix = management ? management.customers.length + 1 : 1
    await runAction('onboard-customer', {
      action: 'onboard-customer',
      name: `Launch Customer ${suffix}`,
      brand: `Nexus CTV ${suffix}`,
      region: 'Southern Africa',
      contactEmail: `launch${suffix}@nexus-ctv.example`,
      tier: 'Launch',
    })
  }

  const selectedCustomer = useMemo(() => management?.customers.find((customer) => customer.status === 'onboarding') ?? management?.customers[0], [management])
  const selectedCustomerApps = useMemo(
    () => management?.middlewareApps.filter((app) => app.customerId === selectedCustomer?.id) ?? [],
    [management, selectedCustomer],
  )
  const selectedCustomerChannels = useMemo(
    () => management?.ctvChannels.filter((channel) => channel.customerId === selectedCustomer?.id) ?? [],
    [management, selectedCustomer],
  )
  const selectedCustomerTasks = useMemo(
    () => management?.onboardingTasks.filter((task) => task.customerId === selectedCustomer?.id) ?? [],
    [management, selectedCustomer],
  )

  return (
    <main className="managementShell">
      <section className="managementTopbar">
        <div>
          <p className="eyebrow">Platform Management</p>
          <h1>Customer onboarding, middleware control, channel launch, SCTE markers, and monetization ops.</h1>
        </div>
        <div className="managementNav">
          <Link href="/orchestrate" className="ghostButton">
            Broadcast ops
          </Link>
          <Link href="/fast" className="ghostButton">
            FAST workspace
          </Link>
          <button type="button" className="ghostButton activeToggle" onClick={() => void launchCustomer()} disabled={busy === 'onboard-customer'}>
            {busy === 'onboard-customer' ? 'Creating...' : 'Onboard customer'}
          </button>
        </div>
      </section>

      <section className="managementKpis">
        <article className="kpiCard">
          <span>Customers</span>
          <strong>{management?.customers.length ?? 0}</strong>
          <small>{snapshot?.metrics.activeCustomers ?? 0} active accounts</small>
        </article>
        <article className="kpiCard">
          <span>Middleware</span>
          <strong>{management?.middlewareApps.length ?? 0}</strong>
          <small>{snapshot?.metrics.activeMiddlewareApps ?? 0} apps active</small>
        </article>
        <article className="kpiCard">
          <span>CTV channels</span>
          <strong>{management?.ctvChannels.length ?? 0}</strong>
          <small>{snapshot?.metrics.liveCtvChannels ?? 0} live channels</small>
        </article>
        <article className="kpiCard">
          <span>SCTE markers</span>
          <strong>{management?.scteMarkers.length ?? 0}</strong>
          <small>{snapshot?.metrics.armedScteMarkers ?? 0} markers armed</small>
        </article>
      </section>

      <section className="managementGrid">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">Customers</p>
              <h2>Tenants and onboarding state</h2>
            </div>
          </div>
          <div className="managementList">
            {management?.customers.map((customer) => (
              <article key={customer.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(customer.status)}`}>{customer.status}</span>
                  <small>{customer.tier}</small>
                </div>
                <h3>{customer.brand}</h3>
                <p>{customer.name}</p>
                <small>{customer.region} / {customer.primaryDomain}</small>
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => void runAction(`advance-${customer.id}`, { action: 'advance-onboarding', customerId: customer.id })}
                  disabled={busy === `advance-${customer.id}`}
                >
                  {busy === `advance-${customer.id}` ? 'Advancing...' : 'Advance onboarding'}
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">Middleware</p>
              <h2>{selectedCustomer?.brand ?? 'Customer'} service apps</h2>
            </div>
          </div>
          <div className="managementList">
            {selectedCustomerApps.map((app) => (
              <article key={app.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(app.status)}`}>{app.status}</span>
                  <small>{app.category}</small>
                </div>
                <h3>{app.name}</h3>
                <p>{app.endpoint}</p>
                <small>{app.authMode} / {app.slaMs} ms SLA</small>
                <div className="buttonRow">
                  <button
                    type="button"
                    className="ghostButton activeToggle"
                    onClick={() => void runAction(`mw-active-${app.id}`, { action: 'set-middleware-status', appId: app.id, status: 'active' })}
                    disabled={busy === `mw-active-${app.id}`}
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() => void runAction(`mw-degraded-${app.id}`, { action: 'set-middleware-status', appId: app.id, status: 'degraded' })}
                    disabled={busy === `mw-degraded-${app.id}`}
                  >
                    Degrade
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">Channels</p>
              <h2>Launch and local insertion control</h2>
            </div>
          </div>
          <div className="managementList">
            {selectedCustomerChannels.map((channel) => (
              <article key={channel.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(channel.status)}`}>{channel.status}</span>
                  <small>{channel.playoutMode}</small>
                </div>
                <h3>{channel.name}</h3>
                <p>{channel.distributionTargets.join(' / ')}</p>
                <small>Ads {channel.adInsertionEnabled ? 'on' : 'off'} / Local {channel.localInsertionEnabled ? 'on' : 'off'}</small>
                <button
                  type="button"
                  className="ghostButton activeToggle"
                  onClick={() => void runAction(`launch-${channel.id}`, { action: 'launch-channel', channelId: channel.id })}
                  disabled={busy === `launch-${channel.id}`}
                >
                  {busy === `launch-${channel.id}` ? 'Launching...' : 'Launch channel'}
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">SCTE and campaigns</p>
              <h2>Marker firing and ad campaign activation</h2>
            </div>
          </div>
          <div className="managementList">
            {management?.scteMarkers.slice(0, 6).map((marker) => (
              <article key={marker.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(marker.status)}`}>{marker.status}</span>
                  <small>{marker.profile}</small>
                </div>
                <h3>{marker.eventId}</h3>
                <p>{marker.spliceCommand} / {marker.availStart} / {marker.durationSec}s</p>
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => void runAction(`scte-${marker.id}`, { action: 'fire-scte-marker', markerId: marker.id })}
                  disabled={busy === `scte-${marker.id}`}
                >
                  Fire marker
                </button>
              </article>
            ))}
            {management?.adCampaigns.slice(0, 4).map((campaign) => (
              <article key={campaign.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(campaign.status)}`}>{campaign.status}</span>
                  <small>${campaign.cpmUsd} CPM</small>
                </div>
                <h3>{campaign.name}</h3>
                <p>{campaign.buyer}</p>
                <small>{campaign.deliveredImpressions} / {campaign.bookedImpressions} impressions</small>
                <button
                  type="button"
                  className="ghostButton activeToggle"
                  onClick={() => void runAction(`campaign-${campaign.id}`, { action: 'start-campaign', campaignId: campaign.id })}
                  disabled={busy === `campaign-${campaign.id}`}
                >
                  Start campaign
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="panel managementWide">
          <div className="panelHeader">
            <div>
              <p className="panelLabel">Onboarding tasks</p>
              <h2>{selectedCustomer?.brand ?? 'Customer'} launch checklist</h2>
            </div>
          </div>
          <div className="managementTaskGrid">
            {selectedCustomerTasks.map((task) => (
              <article key={task.id} className="managementCard">
                <div className="trainingCardHeader">
                  <span className={`badge ${badgeTone(task.status)}`}>{task.status}</span>
                  <small>{task.owner}</small>
                </div>
                <h3>{task.title}</h3>
                <p>{task.detail}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}
    </main>
  )
}
