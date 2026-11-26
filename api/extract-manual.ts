import Anthropic from '@anthropic-ai/sdk';

// Vercel Function (Node). Recebe o PDF cru no corpo (Content-Type: application/pdf),
// pede ao modelo as regras do brandbook em formato estruturado e devolve { rules, warnings }.

export const maxDuration = 60;

// Funções da Vercel aceitam no máximo 4,5 MB de corpo. Mandando o PDF cru (sem base64)
// sobra uma folga pequena para os cabeçalhos.
const MAX_BYTES = 4_200_000;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const SYSTEM_PROMPT = [
  'Você extrai regras de identidade visual de brandbooks em PDF.',
  'Chame a ferramenta save_brand_rules com SOMENTE o que está explícito no documento.',
  'Nunca invente valores: se um campo não aparece no manual, omita-o.',
  'Cores: informe o hex. Se o manual só traz CMYK ou Pantone, omita a cor, a menos que haja também RGB/hex.',
  'Não preencha toleranceDeltaE nem minWcagRatio a menos que o manual defina esses números.',
  'Mantenha nomes, papéis e textos no idioma original do manual.'
].join('\n');

const SAVE_RULES_TOOL = {
  name: 'save_brand_rules',
  description: 'Registra as regras de identidade visual extraídas do brandbook.',
  input_schema: {
    type: 'object' as const,
    properties: {
      brand: { type: 'string', description: 'Nome da marca' },
      palette: {
        type: 'object',
        properties: {
          toleranceDeltaE: { type: 'number' },
          colors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                hex: { type: 'string', description: 'Ex.: #2563EB' },
                role: { type: 'string', description: 'Função da cor (primária, fundo, acento...)' },
                expectedShare: { type: 'string', description: 'Proporção de uso esperada, ex.: 15-30%' }
              },
              required: ['name', 'hex']
            }
          }
        }
      },
      typography: {
        type: 'object',
        properties: {
          primaryFont: { type: 'string' },
          secondaryFont: { type: 'string' },
          minHierarchyRatio: { type: 'number' },
          forbiddenStyles: { type: 'array', items: { type: 'string' } }
        }
      },
      logo: {
        type: 'object',
        properties: {
          clearspaceModule: { type: 'string', description: 'Regra de área de respiro, como descrita' },
          minMarginPercent: { type: 'number' },
          allowedBackgrounds: { type: 'array', items: { type: 'string', description: 'hex' } }
        }
      },
      contrast: { type: 'object', properties: { minWcagRatio: { type: 'number' } } },
      artDirection: {
        type: 'object',
        properties: { style: { type: 'string' }, toneOfVoice: { type: 'string' } }
      }
    },
    required: ['brand']
  }
};

// ---------------------------------------------------------------------------
// Sanitização: a saída do modelo é tratada como entrada não confiável.
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const strArr = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const out = v.map(str).filter((x): x is string => !!x);
  return out.length ? out : undefined;
};

function normalizeHex(v: unknown): string | undefined {
  const s = str(v)?.replace(/^#/, '');
  if (!s) return undefined;
  if (/^[0-9a-f]{6}$/i.test(s)) return '#' + s.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(s)) return '#' + s.split('').map((c) => c + c).join('').toUpperCase();
  return undefined;
}

function pruneEmpty<T extends Record<string, unknown>>(o: T): T | undefined {
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

function sanitizeRules(input: unknown): { rules: Record<string, unknown>; warnings: string[] } {
  const warnings: string[] = [];
  const raw = isObj(input) ? input : {};

  const rawColors = isObj(raw.palette) && Array.isArray(raw.palette.colors) ? raw.palette.colors : [];
  const colors = rawColors.flatMap((c) => {
    if (!isObj(c)) return [];
    const hex = normalizeHex(c.hex);
    if (!hex) {
      warnings.push(`Cor "${str(c.name) ?? '?'}" ignorada: hex inválido ou ausente.`);
      return [];
    }
    return [{ name: str(c.name) ?? hex, hex, role: str(c.role) ?? '—', expectedShare: str(c.expectedShare) ?? '—' }];
  });
  if (colors.length === 0) {
    warnings.push('Nenhuma cor com hex foi encontrada no manual. Preencha a paleta manualmente no JSON.');
  }

  const p = isObj(raw.palette) ? raw.palette : {};
  const t = isObj(raw.typography) ? raw.typography : {};
  const l = isObj(raw.logo) ? raw.logo : {};
  const c = isObj(raw.contrast) ? raw.contrast : {};
  const a = isObj(raw.artDirection) ? raw.artDirection : {};

  const allowedBackgrounds = Array.isArray(l.allowedBackgrounds)
    ? l.allowedBackgrounds.map(normalizeHex).filter((x): x is string => !!x)
    : undefined;

  const rules = pruneEmpty({
    brand: str(raw.brand) ?? 'Marca sem nome',
    palette: pruneEmpty({
      toleranceDeltaE: num(p.toleranceDeltaE),
      colors: colors.length ? colors : undefined
    }),
    typography: pruneEmpty({
      primaryFont: str(t.primaryFont),
      secondaryFont: str(t.secondaryFont),
      minHierarchyRatio: num(t.minHierarchyRatio),
      forbiddenStyles: strArr(t.forbiddenStyles)
    }),
    logo: pruneEmpty({
      clearspaceModule: str(l.clearspaceModule),
      minMarginPercent: num(l.minMarginPercent),
      allowedBackgrounds: allowedBackgrounds?.length ? allowedBackgrounds : undefined
    }),
    contrast: pruneEmpty({ minWcagRatio: num(c.minWcagRatio) }),
    artDirection: pruneEmpty({ style: str(a.style), toneOfVoice: str(a.toneOfVoice) })
  });

  return { rules: rules ?? { brand: 'Marca sem nome' }, warnings };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY não está configurada no servidor.' }, 500);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/pdf')) {
    return json({ error: 'Envie o PDF no corpo da requisição com Content-Type: application/pdf.' }, 415);
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) return json({ error: 'Arquivo vazio.' }, 400);
  if (buf.length > MAX_BYTES) {
    return json({ error: 'PDF acima do limite de ~4 MB aceito pelo servidor.' }, 413);
  }
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return json({ error: 'O arquivo não parece ser um PDF válido.' }, 400);
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: [SAVE_RULES_TOOL],
      tool_choice: { type: 'tool', name: SAVE_RULES_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') }
            },
            { type: 'text', text: 'Extraia as regras de identidade visual deste brandbook.' }
          ]
        }
      ]
    });

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return json({ error: 'O modelo não retornou regras estruturadas. Tente novamente.' }, 502);
    }

    return json(sanitizeRules(toolUse.input));
  } catch (err) {
    console.error('extract-manual falhou:', err);
    const status = err instanceof Anthropic.APIError ? err.status : undefined;
    if (status === 413) return json({ error: 'O PDF é grande demais para o modelo (limite de páginas ou de tamanho).' }, 413);
    if (status === 401) return json({ error: 'Chave da API inválida no servidor.' }, 500);
    if (status === 429) return json({ error: 'Muitas requisições ao modelo agora. Tente de novo em instantes.' }, 429);
    return json({ error: 'Falha ao ler o manual. Tente novamente.' }, 502);
  }
}
