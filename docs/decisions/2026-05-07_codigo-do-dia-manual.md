# Registro de Decisão Técnica

## Decisão: CodigoDoDia inserido manualmente pelo Organizador a cada dia

**Data:** 2026-05-07  
**Status:** aceita  
**Autor:** Alexandre Fraga

---

## Contexto

A arquitetura inicial documentava o `CodigoDoDia` como um HMAC-SHA256 derivado
de um `DAILY_CODE_SECRET` fixo + data ISO — nunca armazenado no banco. Durante o
planejamento da implementação, ficou claro que o Organizador precisa de controle
operacional: o QR code do dia só deve ser gerado e exibido quando o Organizador
decidir, na manhã do evento, após inserir o código manualmente.

---

## Opções consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| HMAC auto-gerado (arquitetura original) | Sem passo manual, derivado seguro | Código "existe" antes do evento, sem controle do Organizador para ativar |
| Organizador digita ao criar o DiaDeEvento | Planejamento antecipado | Código definido dias antes, janela de exposição maior |
| **Organizador digita toda manhã para ativar** | Controle operacional máximo, código só existe no dia | Exige ação manual diária; se esquecer, QR fica bloqueado |

---

## Decisão tomada

> **Organizador digita o CodigoDoDia toda manhã via /admin**

O campo `codigo_do_dia` fica `NULL` no banco quando o DiaDeEvento é criado.
Na manhã do evento, o Organizador acessa `/admin`, insere o código e confirma.
Só após isso o QR code pode ser gerado e exibido. A validação server-side compara
o código recebido com o valor armazenado.

---

## Consequências

**Positivas:**
- Controle operacional: o Organizador ativa o dia intencionalmente
- Código existe por um período menor (menor janela de exposição)
- Flexibilidade: o código pode ser qualquer string que o Organizador queira

**Negativas / Trade-offs:**
- `codigo_do_dia` é armazenado no banco (antes era derivado, nunca persistido)
- Exige ação manual diária — se o Organizador esquecer, o QR code não funciona
- Sem o `DAILY_CODE_SECRET` de env, a segurança depende da complexidade do código escolhido

**Impacto no código:**
- `DiaDeEvento.codigo_do_dia`: coluna nullable no banco, preenchida via PATCH no admin
- `src/lib/qr/codigo-do-dia.ts`: não há HMAC — apenas leitura do campo do banco
- `POST /api/presenca`: validação compara `code` da query string com `codigo_do_dia` do banco
- `/admin`: precisa de UI para inserir o código e gerar o QR code após confirmação

---

## Revisão futura

Revisitar se surgir necessidade de múltiplos Organizadores simultâneos ou auditoria
de quem inseriu o código de cada dia.
