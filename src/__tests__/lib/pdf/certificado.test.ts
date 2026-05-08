import { describe, it, expect } from 'vitest'
import { gerarCertificado } from '@/lib/pdf/certificado'
import { DadosCertificado } from '@/types'

const dadosTeste: DadosCertificado = {
  nomeParticipante: 'Joao Silva',
  emailParticipante: 'joao@empresa.com',
  nomeEvento: 'SIPAT 2026',
  dias: [
    { data: '2026-05-07', nome: 'Palestra sobre assedio', presente: true },
    { data: '2026-05-08', nome: 'Dinamica de seguranca', presente: true },
    { data: '2026-05-09', nome: 'Encerramento', presente: false },
  ],
  diasPresentes: 2,
  totalDias: 3,
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

  it('gera PDF com apenas 1 dia presente', async () => {
    const dadosUmDia: DadosCertificado = {
      ...dadosTeste,
      dias: [{ data: '2026-05-07', nome: 'Palestra', presente: true }],
      diasPresentes: 1,
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

  it('gera PDF com dias sem nome', async () => {
    const dadosSemNomeDia: DadosCertificado = {
      ...dadosTeste,
      dias: [
        { data: '2026-05-07', nome: null, presente: true },
        { data: '2026-05-08', nome: null, presente: false },
      ],
      diasPresentes: 1,
      totalDias: 2,
    }
    await expect(gerarCertificado(dadosSemNomeDia)).resolves.toBeInstanceOf(Uint8Array)
  })
})
