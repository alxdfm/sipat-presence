# 2026-05-06 — Stack inicial do projeto

## Contexto

Projeto novo. Precisávamos escolher stack para sistema de presença SIPAT.

## Decisão

Next.js 15 + Supabase + pdf-lib + Vercel.

## Motivo

- **Supabase** sobre MongoDB: dados são relacionais (Participante → Presença → DiaDeEvento). Supabase também entrega Google OAuth nativo, eliminando NextAuth.
- **Supabase** sobre Neon: Neon é só banco — ainda precisaríamos resolver auth separado.
- **Next.js API Routes** como backend: sem necessidade de servidor separado. Código server-side é tão seguro quanto Express — nunca exposto ao cliente.
- **pdf-lib client-side** para certificado: elimina storage, elimina geração server-side, sem custo extra.
- **Vercel** para deploy: integração nativa com Next.js, free tier suficiente.

## Consequências

- Todo projeto em um repositório só (monorepo implícito via Next.js)
- CodigoDoDia validado apenas em API Routes — nunca no frontend
- Certificado nunca armazenado — gerado e baixado direto no browser
