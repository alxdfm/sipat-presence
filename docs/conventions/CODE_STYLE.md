# Convenções de Código

> Stack: TypeScript + Next.js 15 App Router + Supabase

---

## Princípios gerais

1. **Explícito > implícito** — nomes longos e claros valem mais que abreviações
2. **Funções pequenas** — máximo 30 linhas por função; se maior, extraia
3. **Um nível de abstração por função** — não misture lógica de negócio com I/O
4. **Erro explícito** — nunca silenciar erros; sempre logar ou propagar
5. **Sem estado global** — state deve ser local ou passado explicitamente

---

## Nomenclatura

```
variáveis:      camelCase         → participanteId, codigoDoDia
constantes:     SCREAMING_SNAKE   → DAILY_CODE_SECRET, JANELA_MINUTOS
funções:        camelCase + verbo → registrarPresenca(), validarCodigo()
tipos/interfaces: PascalCase      → Participante, DiaDeEvento, Presenca
arquivos:       kebab-case        → codigo-do-dia.ts, registrar-presenca.ts
pastas:         kebab-case        → src/lib/qr/, src/app/api/presenca/
```

> **Atenção:** use sempre os termos do `UBIQUITOUS_LANGUAGE.md`.

---

## Padrões específicos da stack

### API Routes (Next.js App Router)

```typescript
// ✅ Sempre valide sessão antes de qualquer lógica
export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'não autenticado' }, { status: 401 })

  // lógica aqui...
}

// ✅ Retorne erros com status HTTP semântico
return Response.json({ error: 'fora da janela de tempo' }, { status: 422 })

// ❌ Nunca valide CodigoDoDia no cliente — sempre na API Route
```

### Supabase

```typescript
// ✅ Use o cliente server-side em API Routes
import { createServerClient } from '@/lib/supabase/server'

// ✅ Use o cliente browser em componentes client
import { createBrowserClient } from '@/lib/supabase/client'

// ❌ Nunca use a service_role key fora de API Routes
```

### Geração de Certificado (pdf-lib, client-side)

```typescript
// ✅ Toda geração de PDF acontece no browser — sem chamada de API
// ✅ Busque os dados de presença via API, gere o PDF localmente
async function gerarCertificado(presencas: Presenca[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // ...
  return pdfDoc.save()
}
```

### Funções assíncronas

```typescript
// ✅ Sempre trate o erro explicitamente
const { data, error } = await supabase.from('presencas').insert(...)
if (error) {
  console.error('registrarPresenca failed', error)
  return Response.json({ error: 'erro ao registrar presença' }, { status: 500 })
}

// ❌ Nunca ignore o error do Supabase
const { data } = await supabase.from('presencas').insert(...) // perigoso
```

---

## Estrutura de um módulo lib

```
src/lib/
  {feature}/
    index.ts           ← exportações públicas do módulo
    {feature}.ts       ← lógica principal
    {feature}.types.ts ← tipos e interfaces
```

---

## Comentários

```typescript
// ❌ Ruim — descreve O QUÊ (óbvio pelo código)
// Verifica se o código é válido
if (code === expectedCode) { ... }

// ✅ Bom — explica O POR QUÊ
// Comparação em tempo constante para evitar timing attacks
// mesmo que o impacto seja baixo em código de SIPAT interno
if (timingSafeEqual(code, expectedCode)) { ... }
```

---

## Imports

```typescript
// Ordem: externos → internos → tipos
import { PDFDocument } from 'pdf-lib'
import { createServerClient } from '@/lib/supabase/server'
import type { Presenca, DiaDeEvento } from '@/types'
```

---

## Proibido neste projeto

- Não usar `var` — sempre `const` / `let`
- Não usar `any` — usar `unknown` com narrowing ou tipos explícitos
- Não usar `console.log` em produção — usar `console.error` apenas em catch de API Routes
- Não validar `CodigoDoDia` no frontend — sempre server-side
- Não armazenar o Certificado em nenhum storage — gerado e descartado no browser
