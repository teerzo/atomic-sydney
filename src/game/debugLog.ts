export function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data?: Record<string, unknown>,
) {
  console.log(`[debug ${hypothesisId}] ${location}: ${message}`, data ?? '')
  // #region agent log
  fetch('http://127.0.0.1:7820/ingest/b10edd7d-6838-4f27-b8cb-899147349a66', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ce02a6' },
    body: JSON.stringify({
      sessionId: 'ce02a6',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}
