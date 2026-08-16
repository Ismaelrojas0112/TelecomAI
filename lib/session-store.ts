/**
 * Estado de conversación en memoria, por sessionId. Suficiente para el
 * prototipo (todo corre local, un solo proceso) — no es para producción.
 */
export type SessionState = {
  accountId: string;
  /** true una vez que el bot ya dio una explicación en esta sesión. */
  explained: boolean;
  /** texto de la última explicación dada, para el payload de hand-off. */
  lastExplanationText: string | null;
  /** para no repetir la misma oferta de cross-selling varias veces. */
  crossSellShown: boolean;
};

const sessions = new Map<string, SessionState>();

export function getSession(sessionId: string, accountId: string): SessionState {
  const existing = sessions.get(sessionId);
  if (existing && existing.accountId === accountId) return existing;

  const fresh: SessionState = {
    accountId,
    explained: false,
    lastExplanationText: null,
    crossSellShown: false,
  };
  sessions.set(sessionId, fresh);
  return fresh;
}

export function updateSession(
  sessionId: string,
  patch: Partial<SessionState>
): void {
  const current = sessions.get(sessionId);
  if (!current) return;
  sessions.set(sessionId, { ...current, ...patch });
}
