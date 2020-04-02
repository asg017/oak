const BASE = "";
export function getMeta() {
  return fetch(`${BASE}/api/meta`).then(r => r.json());
}

export function getPulse() {
  return fetch(`${BASE}/api/pulse`).then(r => r.json());
}

export function getLogs() {
  return fetch(`${BASE}/api/logs`).then(r => r.json());
}

export function getRuns() {
  return fetch(`${BASE}/api/runs`).then(r => r.json());
}

export function getLog(rowid) {
  return fetch(`${BASE}/api/log?rowid=${rowid}`).then(r => r.text());
}
