import { describe, it, expect } from 'vitest'
import { gerarCertificado } from '@/lib/pdf/certificado'
import { DadosCertificado } from '@/types'

const dadosTeste: DadosCertificado = {
  nomeParticipante: 'Joao Silva',
  emailParticipante: 'joao@empresa.com',
  nomeEvento: 'SIPAT 2026',
  presencas: [
    { data: '2026-05-07', registrada_em: '2026-05-07T08:15:00Z' },
    { data: '2026-05-08', registrada_em: '2026-05-08T08:20:00Z' },
  ],
  totalDias: 2,
}

describe('gerarCertificado', () => {
  it('gera um PDF valido (Uint8Array nao vazio)', async () => {
    const bytes = await gerarCertificado(dadosTeste)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('PDF comeca com o magic number correto (%PDF)', async () => {
    const bytes = await gerarCertificado(dadosTeste)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('gera PDF com apenas 1 presenca', async () => {
    const dadosUmDia: DadosCertificado = {
      ...dadosTeste,
      presencas: [{ data: '2026-05-07', registrada_em: '2026-05-07T08:15:00Z' }],
      totalDias: 1,
    }
    const bytes = await gerarCertificado(dadosUmDia)
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('gera PDF mesmo sem nome (so email)', async () => {
    const dadosSemNome: DadosCertificado = {
      ...dadosTeste,
      nomeParticipante: 'joao@empresa.com',
    }
    await expect(gerarCertificado(dadosSemNome)).resolves.toBeInstanceOf(Uint8Array)
  })

  it('nao lanca excecao para evento com nome longo', async () => {
    const dadosNomeLongo: DadosCertificado = {
      ...dadosTeste,
      nomeEvento: 'SIPAT - Semana Interna de Prevencao de Acidentes do Trabalho 2026 Edicao Especial',
    }
    await expect(gerarCertificado(dadosNomeLongo)).resolves.toBeInstanceOf(Uint8Array)
  })
})
