import type { ConnectorRecord } from './types'

export type AdapterAction =
  | 'sync'
  | 'connect'
  | 'disconnect'
  | 'switch-route'
  | 'run-workflow'
  | 'pulse-gpio'

export type AdapterExecution = {
  ok: boolean
  message: string
}

type ConnectorAdapter = {
  supports: (action: AdapterAction) => boolean
  execute: (connector: ConnectorRecord, action: AdapterAction, payload: Record<string, unknown>) => Promise<AdapterExecution>
}

async function callEndpoint(connector: ConnectorRecord, action: AdapterAction, payload: Record<string, unknown>) {
  if (!connector.endpoint) {
    return {
      ok: true,
      message: `${connector.name} accepted ${action} using simulated adapter execution.`,
    }
  }

  const response = await fetch(connector.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })

  if (!response.ok) {
    return {
      ok: false,
      message: `${connector.name} endpoint returned ${response.status}.`,
    }
  }

  const body = (await response.json().catch(() => null)) as { message?: string } | null
  return {
    ok: true,
    message: body?.message ?? `${connector.name} completed ${action}.`,
  }
}

const adapters: Record<ConnectorRecord['type'], ConnectorAdapter> = {
  NMOS: {
    supports: (action) => ['sync', 'connect', 'switch-route'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  GPIO: {
    supports: (action) => ['pulse-gpio', 'connect', 'disconnect', 'sync'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Router: {
    supports: (action) => ['switch-route', 'connect', 'disconnect', 'sync'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Replay: {
    supports: (action) => ['run-workflow', 'switch-route', 'sync'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Cloud: {
    supports: (action) => ['run-workflow', 'connect', 'disconnect', 'sync'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Audio: {
    supports: (action) => ['switch-route', 'sync', 'connect'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Bridge: {
    supports: (action) => ['sync', 'connect', 'disconnect', 'switch-route'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
  Monitoring: {
    supports: (action) => ['sync', 'connect', 'run-workflow'].includes(action),
    execute: (connector, action, payload) => callEndpoint(connector, action, payload),
  },
}

export async function executeConnectorAction(
  connector: ConnectorRecord,
  action: AdapterAction,
  payload: Record<string, unknown>,
) {
  const adapter = adapters[connector.type]
  if (!adapter.supports(action)) {
    return {
      ok: false,
      message: `${connector.type} adapters do not support ${action}.`,
    }
  }

  return adapter.execute(connector, action, payload)
}
