export const SOS_MODES = Object.freeze({ LOCAL: 'LOCAL', FIXTURE: 'FIXTURE', REMOTE_READ: 'REMOTE_READ' });

// Read before loading App/router: Fixture must not import the live application graph.
export function getSosMode(search = globalThis.location?.search || '') {
  const value = new URLSearchParams(search).get('sos_mode')?.toUpperCase();
  return Object.values(SOS_MODES).includes(value) ? value : SOS_MODES.LOCAL;
}

export function sosModeUrl(mode) {
  return mode === SOS_MODES.LOCAL ? '/sos' : `/sos?sos_mode=${mode.toLowerCase()}`;
}
