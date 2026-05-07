# Overview do Sistema

> Sistema de registro de presença para SIPAT com geração de certificado.

---

## O que este sistema faz

Plataforma web para registro de presença em eventos de SIPAT (Semana Interna de
Prevenção de Acidentes de Trabalho). Cada dia do evento tem um QR code único com
código embutido. O participante escaneia, autentica com Google e tem a presença
registrada automaticamente — desde que dentro da janela de 1 hora configurada pelo
organizador. Ao final, pode baixar o certificado de participação gerado no browser.

---

## Fluxo principal — Participante

```
[Participante escaneia QR code do dia]
        │
        ▼
[Abre URL com código do dia embutido]
        │
        ▼
[Login com Google via Supabase Auth]
        │
        ▼
[API Route valida: código correto + janela de tempo + sem duplicata]
        │
        ├─ inválido → mensagem de erro (fora do horário / código errado)
        │
        └─ válido → registra Presença no banco
                        │
                        ▼
              [Dashboard do participante]
              mostra dias confirmados
              botão "Baixar Certificado"
                        │
                        ▼
              [pdf-lib gera PDF no browser]
              nenhum upload, nenhum storage
```

## Fluxo principal — Organizador

```
[Organizador acessa /admin]
        │
        ▼
[Cria ou edita um Evento (SIPAT com N dias)]
        │
        ▼
[Para cada DiaDeEvento: define data + hora de abertura da janela]
        │
        ▼
[Sistema gera CodigoDoDia automaticamente (HMAC do secret + data)]
        │
        ▼
[Organizador exporta QR code do dia → exibe no telão / imprime]
```

---

## Módulos principais

| Módulo | Responsabilidade | Localização |
|--------|-----------------|-------------|
| auth | Login/logout Google, sessão do usuário | `src/lib/supabase/auth.ts` |
| presenca | Validação e registro de presença | `src/app/api/presenca/` |
| evento | CRUD de eventos e dias | `src/app/api/evento/` |
| certificado | Geração de PDF client-side | `src/lib/pdf/certificado.ts` |
| qr | Geração e validação do código diário | `src/lib/qr/codigo-do-dia.ts` |
| admin | Painel do organizador | `src/app/admin/` |
| dashboard | Painel do participante | `src/app/dashboard/` |

---

## Integrações externas

| Serviço | Tipo | Para que serve |
|---------|------|----------------|
| Supabase | SDK + REST | Banco de dados PostgreSQL e Auth Google OAuth |
| Vercel | Hosting | Deploy do Next.js |
| Google OAuth | OAuth 2.0 | Autenticação dos participantes (via Supabase) |

---

## Modelo de dados (alto nível)

```
Evento
  id, nome, descricao, criado_em

DiaDeEvento
  id, evento_id (FK), data, hora_abertura, duracao_minutos (default: 60)
  codigo_do_dia (HMAC gerado, não armazenado — derivado on-the-fly)

Participante
  id (= Supabase auth user id), email, nome, criado_em

Presenca
  id, participante_id (FK), dia_de_evento_id (FK), registrada_em
  UNIQUE (participante_id, dia_de_evento_id)  ← evita duplicata
```

---

## Segurança do código diário

O `CodigoDoDia` é um HMAC-SHA256 de `(DAILY_CODE_SECRET + data_iso)`.
- Nunca armazenado no banco — derivado sob demanda
- Validado apenas server-side (API Route)
- QR code contém a URL: `https://app.com/presenca?dia=ID&code=HMAC`
- Janela de tempo validada server-side contra `hora_abertura + duracao_minutos`
