# Stack & Arquitetura

> Atualizado em: 2026-05-06
> Atualize este arquivo sempre que uma decisão de stack mudar.

---

## Runtime & Linguagem

```
Linguagem principal:  TypeScript 5.x
Runtime:              Node 20 (via Vercel)
Package manager:      pnpm
```

## Frontend

```
Framework:      Next.js 15 (App Router)
Estilização:    Tailwind CSS 4
State:          React state local (sem estado global — app simples)
```

## Backend

```
Framework:      Next.js API Routes (server-side, no mesmo projeto)
ORM / DB:       Supabase JS SDK + PostgreSQL (via Supabase)
Auth:           Supabase Auth — Google OAuth nativo
```

## Infra & Deploy

```
Hosting:        Vercel (free tier)
CI/CD:          nenhum por ora
Monitoramento:  nenhum por ora
```

---

## Versões fixadas (crítico)

| Pacote | Versão | Motivo de fixar |
|--------|--------|-----------------|
| @supabase/supabase-js | ^2 | API Auth estável |
| pdf-lib | ^1.17 | Geração de PDF client-side sem servidor |

---

## Padrões de arquitetura

```
Padrão geral:     feature-based (cada feature em sua pasta em src/)
Separação:        page → api route → lib (sem service layer pesado)
Testes:           nenhum por ora
```

---

## O que NÃO usar neste projeto

- Não usar `axios` — `fetch` nativo é suficiente
- Não usar `moment.js` — usar `date-fns` ou `Intl` nativo
- Não usar `NextAuth` — Supabase Auth já resolve o Google OAuth
- Não usar `puppeteer` para PDF — `pdf-lib` client-side elimina a necessidade de servidor
- Não usar nenhum storage externo para certificados — PDF é gerado e baixado direto no browser
