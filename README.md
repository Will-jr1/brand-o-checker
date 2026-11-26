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
| Leitura de PDF de manual | **Simulada** — só usa o nome do arquivo como nome da marca; as regras continuam as anteriores. Use `.json` para regras reais |
| Identificação de tipografia | **Heurística** — não há OCR nem análise de glifos |
| Área de respiro do logo e tom de voz | **Heurística** — os valores vêm de faixas fixas; nas peças de exemplo, os desvios são pré-definidos |

## Rodando localmente

Requer Node 20+.

```bash
npm install
npm run dev
```

Outros comandos:

```bash
npm run typecheck   # tsc --noEmit (modo strict)
npm run build       # typecheck + build de produção em dist/
npm run preview     # serve o build localmente
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
src/
  App.tsx      # lógica de cor, motor de auditoria e interface (arquivo único por enquanto)
  main.tsx     # entrypoint
  index.css    # Tailwind v4
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, lucide-react.
