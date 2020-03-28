const BASE = "";
export function getMeta() {
  return fetch(`${BASE}/api/meta`).then(r => r.json());
}

export function getPulse() {
  return fetch(`${BASE}/api/pulse`).then(r => r.json());
}
