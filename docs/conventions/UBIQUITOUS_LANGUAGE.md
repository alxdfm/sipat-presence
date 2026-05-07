# Linguagem Ubíqua — Glossário do Domínio

> **Esta é a source of truth para todos os nomes usados no projeto.**
> Código, variáveis, funções, tipos, rotas, mensagens de UI e documentação
> devem usar EXATAMENTE os termos definidos aqui. Sem sinônimos.

---

## Glossário

### Entidades principais

**Evento** — O evento de SIPAT como um todo. Tem nome, descrição e N dias.
[Nunca use: sipat, semana, campanha]

**DiaDeEvento** — Um dia específico dentro do Evento. Tem data, hora de abertura
da janela e duração. É a unidade de presença.
[Nunca use: sessao, aula, dia, turno]

**Participante** — O funcionário que se autentica e registra presença.
Identificado pelo email Google.
[Nunca use: usuario, funcionario, colaborador, user]

**Presenca** — O registro de que um Participante esteve presente em um DiaDeEvento.
Imutável após criada.
[Nunca use: checkin, check-in, comparecimento, registro]

**CodigoDoDia** — O token HMAC embutido no QR code de cada DiaDeEvento.
Válido apenas dentro da JanelaDeTempo do DiaDeEvento.
[Nunca use: token, hash, senha, code]

**JanelaDeTempo** — O intervalo de tempo durante o qual uma Presença pode ser
registrada. Definida por `hora_abertura` + `duracao_minutos` no DiaDeEvento.
[Nunca use: periodo, horario, intervalo]

**Certificado** — O PDF gerado client-side com o histórico de Presenças do
Participante. Não é armazenado — gerado on-demand.
[Nunca use: diploma, comprovante, atestado]

**Organizador** — O usuário com papel admin que cria Eventos e gera QR codes.
[Nunca use: admin (só como papel técnico), gestor, coordenador]

---

### Ações / Verbos

**registrarPresenca** — Ação de gravar uma Presença no banco após validação.
[Nunca use: confirmarPresenca, fazerCheckin, marcarPresenca]

**validarCodigo** — Verificar server-side se o CodigoDoDia é correto e se está
dentro da JanelaDeTempo.
[Nunca use: checarCodigo, verificarToken]

**gerarCertificado** — Criar o PDF do Certificado no browser com pdf-lib.
[Nunca use: emitirCertificado, baixarComprovante, exportarPDF]

**gerarQRCode** — Gerar a imagem do QR code com a URL do DiaDeEvento embutida.
[Nunca use: criarQR, exportarQR]

---

### Estados / Status

**dentro_da_janela** — Quando o momento atual está entre hora_abertura e
hora_abertura + duracao_minutos do DiaDeEvento.

**fora_da_janela** — Quando o QR code foi escaneado fora do intervalo válido.
Presença não pode ser registrada.

**presenca_duplicada** — Quando o Participante já registrou Presença neste
DiaDeEvento. Idempotente — não gera erro grave, apenas aviso.

---

### Campos técnicos (mapeamento código → domínio)

| No código | No domínio | Motivo |
|-----------|-----------|--------|
| `userId` | `participanteId` | Usuários neste sistema são sempre Participantes |
| `eventId` | `eventoId` | — |
| `dayId` | `diaDe EventoId` | — |
| `code` (query param) | `CodigoDoDia` | Nome curto na URL por praticidade |

---

## Termos BANIDOS neste projeto

| Banido | Use em vez disso | Motivo |
|--------|-----------------|--------|
| `user` | `participante` | Ambíguo entre Participante e Organizador |
| `checkin` | `presenca` | Linguagem de app de localização, não de SIPAT |
| `token` | `codigoDoDia` | Token é genérico demais |
| `admin` (no domínio) | `organizador` | admin é papel técnico, não termo de domínio |
