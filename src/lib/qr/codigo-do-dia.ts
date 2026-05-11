import { DiaDeEvento, ResultadoValidacao } from '@/types'

/**
 * Verifica se o momento atual está dentro da JanelaDeTempo de um DiaDeEvento.
 *
 * A JanelaDeTempo começa em `hora_abertura` e dura `duracao_minutos`.
 * Exemplo: abertura 08:00, duração 60 min → janela de 08:00 às 09:00.
 *
 * @param dia - O DiaDeEvento com data, hora_abertura e duracao_minutos.
 * @param agora - Momento a verificar. Padrão: Date atual (injetável para testes).
 * @returns `true` se `agora` está dentro da JanelaDeTempo, `false` caso contrário.
 * @example
 * const dia = { data: '2026-05-07', hora_abertura: '08:00:00', duracao_minutos: 60, ... }
 * estaDentroJanela(dia, new Date('2026-05-07T08:30:00')) // true
 * estaDentroJanela(dia, new Date('2026-05-07T09:01:00')) // false
 */
export function estaDentroJanela(
  dia: Pick<DiaDeEvento, 'data' | 'hora_abertura' | 'duracao_minutos'>,
  agora: Date = new Date()
): boolean {
  const [ano, mes, diaNum] = dia.data.split('-').map(Number)
  const parts = dia.hora_abertura.split(':')
  const hora = Number(parts[0])
  const minuto = Number(parts[1])
  // parts[2] pode ser undefined (formato HH:MM) ou NaN-safe via fallback
  const segundo = Number(parts[2] || '0')

  // hora_abertura é cadastrada no horário de Brasília (UTC-3).
  // O servidor roda em UTC, então somamos 3h para converter BRT → UTC,
  // mantendo a comparação consistente com new Date() que também é UTC.
  const BRT_OFFSET_H = 3
  const abertura = new Date(Date.UTC(ano, mes - 1, diaNum, hora + BRT_OFFSET_H, minuto, segundo))
  const fechamento = new Date(abertura.getTime() + dia.duracao_minutos * 60 * 1000)

  return agora >= abertura && agora <= fechamento
}

/**
 * Valida o CodigoDoDia recebido via QR code contra o DiaDeEvento armazenado no banco.
 *
 * Verifica em ordem:
 * 1. Se o DiaDeEvento foi ativado (codigo_do_dia não é null)
 * 2. Se o código recebido bate com o armazenado (case-sensitive)
 * 3. Se o momento atual está dentro da JanelaDeTempo
 *
 * A verificação de presença duplicada é responsabilidade da API Route, não desta função.
 *
 * @param dia - DiaDeEvento completo buscado do banco.
 * @param codigoRecebido - CodigoDoDia enviado pelo Participante via QR code.
 * @param agora - Momento da validação. Padrão: Date atual (injetável para testes).
 * @returns ResultadoValidacao com `valido: true` ou `valido: false` + motivo.
 * @example
 * const resultado = validarCodigoDoDia(dia, 'azul42')
 * if (!resultado.valido) console.log(resultado.motivo) // 'fora_da_janela'
 */
export function validarCodigoDoDia(
  dia: DiaDeEvento,
  codigoRecebido: string,
  agora: Date = new Date()
): ResultadoValidacao {
  if (!dia.codigo_do_dia) {
    return { valido: false, motivo: 'dia_nao_ativado' }
  }

  if (dia.codigo_do_dia !== codigoRecebido) {
    return { valido: false, motivo: 'codigo_incorreto' }
  }

  if (!estaDentroJanela(dia, agora)) {
    return { valido: false, motivo: 'fora_da_janela' }
  }

  return { valido: true }
}
