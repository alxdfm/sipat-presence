interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

/**
 * Verifica e registra uma tentativa de rate limit para a chave dada.
 * Usa janela deslizante simples em memória — adequado para instância única.
 *
 * @param key - Identificador único (ex: IP do cliente).
 * @param limit - Número máximo de requisições na janela.
 * @param windowMs - Duração da janela em milissegundos.
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}
