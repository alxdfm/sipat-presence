import { describe, it, expect } from 'vitest'
import { estaDentroJanela, validarCodigoDoDia } from '@/lib/qr/codigo-do-dia'
import { DiaDeEvento } from '@/types'

const diaBase: DiaDeEvento = {
  id: 'dia-1',
  evento_id: 'evento-1',
  data: '2026-05-07',
  hora_abertura: '08:00:00',
  duracao_minutos: 60,
  codigo_do_dia: 'azul42',
  criado_em: '2026-05-06T00:00:00Z',
}

describe('estaDentroJanela', () => {
  it('retorna true quando agora esta no inicio da janela', () => {
    const agora = new Date('2026-05-07T08:00:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(true)
  })

  it('retorna true quando agora esta no meio da janela', () => {
    const agora = new Date('2026-05-07T08:30:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(true)
  })

  it('retorna true quando agora esta exatamente no fechamento', () => {
    const agora = new Date('2026-05-07T09:00:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(true)
  })

  it('retorna false quando agora esta apos o fechamento', () => {
    const agora = new Date('2026-05-07T09:01:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(false)
  })

  it('retorna false quando agora esta antes da abertura', () => {
    const agora = new Date('2026-05-07T07:59:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(false)
  })

  it('retorna false quando agora e de outro dia', () => {
    const agora = new Date('2026-05-08T08:30:00')
    expect(estaDentroJanela(diaBase, agora)).toBe(false)
  })

  it('respeita duracaoMinutos customizado', () => {
    const diaCustom = { ...diaBase, duracao_minutos: 30 }
    const dentroJanela = new Date('2026-05-07T08:29:00')
    const foraJanela = new Date('2026-05-07T08:31:00')
    expect(estaDentroJanela(diaCustom, dentroJanela)).toBe(true)
    expect(estaDentroJanela(diaCustom, foraJanela)).toBe(false)
  })
})

describe('validarCodigoDoDia', () => {
  it('retorna valido:true quando codigo correto e dentro da janela', () => {
    const agora = new Date('2026-05-07T08:30:00')
    const resultado = validarCodigoDoDia(diaBase, 'azul42', agora)
    expect(resultado.valido).toBe(true)
  })

  it('retorna dia_nao_ativado quando codigo_do_dia e null', () => {
    const diaSemCodigo = { ...diaBase, codigo_do_dia: null }
    const agora = new Date('2026-05-07T08:30:00')
    const resultado = validarCodigoDoDia(diaSemCodigo, 'azul42', agora)
    expect(resultado.valido).toBe(false)
    if (!resultado.valido) expect(resultado.motivo).toBe('dia_nao_ativado')
  })

  it('retorna codigo_incorreto quando codigo nao bate', () => {
    const agora = new Date('2026-05-07T08:30:00')
    const resultado = validarCodigoDoDia(diaBase, 'codigoErrado', agora)
    expect(resultado.valido).toBe(false)
    if (!resultado.valido) expect(resultado.motivo).toBe('codigo_incorreto')
  })

  it('retorna fora_da_janela quando horario invalido', () => {
    const agora = new Date('2026-05-07T10:00:00')
    const resultado = validarCodigoDoDia(diaBase, 'azul42', agora)
    expect(resultado.valido).toBe(false)
    if (!resultado.valido) expect(resultado.motivo).toBe('fora_da_janela')
  })

  it('e case-sensitive na comparacao do codigo', () => {
    const agora = new Date('2026-05-07T08:30:00')
    const resultadoMaiusculo = validarCodigoDoDia(diaBase, 'AZUL42', agora)
    expect(resultadoMaiusculo.valido).toBe(false)
    if (!resultadoMaiusculo.valido) expect(resultadoMaiusculo.motivo).toBe('codigo_incorreto')
  })

  it('verifica codigo antes de verificar janela', () => {
    const agora = new Date('2026-05-07T10:00:00') // fora da janela
    const resultado = validarCodigoDoDia(diaBase, 'codigoErrado', agora)
    expect(resultado.valido).toBe(false)
    if (!resultado.valido) expect(resultado.motivo).toBe('codigo_incorreto')
  })
})
