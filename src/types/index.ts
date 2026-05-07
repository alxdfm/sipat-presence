/**
 * Representa o evento de SIPAT completo.
 * Um Evento contém N DiaDeEvento.
 */
export interface Evento {
  id: string
  nome: string
  descricao: string | null
  criado_em: string
}

/**
 * Um dia específico dentro do Evento.
 * É a unidade de Presença — cada Participante registra presença por DiaDeEvento.
 *
 * @property codigo_do_dia - null até o Organizador ativar via /admin na manhã do evento.
 *   Quando null, o QR code não pode ser gerado nem exibido.
 * @property hora_abertura - Formato "HH:MM:SS". Início da JanelaDeTempo.
 * @property duracao_minutos - Duração da JanelaDeTempo a partir de hora_abertura.
 */
export interface DiaDeEvento {
  id: string
  evento_id: string
  data: string // formato ISO: "YYYY-MM-DD"
  hora_abertura: string // formato: "HH:MM:SS"
  duracao_minutos: number
  codigo_do_dia: string | null
  criado_em: string
}

/**
 * O funcionário autenticado via Google OAuth.
 * Identificado pelo email. O campo `role` diferencia Participante de Organizador.
 */
export interface Participante {
  id: string
  email: string
  nome: string | null
  role: 'participante' | 'organizador'
  criado_em: string
}

/**
 * Registro imutável de que um Participante esteve presente em um DiaDeEvento.
 * A constraint UNIQUE(participante_id, dia_de_evento_id) garante idempotência.
 */
export interface Presenca {
  id: string
  participante_id: string
  dia_de_evento_id: string
  registrada_em: string
}

/**
 * Payload para registrar uma Presença via POST /api/presenca.
 *
 * @property diaDeEventoId - ID do DiaDeEvento escaneado.
 * @property codigoDoDia - CodigoDoDia recebido via query param do QR code.
 */
export interface RegistrarPresencaPayload {
  diaDeEventoId: string
  codigoDoDia: string
}

/**
 * Resultado da validação do CodigoDoDia e JanelaDeTempo.
 *
 * Nota: `presenca_duplicada` NÃO está aqui — é tratada separadamente na API Route
 * via constraint UNIQUE do banco (código 23505). A função `validarCodigoDoDia`
 * nunca retorna esse motivo.
 */
export type ResultadoValidacao =
  | { valido: true }
  | { valido: false; motivo: 'codigo_incorreto' | 'fora_da_janela' | 'dia_nao_ativado' }

/**
 * Payload para criar um novo Evento via POST /api/evento.
 */
export interface CriarEventoPayload {
  nome: string
  descricao?: string
}

/**
 * Payload para criar um novo DiaDeEvento via POST /api/dia-de-evento.
 */
export interface CriarDiaDeEventoPayload {
  eventoId: string
  data: string // "YYYY-MM-DD"
  horaAbertura: string // "HH:MM"
  duracaoMinutos?: number
}

/**
 * Payload para ativar o CodigoDoDia de um DiaDeEvento via PATCH /api/dia-de-evento/[id]/ativar.
 */
export interface AtivarCodigoDoDiaPayload {
  codigoDoDia: string
}

/**
 * Participante com seu status de presença em um DiaDeEvento específico.
 * Retornado por `GET /api/dia-de-evento/[id]/participantes`.
 *
 * @property presenca - null se o Participante não compareceu neste dia.
 */
export interface ParticipanteComPresenca {
  id: string
  nome: string | null
  email: string
  presenca: { id: string; registrada_em: string } | null
}

/**
 * Presença enriquecida com dados do DiaDeEvento e Evento — shape retornado por
 * `GET /api/presenca/minhas`. Usado no Dashboard e na geração do Certificado.
 *
 * O campo `codigo_do_dia` é omitido propositalmente — Participantes não devem ter
 * acesso ao código fora do QR code.
 */
export interface PresencaEnriquecida {
  id: string
  registrada_em: string
  dia_de_evento: {
    id: string
    data: string
    hora_abertura: string
    evento: {
      id: string
      nome: string
      descricao: string | null
    } | null
  } | null
}

/**
 * Dados necessários para gerar o Certificado em PDF.
 */
export interface DadosCertificado {
  nomeParticipante: string
  emailParticipante: string
  nomeEvento: string
  presencas: Array<{
    data: string // "YYYY-MM-DD"
    registrada_em: string
  }>
  totalDias: number
}
