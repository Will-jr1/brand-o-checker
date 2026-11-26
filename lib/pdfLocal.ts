import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { BrandRules, PaletteColor } from '../types';

// Leitura LOCAL de brandbook: roda 100% no navegador (pdf.js), sem IA, sem chave e sem limite de 4 MB.
// Só enxerga o que está como TEXTO no PDF: códigos hex, valores RGB e nomes das fontes embutidas.
// Papéis das cores, regras de logo, contraste e tom de voz NÃO são lidos.

const MAX_PAGES = 150;
const MAX_COLORS = 12;

interface Item {
  str: string;
  x: number;
  y: number;
  w: number;
  fontName: string;
}

interface RawItem {
  str: string;
  transform: number[];
  width: number;
  fontName: string;
}

interface Line {
  y: number;
  items: Item[];
  text: string;
  spans: { start: number; end: number; item: Item }[];
}

const isRawItem = (i: unknown): i is RawItem =>
  typeof i === 'object' && i !== null && typeof (i as RawItem).str === 'string' && Array.isArray((i as RawItem).transform);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();

const COLOR_WORDS = /\b(hex|rgb|cmyk|pantone|c[oó]digo|codigo|cores?|colou?rs?)\b/giu;

function cleanLabel(s: string): string {
  return s
    .replace(COLOR_WORDS, ' ')
    .replace(/[^\p{L}\s&'’-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s&'’-]+|[\s&'’-]+$/g, '')
    .trim();
}

const isNameLike = (s: string) => {
  const c = cleanLabel(s);
  return c.length >= 3 && c.length <= 32 && /\p{L}{3}/u.test(c);
};

function buildLines(items: Item[]): Line[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= 3) last.items.push(it);
    else lines.push({ y: it.y, items: [it], text: '', spans: [] });
  }
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    let text = '';
    for (const it of line.items) {
      if (text) text += ' ';
      const start = text.length;
      text += it.str;
      line.spans.push({ start, end: text.length, item: it });
    }
    line.text = text;
  }
  return lines;
}

function itemAt(line: Line, index: number): Item {
  return (line.spans.find((s) => index >= s.start && index < s.end) ?? line.spans[0]).item;
}

// Procura um nome para a cor: no próprio item, à esquerda na mesma linha, ou logo acima.
function findName(loc: Item, pageItems: Item[]): string | undefined {
  const own = cleanLabel(loc.str);
  if (isNameLike(own)) return own;

  const sameLine = pageItems
    .filter((c) => c !== loc && Math.abs(c.y - loc.y) <= 3 && c.x + c.w <= loc.x + 2 && loc.x - (c.x + c.w) <= 150 && isNameLike(c.str))
    .sort((a, b) => b.x - a.x);
  if (sameLine[0]) return cleanLabel(sameLine[0].str);

  const cx = loc.x + loc.w / 2;
  const above = pageItems
    .filter((c) => {
      const dy = c.y - loc.y;
      const ccx = c.x + c.w / 2;
      return dy > 3 && dy <= 60 && Math.abs(ccx - cx) <= Math.max(60, loc.w) && isNameLike(c.str);
    })
    .sort((a, b) => a.y - b.y || Math.abs(a.x - loc.x) - Math.abs(b.x - loc.x));
  return above[0] ? cleanLabel(above[0].str) : undefined;
}

function brandNameFromFile(fileName: string): string {
  const base = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\b(brand\s*book|brandbook|brand|book|manual|guia|guide|guidelines|identidade|visual|marca|de|da|do|final|v\d+|20\d{2})\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return 'Marca (leitura local)';
  return base.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

function fontFamily(raw: string): string | undefined {
  let n = raw.replace(/^[A-Z]{6}\+/, '').split(/[-,]/)[0];
  n = n.replace(/(PSMT|MT|PS)$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  if (n.length < 3) return undefined;
  if (/^(g_d\d|Type\s?3|Symbol|ZapfDingbats|Wingdings|Dingbats)/i.test(n)) return undefined;
  return n;
}

// ---------------------------------------------------------------------------
// Núcleo (recebe um documento do pdf.js — fácil de testar fora do navegador).
// O documento precisa ter sido aberto com fontExtraProperties: true para os nomes das fontes aparecerem.
// ---------------------------------------------------------------------------

export async function extractRulesFromDocument(
  doc: PDFDocumentProxy,
  fileName: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ rules: BrandRules; warnings: string[] }> {
  const warnings: string[] = [];
  const total = Math.min(doc.numPages, MAX_PAGES);
  if (doc.numPages > MAX_PAGES) warnings.push(`Lidas só as primeiras ${MAX_PAGES} páginas de ${doc.numPages}.`);

  const colors = new Map<string, { name?: string; count: number; order: number }>();
  const fontChars = new Map<string, number>();
  let totalChars = 0;

  const addColor = (hex: string, name: string | undefined) => {
    const cur = colors.get(hex);
    if (cur) {
      cur.count += 1;
      if (!cur.name && name) cur.name = name;
    } else {
      colors.set(hex, { name, count: 1, order: colors.size });
    }
  };

  for (let p = 1; p <= total; p++) {
    onProgress?.(p - 1, total);
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: Item[] = (content.items as unknown[]).filter(isRawItem).filter((i) => i.str.trim()).map((i) => ({
      str: i.str.trim(),
      x: i.transform[4],
      y: i.transform[5],
      w: i.width,
      fontName: i.fontName
    }));
    totalChars += items.reduce((n, i) => n + i.str.length, 0);

    // --- fontes: precisa carregar as fontes da página antes de ler os nomes reais
    try {
      await page.getOperatorList();
      const seen = new Map<string, string | undefined>();
      for (const it of items) {
        if (!seen.has(it.fontName)) {
          let fam: string | undefined;
          try {
            const f = page.commonObjs.get(it.fontName) as { name?: string } | undefined;
            fam = f?.name ? fontFamily(f.name) : undefined;
          } catch {
            fam = undefined;
          }
          seen.set(it.fontName, fam);
        }
        const fam = seen.get(it.fontName);
        if (fam) fontChars.set(fam, (fontChars.get(fam) ?? 0) + it.str.length);
      }
    } catch {
      // sem fontes: segue só com as cores
    }

    // --- cores: hex e RGB, procurados no texto de cada linha
    for (const line of buildLines(items)) {
      const t = line.text;
      const lineHasColorWord = /\b(hex|rgb|cmyk|cor|cores|color|colour)\b/i.test(t);
      for (const m of t.matchAll(/#([0-9a-f]{6})\b/gi)) {
        const loc = itemAt(line, m.index ?? 0);
        // "#123456" em meio a uma frase ("Pedido #123456") não é cor: só vale isolado ou com palavra de cor na linha
        if (!/[a-f]/i.test(m[1]) && loc.str !== m[0] && !lineHasColorWord) continue;
        addColor('#' + m[1].toUpperCase(), findName(loc, items));
      }
      const rgbRes = [
        /\brgb\s*[:=]?\s*\(?\s*(\d{1,3})\s*[,\s/-]\s*(\d{1,3})\s*[,\s/-]\s*(\d{1,3})\s*\)?/gi,
        /\bR\s*[:=]?\s*(\d{1,3})\s+G\s*[:=]?\s*(\d{1,3})\s+B\s*[:=]?\s*(\d{1,3})\b/g
      ];
      for (const re of rgbRes) {
        for (const m of t.matchAll(re)) {
          const [r, g, b] = [m[1], m[2], m[3]].map(Number);
          if (r > 255 || g > 255 || b > 255) continue;
          addColor(toHex(r, g, b), findName(itemAt(line, m.index ?? 0), items));
        }
      }
    }
    page.cleanup();
  }
  onProgress?.(total, total);

  if (totalChars < 20) {
    warnings.push('O PDF não tem texto legível (provavelmente escaneado ou só imagens). Use o JSON manual ou a leitura por IA.');
  }

  // --- monta o resultado
  const ranked = [...colors.entries()].sort((a, b) => b[1].count - a[1].count || a[1].order - b[1].order);
  if (ranked.length > MAX_COLORS) warnings.push(`Encontradas ${ranked.length} cores; mantidas as ${MAX_COLORS} mais citadas.`);
  const palette: PaletteColor[] = ranked.slice(0, MAX_COLORS).map(([hex, v]) => ({
    name: v.name ?? hex,
    hex,
    role: '—',
    expectedShare: '—'
  }));
  if (palette.length === 0 && totalChars >= 20) {
    warnings.push('Nenhuma cor em hex ou RGB foi encontrada como texto. Elas podem estar só em imagem: preencha a paleta no JSON.');
  }

  const fonts = [...fontChars.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  if (fonts.length) {
    warnings.push('As fontes vêm do que está embutido no PDF e podem ser as do próprio documento, não as da marca.');
  }

  const rules: BrandRules = { brand: brandNameFromFile(fileName) };
  if (palette.length) rules.palette = { colors: palette };
  if (fonts.length) rules.typography = { primaryFont: fonts[0], ...(fonts[1] ? { secondaryFont: fonts[1] } : {}) };

  return { rules, warnings };
}

// ---------------------------------------------------------------------------
// Carregador do navegador (pdf.js só é baixado quando alguém sobe um PDF)
// ---------------------------------------------------------------------------

export async function extractRulesFromPdfLocal(
  file: File,
  onProgress?: (done: number, total: number) => void
): Promise<{ rules: BrandRules; warnings: string[] }> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  // fontExtraProperties: sem isso o pdf.js descarta o nome real das fontes
  const task = pdfjs.getDocument({ data, fontExtraProperties: true });
  let doc: PDFDocumentProxy;
  try {
    doc = await task.promise;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'PasswordException') throw new Error('O PDF está protegido por senha.');
    if (name === 'InvalidPDFException') throw new Error('O arquivo não parece ser um PDF válido.');
    throw err;
  }
  try {
    return await extractRulesFromDocument(doc, file.name, onProgress);
  } finally {
    void task.destroy();
  }
}
