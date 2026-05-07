import { describe, it, expect } from 'vitest'
import { gerarUrlPresenca } from '@/lib/qr/gerar-qr'

describe('gerarUrlPresenca', () => {
  it('gera URL com dia e code corretos', () => {
    const url = gerarUrlPresenca('dia-123', 'azul42', 'https://app.sipat.com')
    expect(url).toBe('https://app.sipat.com/presenca?dia=dia-123&code=azul42')
  })

  it('usa appUrl padrao quando nao fornecido', () => {
    const url = gerarUrlPresenca('dia-123', 'azul42', 'http://localhost:3000')
    expect(url).toContain('/presenca')
    expect(url).toContain('dia=dia-123')
    expect(url).toContain('code=azul42')
  })

  it('encoda caracteres especiais no codigo', () => {
    const url = gerarUrlPresenca('dia-123', 'codigo especial', 'https://app.sipat.com')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('code')).toBe('codigo especial')
  })

  it('encoda IDs com caracteres especiais', () => {
    const url = gerarUrlPresenca('dia/com/barra', 'azul42', 'https://app.sipat.com')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('dia')).toBe('dia/com/barra')
  })
})
