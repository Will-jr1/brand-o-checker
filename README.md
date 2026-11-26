# Brand-o-checker

MVP de auditoria de marca no navegador. Você escolhe (ou edita) as regras de um brandbook em JSON, sobe uma peça em PNG/JPG e recebe um **Brand Score** com diagnóstico por critério, marcações sobre a imagem e um relatório em Markdown pronto para colar no Jira/Slack.

## O que é real e o que é simulado

Esta é uma versão de prova de conceito. Vale deixar claro:

| Parte | Status |
| --- | --- |
| Extração de cores dos pixels (Canvas, quantização + clusterização) | **Real** |
| Distância perceptual entre cor extraída e paleta oficial (Delta-E CIE76 em CIE LAB) | **Real** |
| Contraste WCAG 2.1 entre as cores dominantes | **Real** |
| Regras editáveis ao vivo (o score recalcula ao mudar o JSON) | **Real** |
| Exportar relatório em Markdown | **Real** |
| Leitura de PDF de manual | **Dois modos.** Local (padrão, grátis): pdf.js no navegador lê cores em hex/RGB e fontes embutidas. Por IA (opcional): a API da Anthropic lê o manual inteiro. Nos dois casos, revise o JSON (o app o abre automaticamente) |
| Identificação de tipografia | **Heurística** — não há OCR nem análise de glifos |
| Área de respiro do logo e tom de voz | **Heurística** — os valores vêm de faixas fixas; nas peças de exemplo, os desvios são pré-definidos |

## Rodando localmente

Requer Node 20+.

```bash
npm install
npm run dev   # só o front (sem leitura de PDF; veja "Desenvolvimento local")
```

Outros comandos:

```bash
npm run typecheck   # tsc --noEmit (modo strict)
npm run build       # typecheck + build de produção em dist/
npm run preview     # serve o build localmente
```

## Leitura de manual: dois modos

**Local (padrão, grátis).** Roda 100% no navegador com pdf.js. Sem servidor, sem chave e sem limite de 4 MB. Lê só o que está como **texto** no PDF:

- cores escritas como `#RRGGBB`, `RGB 37 99 235`, `rgb(37, 99, 235)` ou `R 37 G 99 B 235`;
- nomes das fontes embutidas (as mais usadas viram `primaryFont` e `secondaryFont`; podem ser as do próprio documento, não as da marca);
- o nome da cor é um palpite (texto ao lado ou logo acima); papéis, logo, contraste e tom de voz **não** são lidos;
- PDF escaneado ou com cores só em imagem não funciona: use o JSON manual ou o modo IA.

**Por IA (opcional, marque a caixa no app).** Precisa de chave e de crédito na API da Anthropic. Veja a seção abaixo.

## Leitura por IA (Vercel)

O upload de PDF chama a função `api/extract-manual.ts`, que envia o documento ao modelo e força uma resposta estruturada no formato das regras. A saída é validada (hex normalizados, campos desconhecidos descartados) e campos ausentes no manual ficam de fora em vez de inventados.

**Configuração na Vercel**

1. Em *Settings → Environment Variables*, crie `ANTHROPIC_API_KEY` (e, opcionalmente, `ANTHROPIC_MODEL`).
2. Faça um novo deploy (variáveis só valem para deploys criados depois de salvas).
3. Defina um limite de gasto para a chave no console da Anthropic. O endpoint é público: sem isso, qualquer pessoa com a URL pode gerar custo na sua chave. Considere também uma regra de rate limit no Vercel Firewall.

**Limites**

- PDF de até ~4 MB: as funções da Vercel aceitam no máximo 4,5 MB de corpo. Para manuais maiores, comprima o arquivo ou exporte só as páginas de identidade. A API também limita o número de páginas por PDF (100 na documentação consultada).
- Brandbooks em PDF escaneado ou com muito texto em imagem funcionam pior; revise o resultado.

**Desenvolvimento local**

`npm run dev` serve só o front. Para testar a leitura de PDF localmente:

```bash
npm i -g vercel
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY
vercel dev
```

## Formato das regras (JSON)

Todos os campos são opcionais; o que faltar cai em valores padrão.

```json
{
  "brand": "Aura Tech",
  "palette": {
    "toleranceDeltaE": 14,
    "colors": [
      { "name": "Electric Cobalt", "hex": "#2563EB", "role": "Primária / Ação", "expectedShare": "15-30%" }
    ]
  },
  "typography": { "primaryFont": "Space Grotesk", "minHierarchyRatio": 2.2 },
  "logo": { "clearspaceModule": "1.5x altura do símbolo", "minMarginPercent": 6 },
  "contrast": { "minWcagRatio": 4.5 },
  "artDirection": { "style": "...", "toneOfVoice": "..." }
}
```

## Pesos do score

Crítico (paleta + logo) 40% · Estrutural (tipografia + contraste) 35% · Estético e verbal 25%.

## Estrutura

```
api/
  extract-manual.ts  # Vercel Function: PDF -> regras JSON (API da Anthropic), modo IA
src/
  App.tsx      # lógica de cor, motor de auditoria e interface (arquivo único por enquanto)
  lib/pdfLocal.ts  # leitura local de PDF (pdf.js, carregado sob demanda)
  components/UploadDropzone.tsx  # dropzone (arrastar/soltar) com estados vazio, arrastando, carregando e erro
  types.ts     # tipos compartilhados
  main.tsx     # entrypoint
  index.css    # Tailwind v4
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react, pdf.js (`pdfjs-dist`), Vercel Functions + `@anthropic-ai/sdk` (modo IA).
