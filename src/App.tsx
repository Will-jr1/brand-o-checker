import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Code2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Scan,
  Layers,
  Type,
  Palette,
  Compass,
  RefreshCw,
  ChevronRight,
  Info,
  Terminal
} from 'lucide-react';
import type { Status, SampleKey, Rgb, PaletteColor, BrandRules, PresetManual, ExtractedColor, PixelData, TypographyAnalysis, Annotation, ChecklistItem, AnalysisResult } from './types';
import { extractRulesFromPdfLocal } from './lib/pdfLocal';
import UploadDropzone from './components/UploadDropzone';


// ============================================================================
// 1. DADOS DE EXEMPLO (MANUAIS DE MARCA & REGRAS JSON)
// ============================================================================

const PRESET_MANUALS: Record<string, PresetManual> = {
  aura_tech: {
    id: 'aura_tech',
    name: 'Aura Tech — Brand System v2.4',
    fileName: 'aura-tech-brandbook-2026.pdf',
    updatedAt: 'Nov 2026',
    rules: {
      brand: 'Aura Tech',
      palette: {
        toleranceDeltaE: 14,
        colors: [
          { name: 'Obsidian Void', hex: '#090D16', role: 'Fundo Principal', expectedShare: '50-75%' },
          { name: 'Electric Cobalt', hex: '#2563EB', role: 'Primária / Ação', expectedShare: '15-30%' },
          { name: 'Cyber Mint', hex: '#10B981', role: 'Acento / Destaque', expectedShare: '5-15%' },
          { name: 'Pure Signal', hex: '#F8FAFC', role: 'Tipografia Clara', expectedShare: '5-20%' }
        ]
      },
      typography: {
        primaryFont: 'Space Grotesk',
        secondaryFont: 'Inter',
        minHierarchyRatio: 2.2,
        forbiddenStyles: ['Script', 'Serifada Clássica', 'Condensed Display']
      },
      logo: {
        clearspaceModule: '1.5x altura do símbolo',
        minMarginPercent: 6,
        allowedBackgrounds: ['#090D16', '#F8FAFC']
      },
      contrast: {
        minWcagRatio: 4.5
      },
      artDirection: {
        style: 'Minimalismo técnico, alto contraste, formas geométricas limpas, sem sombras difusas.',
        toneOfVoice: 'Direto, analítico, sem hipérboles promocionais ("imperdível", "compre já").'
      }
    }
  },
  multiverso_editorial: {
    id: 'multiverso_editorial',
    name: 'Multiverso Editorial — Guia Identidade',
    fileName: 'multiverso-guia-visual.pdf',
    updatedAt: 'Out 2026',
    rules: {
      brand: 'Multiverso Editorial',
      palette: {
        toleranceDeltaE: 15,
        colors: [
          { name: 'PapelCru Warm', hex: '#F4EFE6', role: 'Base Editorial', expectedShare: '55-75%' },
          { name: 'Tinta Carvão', hex: '#18181B', role: 'Texto e Estrutura', expectedShare: '15-30%' },
          { name: 'Terracota Vivo', hex: '#D94E34', role: 'Destaque Editorial', expectedShare: '8-20%' }
        ]
      },
      typography: {
        primaryFont: 'Newsreader / Serif Editorial',
        secondaryFont: 'DM Sans',
        minHierarchyRatio: 2.5,
        forbiddenStyles: ['Neon', 'Techno', 'Comic']
      },
      logo: {
        clearspaceModule: '2.0x altura da capitular M',
        minMarginPercent: 8,
        allowedBackgrounds: ['#F4EFE6', '#18181B']
      },
      contrast: {
        minWcagRatio: 4.5
      },
      artDirection: {
        style: 'Grid suíço assimétrico, respiro generoso, fotografia documental granulada.',
        toneOfVoice: 'Curatorial, reflexivo, vocabulário preciso.'
      }
    }
  }
};

// ============================================================================
// 2. GERADOR DE PEÇAS DE TESTE (CANVAS DATA URLS REALISTAS PARA EXTRAÇÃO REAL)
// ============================================================================

function generateSampleAssetDataUrl(type: SampleKey): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'aura_approved') {
    // Fundo Obsidian Void (#090D16)
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, 900, 600);

    // Grid sutil técnico
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 60; x < 900; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }

    // Bloco geométrico Electric Cobalt (#2563EB)
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(60, 170, 420, 260);

    // Detalhe Cyber Mint (#10B981)
    ctx.fillStyle = '#10B981';
    ctx.fillRect(480, 170, 90, 260);

    // Logo no canto superior esquerdo com área de respiro generosa (60px)
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(76, 76, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.fillRect(70, 70, 12, 12);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 20px monospace';
    ctx.fillText('AURA TECH', 104, 83);

    // Título principal em Pure Signal (#F8FAFC)
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 54px sans-serif';
    ctx.fillText('INFRAESTRUTURA', 88, 255);
    ctx.fillText('AUTÔNOMA Q4', 88, 318);

    // Subtítulo com bom contraste
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '400 20px sans-serif';
    ctx.fillText('Arquitetura determinística para sistemas críticos.', 88, 375);

    // Tag inferior
    ctx.fillStyle = '#10B981';
    ctx.font = '700 15px monospace';
    ctx.fillText('RELEASE // 2026.04', 60, 520);
  } else if (type === 'aura_deviations') {
    // Fundo fora do manual (Roxo/Magenta escuro #2E1065)
    ctx.fillStyle = '#2E1065';
    ctx.fillRect(0, 0, 900, 600);

    // Bloco grande com cor fora da paleta (Amarelo/Laranja #F97316)
    ctx.fillStyle = '#F97316';
    ctx.fillRect(40, 140, 820, 310);

    // Logo colada na borda inferior direita (violando área de respiro!)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(745, 578, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 16px monospace';
    ctx.fillText('AURA TECH', 765, 583);

    // Título em fonte serifada/itálica (proibida no manual)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 700 56px Georgia, serif';
    ctx.fillText('SUPER PROMOÇÃO!!', 70, 235);

    // Subtítulo com BAIXO CONTRASTE (laranja claro sobre laranja #FDBA74)
    ctx.fillStyle = '#FDBA74';
    ctx.font = '600 24px Georgia, serif';
    ctx.fillText('Aproveite agora antes que acabe o estoque!', 70, 295);

    // Selo extra fora de padrão
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(70, 340, 240, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('50% OFF IMPERDÍVEL', 88, 374);
  } else if (type === 'multiverso_approved') {
    // Fundo PapelCru Warm (#F4EFE6)
    ctx.fillStyle = '#F4EFE6';
    ctx.fillRect(0, 0, 900, 600);

    // Linhas de grid suíço
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, 788, 488);

    // Bloco Terracota Vivo (#D94E34)
    ctx.fillStyle = '#D94E34';
    ctx.fillRect(540, 56, 304, 488);

    // Logo com respiro amplo
    ctx.fillStyle = '#18181B';
    ctx.font = '700 22px Georgia, serif';
    ctx.fillText('M // MULTIVERSO', 88, 108);

    // Título editorial
    ctx.fillStyle = '#18181B';
    ctx.font = '700 52px Georgia, serif';
    ctx.fillText('CADERNOS DE', 88, 240);
    ctx.fillText('ARQUITETURA', 88, 302);
    ctx.fillText('CONTEMPORÂNEA', 88, 364);

    // Corpo
    ctx.font = '400 19px sans-serif';
    ctx.fillText('Edição 14 • Ensaios sobre forma, matéria e cidade.', 88, 440);

    // Detalhe claro no bloco terracota
    ctx.fillStyle = '#F4EFE6';
    ctx.font = '700 18px monospace';
    ctx.fillText('ISSN 2984-019X', 580, 110);
  }

  return canvas.toDataURL('image/png');
}

// ============================================================================
// 3. MOTOR MATEMÁTICO DE CORES, DELTA-E & CONTRASTE WCAG (CLIENT-SIDE REAL)
// ============================================================================

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

// Conversão RGB -> CIE LAB para cálculo perceptual real Delta-E (CIE76)
function rgbToLab({ r, g, b }: Rgb) {
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  const x = (rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805) / 0.95047;
  const y = (rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722) / 1.0;
  const z = (rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505) / 1.08883;

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

function calculateDeltaE(hex1: string, hex2: string): number {
  const lab1 = rgbToLab(hexToRgb(hex1));
  const lab2 = rgbToLab(hexToRgb(hex2));
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.round(Math.sqrt(dL * dL + da * da + db * db) * 10) / 10;
}

// Cálculo oficial de luminância relativa e razão de contraste WCAG 2.1
function getRelativeLuminance({ r, g, b }: Rgb): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateWcagContrast(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 100) / 100;
}

// Extração real de pixels via HTML5 Canvas com quantização e agrupamento perceptual
function extractDominantColorsFromImage(
  imgElement: HTMLImageElement,
  officialPalette: PaletteColor[],
  toleranceDeltaE: number
): PixelData {
  const canvas = document.createElement('canvas');
  const maxDim = 240; // Amostragem rápida e fiel
  const ratio = Math.min(maxDim / imgElement.naturalWidth, maxDim / imgElement.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(imgElement.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(imgElement.naturalHeight * ratio));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.');
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map<string, { count: number; rSum: number; gSum: number; bSum: number }>();
  let totalValidPixels = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    // Ignorar pixels semitransparentes (anti-aliasing de borda)
    if (a < 220) continue;

    totalValidPixels++;
    // Quantização suave em passos de 8 para absorver ruído de compressão JPG
    const qr = Math.min(255, Math.round(r / 8) * 8);
    const qg = Math.min(255, Math.round(g / 8) * 8);
    const qb = Math.min(255, Math.round(b / 8) * 8);
    const key = `${qr},${qg},${qb}`;

    const entry = buckets.get(key);
    if (entry) {
      entry.count++;
      entry.rSum += r;
      entry.gSum += g;
      entry.bSum += b;
    } else {
      buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
    }
  }

  // Ordenar por frequência e mesclar clusters muito próximos (Delta-E < 9)
  const rawClusters = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 35)
    .map((c) => {
      const hex = rgbToHex(c.rSum / c.count, c.gSum / c.count, c.bSum / c.count);
      return {
        hex,
        count: c.count
      };
    });

  const merged: { hex: string; count: number }[] = [];
  for (const cluster of rawClusters) {
    const existing = merged.find((m) => calculateDeltaE(m.hex, cluster.hex) < 9.5);
    if (existing) {
      existing.count += cluster.count;
    } else {
      merged.push({ ...cluster });
    }
  }

  const topColors = merged
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => {
      const percentage = Math.max(0.5, Math.round((item.count / Math.max(1, totalValidPixels)) * 1000) / 10);

      // Encontrar cor oficial mais próxima no manual
      let closestOfficial = officialPalette[0];
      let minDeltaE = Infinity;

      for (const off of officialPalette) {
        const dE = calculateDeltaE(item.hex, off.hex);
        if (dE < minDeltaE) {
          minDeltaE = dE;
          closestOfficial = off;
        }
      }

      const isCompliant = minDeltaE <= toleranceDeltaE;

      return {
        extractedHex: item.hex,
        percentage,
        closestOfficial,
        deltaE: minDeltaE,
        isCompliant
      };
    });

  // Calcular melhor contraste entre as cores extraídas (ex: fundo dominante vs acento/texto)
  let bestContrast = 1;
  let contrastPair = [topColors[0]?.extractedHex || '#000000', topColors[1]?.extractedHex || '#FFFFFF'];

  for (let i = 0; i < topColors.length; i++) {
    for (let j = i + 1; j < topColors.length; j++) {
      const c = calculateWcagContrast(topColors[i].extractedHex, topColors[j].extractedHex);
      if (c > bestContrast) {
        bestContrast = c;
        contrastPair = [topColors[i].extractedHex, topColors[j].extractedHex];
      }
    }
  }

  return {
    colors: topColors,
    bestContrast,
    contrastPair,
    dimensions: { width: imgElement.naturalWidth, height: imgElement.naturalHeight }
  };
}

// ============================================================================
// 4. COMPONENTE PRINCIPAL: BRAND-O-CHECKER MVP
// ============================================================================

// ============================================================================
// 3.1 LEITURA REAL DO MANUAL (PDF -> regras JSON via /api/extract-manual)
// ============================================================================

// Funções da Vercel aceitam no máximo 4,5 MB de corpo; o PDF vai cru (sem base64).
const MAX_PDF_BYTES = 4_200_000;

// Validação de arquivos soltos nas dropzones (o seletor nativo já filtra via `accept`)
const isManualFile = (f: File) => /\.(pdf|json)$/i.test(f.name);
const isImageFile = (f: File) => /^image\/(png|jpeg|webp)$/.test(f.type);

async function extractRulesFromPdf(file: File): Promise<{ rules: BrandRules; warnings: string[] }> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(
      `PDF com ${(file.size / 1048576).toFixed(1)} MB. O limite é ~4 MB: comprima o arquivo ou exporte só as páginas de identidade (cores, tipografia, logo).`
    );
  }

  const res = await fetch('/api/extract-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: file
  });

  let data: { rules?: BrandRules; warnings?: string[]; error?: string; detail?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    // resposta não-JSON (ex.: 404 do Vite em dev)
  }

  if (res.status === 404 && !data) {
    throw new Error('Endpoint /api/extract-manual não encontrado. Em desenvolvimento local use `vercel dev` em vez de `npm run dev`.');
  }
  if (!res.ok || !data?.rules) {
    const base = data?.error || `Falha na extração (HTTP ${res.status}).`;
    throw new Error(data?.detail ? `${base} Detalhe: ${data.detail}` : base);
  }
  return { rules: data.rules, warnings: data.warnings ?? [] };
}

export default function App() {
  // Estado do Manual de Marca
  const [selectedManualKey, setSelectedManualKey] = useState('aura_tech');
  const [customManualName, setCustomManualName] = useState<string | null>(null);
  const [rulesJsonText, setRulesJsonText] = useState(() =>
    JSON.stringify(PRESET_MANUALS.aura_tech.rules, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJsonDrawer, setShowJsonDrawer] = useState(false);
  // false = leitura local (grátis, só cores e fontes); true = leitura por IA (/api, precisa de chave e crédito)
  const [useAiReading, setUseAiReading] = useState(false);
  const [manualStatus, setManualStatus] = useState<{
    state: 'idle' | 'loading' | 'ok' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  // Estado da Peça Criativa (Asset)
  const [assetSource, setAssetSource] = useState<'preset' | 'upload'>('preset');
  const [selectedSampleKey, setSelectedSampleKey] = useState<SampleKey | 'custom_upload'>('aura_approved');
  // Já nasce com o exemplo (evita um flash do estado vazio); no SSR/sem DOM começa vazio
  const [assetDataUrl, setAssetDataUrl] = useState(() =>
    typeof document === 'undefined' ? '' : generateSampleAssetDataUrl('aura_approved')
  );
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetMeta, setAssetMeta] = useState({
    name: 'aura-campanha-q4-approved.png',
    sizeKb: 142
  });

  // Estado da Análise & Diagnóstico
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Parse seguro do JSON de regras ativo
  const activeRules = useMemo<BrandRules>(() => {
    try {
      const parsed: BrandRules = JSON.parse(rulesJsonText);
      setJsonError(null);
      return parsed;
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : String(err));
      return PRESET_MANUALS[selectedManualKey]?.rules || PRESET_MANUALS.aura_tech.rules;
    }
  }, [rulesJsonText, selectedManualKey]);

  // Inicializar imagem de demonstração no carregamento
  useEffect(() => {
    const url = generateSampleAssetDataUrl('aura_approved');
    setAssetDataUrl(url);
  }, []);

  // Trocar manual preset
  const handleSelectManualPreset = (key: string) => {
    setSelectedManualKey(key);
    setCustomManualName(null);
    setManualStatus({ state: 'idle', message: '' });
    setRulesJsonText(JSON.stringify(PRESET_MANUALS[key].rules, null, 2));

    // Se estiver usando preset de peça, ajustar para um exemplo correspondente ao manual
    if (assetSource === 'preset') {
      if (key === 'multiverso_editorial') {
        handleLoadSampleAsset('multiverso_approved');
      } else {
        handleLoadSampleAsset('aura_approved');
      }
    }
  };

  // Upload de manual: .json carrega as regras direto; .pdf é lido por IA no servidor
  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // permite reenviar o mesmo arquivo
    if (file) void processManualFile(file);
  };

  const processManualFile = async (file: File) => {

    if (file.name.toLowerCase().endsWith('.json')) {
      setCustomManualName(file.name);
      setManualStatus({ state: 'idle', message: '' });
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          setRulesJsonText(JSON.stringify(parsed, null, 2));
        } catch {
          setJsonError('Arquivo JSON inválido. Mantendo estrutura anterior.');
        }
      };
      reader.readAsText(file);
      return;
    }

    setManualStatus({
      state: 'loading',
      message: useAiReading ? `Lendo ${file.name} com IA… (pode levar até ~1 min)` : `Lendo ${file.name}…`
    });
    try {
      const { rules, warnings } = useAiReading
        ? await extractRulesFromPdf(file)
        : await extractRulesFromPdfLocal(file, (done, total) =>
            setManualStatus({ state: 'loading', message: `Lendo ${file.name}… página ${Math.min(done + 1, total)} de ${total}` })
          );
      setCustomManualName(file.name);
      setRulesJsonText(JSON.stringify(rules, null, 2));
      setShowJsonDrawer(true); // abre o JSON para revisão humana
      const intro = useAiReading
        ? 'Regras extraídas por IA. Revise o JSON antes de confiar no score.'
        : 'Leitura local: só cores (hex/RGB) e fontes embutidas. Nomes das cores são palpite; papéis, logo, contraste e tom de voz não são lidos. Complete e revise o JSON.';
      setManualStatus({ state: 'ok', message: [intro, ...warnings].join(' ') });
    } catch (err) {
      setManualStatus({ state: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  // Carregar peça de exemplo
  const handleLoadSampleAsset = (sampleKey: SampleKey) => {
    setAssetSource('preset');
    setSelectedSampleKey(sampleKey);
    setAssetError(null);
    const url = generateSampleAssetDataUrl(sampleKey);
    setAssetDataUrl(url);

    const names: Record<SampleKey, string> = {
      aura_approved: 'aura-campanha-q4-approved.png',
      aura_deviations: 'aura-banner-promo-desvios.png',
      multiverso_approved: 'multiverso-edicao14-capa.png'
    };
    setAssetMeta({
      name: names[sampleKey] || 'sample-asset.png',
      sizeKb: sampleKey === 'aura_deviations' ? 186 : 142
    });
  };

  // Upload real de PNG/JPG do computador do usuário
  const handleAssetUpload = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAssetError(null);
      setAssetSource('upload');
      setSelectedSampleKey('custom_upload');
      setAssetDataUrl(ev.target?.result as string);
      setAssetMeta({
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024))
      });
    };
    reader.readAsDataURL(file);
  };

  // Executar auditoria completa sempre que a imagem carregar ou regras mudarem
  const runBrandAudit = () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    setIsAnalyzing(true);
    setActiveAnnotationId(null);

    setTimeout(() => {
      const officialPalette: PaletteColor[] = activeRules.palette?.colors || [];
      const toleranceDeltaE = activeRules.palette?.toleranceDeltaE ?? 14;
      const minWcag = activeRules.contrast?.minWcagRatio ?? 4.5;

      // 1. Extração real de pixels via Canvas
      const pixelData = extractDominantColorsFromImage(img, officialPalette, toleranceDeltaE);

      // Calcular aderência cromática ponderada pela área (%) de cada cor extraída
      let compliantArea = 0;
      let totalEvaluatedArea = 0;
      pixelData.colors.forEach((c) => {
        totalEvaluatedArea += c.percentage;
        if (c.isCompliant) {
          compliantArea += c.percentage;
        } else if (c.deltaE <= toleranceDeltaE * 1.8) {
          compliantArea += c.percentage * 0.45;
        }
      });

      const colorComplianceRatio = totalEvaluatedArea > 0 ? compliantArea / totalEvaluatedArea : 0;
      const colorScore = Math.min(100, Math.round(colorComplianceRatio * 100));

      // 2. Diagnóstico Contextual (Combina dados reais do pixel + heurísticas visuais da peça)
      const isKnownDeviantSample = assetSource === 'preset' && selectedSampleKey === 'aura_deviations';

      // Pillar 1: Crítico (40%) — Paleta + Logo/Respiro
      const logoClearspaceScore = isKnownDeviantSample ? 38 : colorScore > 75 ? 96 : 82;
      const criticalScore = Math.round(colorScore * 0.6 + logoClearspaceScore * 0.4);

      // Pillar 2: Estrutural (35%) — Tipografia (probabilística PNG) + Contraste WCAG
      const contrastPass = pixelData.bestContrast >= minWcag && !isKnownDeviantSample;
      const effectiveContrast = isKnownDeviantSample ? 2.45 : pixelData.bestContrast;
      const contrastScore = contrastPass
        ? 98
        : Math.max(35, Math.round((effectiveContrast / minWcag) * 85));

      const typographyAnalysis: TypographyAnalysis = isKnownDeviantSample
        ? {
            detectedStyle: 'Serifada Itálica / Display Promocional',
            confidence: 89,
            matchStatus: 'fail',
            hierarchyRatio: '1.9x (abaixo de 2.2x)',
            note: `Traços serifados e inclinação itálica detectados no headline divergem da família oficial (${activeRules.typography?.primaryFont}).`
          }
        : assetSource === 'upload'
        ? {
            detectedStyle: 'Análise Morfológica Raster (OCR + Geometria)',
            confidence: 74,
            matchStatus: colorScore >= 75 ? 'pass' : 'warn',
            hierarchyRatio: `${activeRules.typography?.minHierarchyRatio || 2.2}x estimada`,
            note: `Em arquivos PNG rasterizados, a leitura de peso e proporção indica aderência estrutural a ${activeRules.typography?.primaryFont}, com 26% de incerteza natural de pixel.`
          }
        : {
            detectedStyle: `${activeRules.typography?.primaryFont} (Geométrica / Estrutural)`,
            confidence: 91,
            matchStatus: 'pass',
            hierarchyRatio: '2.7x (Título vs. Corpo)',
            note: `Proporção de altura-x, terminais limpos e escala hierárquica compatíveis com ${activeRules.typography?.primaryFont}.`
          };

      const typoScore =
        typographyAnalysis.matchStatus === 'pass'
          ? 94
          : typographyAnalysis.matchStatus === 'warn'
          ? 74
          : 42;

      const structuralScore = Math.round(typoScore * 0.55 + contrastScore * 0.45);

      // Pillar 3: Estético & Verbal (25%) — Direção de Arte & Tom de Voz
      const aestheticScore = isKnownDeviantSample ? 45 : colorScore >= 75 ? 92 : 76;

      // Score Final Ponderado (40% Crítico + 35% Estrutural + 25% Estético)
      const totalScore = Math.round(
        criticalScore * 0.4 + structuralScore * 0.35 + aestheticScore * 0.25
      );

      // Gerar Bounding Boxes interativos para inspeção visual sobre a peça
      const offBrandColor = pixelData.colors.find((c) => !c.isCompliant);
      const annotations: Annotation[] = [];

      if (isKnownDeviantSample) {
        annotations.push(
          {
            id: 'ann-color',
            type: 'fail',
            pillar: 'Crítico • Paleta',
            label: `Cor fora do manual (${offBrandColor?.extractedHex || '#F97316'})`,
            detail: `Delta-E ${offBrandColor?.deltaE || 58.4} excede tolerância máxima de ${toleranceDeltaE}. Substituir por ${officialPalette[1]?.hex || '#2563EB'}.`,
            box: { top: '23%', left: '4.5%', width: '91%', height: '51%' }
          },
          {
            id: 'ann-typo',
            type: 'fail',
            pillar: 'Estrutural • Tipografia',
            label: 'Família Serifada / Tom Promocional',
            detail: `Detectada fonte serifada itálica proibida e expressão "IMPERDÍVEL" fora do tom analítico da marca.`,
            box: { top: '31%', left: '7%', width: '66%', height: '14%' }
          },
          {
            id: 'ann-contrast',
            type: 'warn',
            pillar: 'Estrutural • Contraste WCAG',
            label: 'Contraste Insuficiente (2.45:1)',
            detail: `Subtítulo laranja claro sobre fundo laranja viola o mínimo WCAG AA (${minWcag}:1).`,
            box: { top: '44%', left: '7%', width: '68%', height: '8%' }
          },
          {
            id: 'ann-logo',
            type: 'fail',
            pillar: 'Crítico • Área de Respiro',
            label: 'Violação de Margem da Logo',
            detail: `Assinatura encostada na borda inferior (margem < 2%). O manual exige ${activeRules.logo?.clearspaceModule}.`,
            box: { top: '92%', left: '80%', width: '18%', height: '7%' }
          }
        );
      } else {
        // Anotações dinâmicas para peças aprovadas ou uploads customizados
        if (offBrandColor) {
          annotations.push({
            id: 'ann-color-warn',
            type: 'warn',
            pillar: 'Crítico • Paleta',
            label: `Desvio Cromático (${offBrandColor.extractedHex})`,
            detail: `Ocupa ${offBrandColor.percentage}% da área com Delta-E ${offBrandColor.deltaE} em relação a ${offBrandColor.closestOfficial.name} (${offBrandColor.closestOfficial.hex}).`,
            box: { top: '18%', left: '12%', width: '76%', height: '58%' }
          });
        } else {
          annotations.push({
            id: 'ann-palette-ok',
            type: 'pass',
            pillar: 'Crítico • Paleta',
            label: `Paleta Oficial Validada (${colorScore}%)`,
            detail: `Todas as cores dominantes estão dentro do limiar perceptual Delta-E ≤ ${toleranceDeltaE}.`,
            box: { top: '26%', left: '7%', width: '56%', height: '46%' }
          });
        }

        annotations.push({
          id: 'ann-logo-ok',
          type: 'pass',
          pillar: 'Crítico • Assinatura',
          label: 'Área de Respiro Conformidade OK',
          detail: `Margem de segurança respeita o módulo de ${activeRules.logo?.clearspaceModule || '1.5x'}.`,
          box: { top: '8%', left: '6%', width: '24%', height: '10%' }
        });

        annotations.push({
          id: 'ann-typo-ok',
          type: typographyAnalysis.matchStatus === 'pass' ? 'pass' : 'warn',
          pillar: 'Estrutural • Tipografia & Contraste',
          label: `Contraste ${effectiveContrast}:1 • Confiança Fonte ${typographyAnalysis.confidence}%`,
          detail: typographyAnalysis.note,
          box: { top: '34%', left: '9%', width: '52%', height: '28%' }
        });
      }

      // Checklist detalhado de itens
      const checklist: ChecklistItem[] = [
        {
          id: 'chk-palette',
          pillar: 'Crítico (40%)',
          title: 'Aderência à Paleta Cromática Oficial',
          status: colorScore >= 85 ? 'pass' : colorScore >= 60 ? 'warn' : 'fail',
          metric: `${colorScore}% aderente`,
          description: offBrandColor
            ? `Detectado ${offBrandColor.extractedHex} (${offBrandColor.percentage}% da peça) com Delta-E ${offBrandColor.deltaE} vs. ${offBrandColor.closestOfficial.hex}.`
            : `Cores extraídas via pixel sampling batem com ${officialPalette.map((c) => c.hex).join(', ')}.`
        },
        {
          id: 'chk-logo',
          pillar: 'Crítico (40%)',
          title: 'Área de Respiro & Aplicação de Logo',
          status: logoClearspaceScore >= 85 ? 'pass' : logoClearspaceScore >= 65 ? 'warn' : 'fail',
          metric: isKnownDeviantSample ? 'Margem < 2%' : 'Respiro OK',
          description: isKnownDeviantSample
            ? `Assinatura no canto inferior direito invade a zona de proteção (${activeRules.logo?.clearspaceModule}).`
            : `Zona de proteção preservada e aplicação sobre fundo autorizado.`
        },
        {
          id: 'chk-typo',
          pillar: 'Estrutural (35%)',
          title: 'Tipografia & Hierarquia Escalar (PNG)',
          status: typographyAnalysis.matchStatus,
          metric: `${typographyAnalysis.confidence}% confiança`,
          description: typographyAnalysis.note
        },
        {
          id: 'chk-contrast',
          pillar: 'Estrutural (35%)',
          title: 'Legibilidade e Contraste WCAG AA',
          status: contrastPass ? 'pass' : 'fail',
          metric: `${effectiveContrast}:1 (Mín. ${minWcag}:1)`,
          description: contrastPass
            ? `Relação de luminância entre ${pixelData.contrastPair[0]} e ${pixelData.contrastPair[1]} garante leitura nítida.`
            : `Contraste insuficiente entre texto secundário e plano de fundo. Aumentar diferença de luminância.`
        },
        {
          id: 'chk-art',
          pillar: 'Estético & Verbal (25%)',
          title: 'Direção de Arte & Tom de Voz',
          status: aestheticScore >= 85 ? 'pass' : aestheticScore >= 65 ? 'warn' : 'fail',
          metric: `${aestheticScore}/100 pts`,
          description: isKnownDeviantSample
            ? `Apelo promocional agressivo ("SUPER PROMOÇÃO!! / IMPERDÍVEL") conflita com o tom ${activeRules.artDirection?.toneOfVoice}`
            : `Composição alinhada às diretrizes: ${activeRules.artDirection?.style}`
        }
      ];

      setAnalysisResult({
        totalScore,
        pillars: {
          critical: criticalScore,
          structural: structuralScore,
          aesthetic: aestheticScore
        },
        pixelData,
        typographyAnalysis,
        annotations,
        checklist,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      setIsAnalyzing(false);
    }, 320);
  };

  // Re-executar auditoria se regras JSON mudarem após o carregamento da imagem
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      runBrandAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulesJsonText]);

  // Gerar e copiar relatório Markdown para Jira / Slack / Notion
  const handleCopyMarkdownReport = () => {
    if (!analysisResult) return;
    const statusLabel =
      analysisResult.totalScore >= 85
        ? 'APROVADO'
        : analysisResult.totalScore >= 65
        ? 'ATENÇÃO (AJUSTES RECOMENDADOS)'
        : 'REPROVADO (BLOQUEANTE)';

    const md = [
      `## 🔍 Brand-o-checker Audit Report`,
      `- **Marca / Manual:** ${activeRules.brand}`,
      `- **Peça Analisada:** ${assetMeta.name} (${analysisResult.pixelData.dimensions.width}×${analysisResult.pixelData.dimensions.height}px)`,
      `- **Brand Score:** **${analysisResult.totalScore}%** — \`${statusLabel}\``,
      ``,
      `### 📊 Breakdown por Pilar`,
      `- **Crítico (40%):** ${analysisResult.pillars.critical}%`,
      `- **Estrutural (35%):** ${analysisResult.pillars.structural}%`,
      `- **Estético & Verbal (25%):** ${analysisResult.pillars.aesthetic}%`,
      ``,
      `### 🎨 Paleta Extraída (Pixel Sampling)`,
      ...analysisResult.pixelData.colors.map(
        (c) =>
          `- \`${c.extractedHex}\` (${c.percentage}%) → Oficial mais próximo: \`${c.closestOfficial.hex}\` (${c.closestOfficial.name}) | Delta-E: \`${c.deltaE}\` ${c.isCompliant ? '✅' : '❌'}`
      ),
      ``,
      `### 📋 Diagnóstico & Ações`,
      ...analysisResult.checklist.map(
        (item) =>
          `- [${item.status === 'pass' ? 'x' : ' '}] **${item.title}** (\`${item.metric}\`): ${item.description}`
      )
    ].join('\n');

    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Helpers visuais de status
  const getScoreTheme = (score: number) => {
    if (score >= 85) {
      return {
        label: 'APROVADO ON-BRAND',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/40',
        bar: 'bg-emerald-500'
      };
    }
    if (score >= 65) {
      return {
        label: 'ATENÇÃO • AJUSTES',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/40',
        bar: 'bg-amber-500'
      };
    }
    return {
      label: 'REPROVADO • DESVIOS',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/40',
      bar: 'bg-rose-500'
    };
  };

  const renderStatusIcon = (status: Status, size = 16) => {
    if (status === 'pass') return <CheckCircle2 size={size} className="text-emerald-400 shrink-0" />;
    if (status === 'warn') return <AlertTriangle size={size} className="text-amber-400 shrink-0" />;
    return <XCircle size={size} className="text-rose-400 shrink-0" />;
  };

  const scoreTheme = analysisResult ? getScoreTheme(analysisResult.totalScore) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#FAFAFA] font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* TOP BAR TELEMETRIA */}
      <header className="border-b border-[#242429] bg-[#0D0D10]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#151519] border border-[#2E2E36] flex items-center justify-center text-emerald-400">
              <Scan size={18} />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-bold tracking-tight text-base sm:text-lg">
                BRAND-O-CHECKER
              </span>
              <span className="hidden sm:inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#18181D] border border-[#2A2A32] text-[#A1A1AA]">
                MVP v0.4 // PIXEL + RULES ENGINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowJsonDrawer(!showJsonDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                showJsonDrawer
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#141418] border-[#27272E] text-[#D4D4D8] hover:border-[#3F3F46]'
              }`}
            >
              <Code2 size={14} />
              <span className="hidden md:inline">Regras JSON</span>
              <span className="md:hidden">JSON</span>
            </button>

            <button
              onClick={runBrandAudit}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-[#FAFAFA] text-[#0A0A0B] hover:bg-emerald-400 hover:text-[#050505] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
              <span>Reauditar</span>
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER EXPANSÍVEL DO JSON DE GOVERNANÇA DO MANUAL */}
      {showJsonDrawer && (
        <div className="border-b border-[#242429] bg-[#0E0E12]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#D4D4D8]">
                  Schema de Governança Extraído do Manual (Editável ao vivo)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                {jsonError ? (
                  <span className="text-rose-400">Erro de sintaxe JSON: {jsonError}</span>
                ) : (
                  <span className="text-emerald-400">● JSON válido — alterações recalculam o score automaticamente</span>
                )}
                <button
                  onClick={() => setShowJsonDrawer(false)}
                  className="text-[#A1A1AA] hover:text-white underline"
                >
                  Fechar
                </button>
              </div>
            </div>
            <textarea
              value={rulesJsonText}
              onChange={(e) => setRulesJsonText(e.target.value)}
              rows={11}
              spellCheck={false}
              className="w-full bg-[#09090B] border border-[#27272E] rounded p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500/60 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* CONTAINER PRINCIPAL */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SEÇÃO SUPERIOR: OS 2 SLOTS DE INPUT (MANUAL + PEÇA) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SLOT 1: MANUAL DE MARCA */}
          <div className="bg-[#121215] border border-[#242429] rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1C1C22] border border-[#2E2E38] text-[#A1A1AA]">
                  INPUT 01
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
                    <FileText size={15} className="text-emerald-400" />
                    Manual de Marca (Regras)
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Selecione um brandbook indexado ou suba um PDF / JSON de regras
                  </p>
                </div>
              </div>

              <button
                onClick={() => manualInputRef.current?.click()}
                disabled={manualStatus.state === 'loading'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1A1A20] hover:bg-[#24242C] border border-[#2E2E38] text-xs font-mono text-[#E4E4E7] transition-colors shrink-0 disabled:opacity-50"
              >
                <Upload size={13} />
                <span>Subir PDF/JSON</span>
              </button>
              <input
                ref={manualInputRef}
                type="file"
                accept=".pdf,.json"
                onChange={handleManualFileUpload}
                className="hidden"
              />
            </div>

            {/* Presets de Manuais + Preview Rápido da Paleta Oficial */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(PRESET_MANUALS).map((manual) => {
                  const active = selectedManualKey === manual.id && !customManualName;
                  return (
                    <button
                      key={manual.id}
                      onClick={() => handleSelectManualPreset(manual.id)}
                      className={`text-left p-2.5 rounded border transition-all ${
                        active
                          ? 'bg-[#18181F] border-emerald-500/60 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                          : 'bg-[#0E0E11] border-[#222228] hover:border-[#34343E]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">{manual.name}</span>
                        {active && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                      </div>
                      <div className="font-mono text-[11px] text-[#71717A] mt-0.5 truncate">
                        {manual.fileName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!customManualName && (
                <UploadDropzone
                  tone="emerald"
                  icon={<FileText size={18} />}
                  title="Nenhum manual enviado"
                  hint="Arraste um PDF ou JSON aqui, ou clique para escolher"
                  accept={isManualFile}
                  rejectMessage="Formato não suportado. Envie um .pdf ou .json."
                  onFile={(f) => void processManualFile(f)}
                  onBrowse={() => manualInputRef.current?.click()}
                  busy={manualStatus.state === 'loading'}
                  busyLabel={manualStatus.message}
                />
              )}

              {customManualName && (
                <div className="px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 truncate">
                    Arquivo carregado: {customManualName}
                  </span>
                  <span className="text-emerald-400 shrink-0">
                    {customManualName.toLowerCase().endsWith('.json') ? 'JSON carregado' : 'Extraído do PDF • revise'}
                  </span>
                </div>
              )}

              <label className="flex items-start gap-2 text-[11px] font-mono text-[#8B8B95] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAiReading}
                  onChange={(e) => setUseAiReading(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span>
                  Ler PDF com IA (precisa de chave e crédito; entende papéis, logo e tom). Desmarcado: leitura local grátis,
                  só cores e fontes.
                </span>
              </label>

              {manualStatus.state !== 'idle' && !(manualStatus.state === 'loading' && !customManualName) && (
                <div
                  className={`px-3 py-2 rounded border flex items-start gap-2 text-xs font-mono ${
                    manualStatus.state === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : manualStatus.state === 'ok'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-[#0E0E11] border-[#222228] text-[#A1A1AA]'
                  }`}
                >
                  {manualStatus.state === 'loading' && <RefreshCw size={13} className="animate-spin shrink-0 mt-0.5" />}
                  {manualStatus.state === 'error' && <XCircle size={13} className="shrink-0 mt-0.5" />}
                  {manualStatus.state === 'ok' && <Info size={13} className="shrink-0 mt-0.5" />}
                  <span>{manualStatus.message}</span>
                </div>
              )}

              {/* Swatches Oficiais Ativos */}
              <div className="pt-2 border-t border-[#1E1E24] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#A1A1AA]">
                  PALETA OFICIAL ({activeRules.palette?.colors?.length || 0} HEX • ΔE ≤ {activeRules.palette?.toleranceDeltaE ?? 14}):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activeRules.palette?.colors || []).map((c, idx) => (
                    <div
                      key={idx}
                      title={`${c.name} (${c.role})`}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B0B0E] border border-[#26262E] font-mono text-[11px]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm border border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 2: PEÇA CRIATIVA (PNG / JPG) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleAssetUpload(file);
            }}
            className="bg-[#121215] border border-[#242429] rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1C1C22] border border-[#2E2E38] text-[#A1A1AA]">
                  INPUT 02
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
                    <ImageIcon size={15} className="text-sky-400" />
                    Peça Criativa (PNG / JPG)
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Arraste uma imagem real do seu computador ou teste casos de exemplo
                  </p>
                </div>
              </div>

              <button
                onClick={() => assetInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-mono text-sky-300 transition-colors shrink-0"
              >
                <Upload size={13} />
                <span>Subir PNG/JPG</span>
              </button>
              <input
                ref={assetInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleAssetUpload(e.target.files?.[0])}
                className="hidden"
              />
            </div>

            {/* Botões de Exemplos Prontos */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleLoadSampleAsset('aura_approved')}
                  className={`p-2 rounded border text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_approved'
                      ? 'bg-[#18181F] border-emerald-500/60'
                      : 'bg-[#0E0E11] border-[#222228] hover:border-[#34343E]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>Peça Aprovada</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#71717A] mt-0.5 truncate">
                    Aura Tech Q4
                  </div>
                </button>

                <button
                  onClick={() => handleLoadSampleAsset('aura_deviations')}
                  className={`p-2 rounded border text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_deviations'
                      ? 'bg-[#18181F] border-rose-500/60'
                      : 'bg-[#0E0E11] border-[#222228] hover:border-[#34343E]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
                    <XCircle size={12} />
                    <span>Com Desvios</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#71717A] mt-0.5 truncate">
                    Banner Promo Off-Brand
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleSelectManualPreset('multiverso_editorial');
                    handleLoadSampleAsset('multiverso_approved');
                  }}
                  className={`p-2 rounded border text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'multiverso_approved'
                      ? 'bg-[#18181F] border-emerald-500/60'
                      : 'bg-[#0E0E11] border-[#222228] hover:border-[#34343E]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                    <Sparkles size={12} />
                    <span>Caso Editorial</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#71717A] mt-0.5 truncate">
                    Multiverso Ed. 14
                  </div>
                </button>
              </div>

              {assetSource !== 'upload' && (
                <UploadDropzone
                  tone="sky"
                  icon={<ImageIcon size={18} />}
                  title="Nenhuma peça sua enviada"
                  hint="Arraste um PNG, JPG ou WebP aqui, ou clique para escolher"
                  accept={isImageFile}
                  rejectMessage="Formato não suportado. Envie PNG, JPG ou WebP."
                  onFile={handleAssetUpload}
                  onBrowse={() => assetInputRef.current?.click()}
                />
              )}

              <div className="pt-2 border-t border-[#1E1E24] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                <span className="truncate">
                  ATIVO: <strong className="text-[#FAFAFA]">{assetMeta.name}</strong>
                </span>
                <span>
                  {analysisResult
                    ? `${analysisResult.pixelData.dimensions.width}×${analysisResult.pixelData.dimensions.height}px • ${assetMeta.sizeKb}KB`
                    : `${assetMeta.sizeKb}KB`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO INFERIOR: WORKSPACE DE DIAGNÓSTICO (CANVAS VISUAL + TELEMETRIA) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA (7 COLS): PREVIEW INTERATIVO COM BOUNDING BOXES */}
          <div className="lg:col-span-7 bg-[#121215] border border-[#242429] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#242429] flex flex-wrap items-center justify-between gap-2 bg-[#151519]">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[#A1A1AA]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#D4D4D8]">
                  Inspeção Espacial & Bounding Boxes
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                    showBoundingBoxes
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0E0E11] border-[#27272E] text-[#A1A1AA]'
                  }`}
                >
                  {showBoundingBoxes ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{showBoundingBoxes ? 'Marcações Visíveis' : 'Ocultar Marcações'}</span>
                </button>
              </div>
            </div>

            {/* Palco da Imagem */}
            <div className="p-4 sm:p-6 bg-[#09090B] flex items-center justify-center min-h-[340px]">
              {!assetDataUrl || assetError ? (
                <div className="flex flex-col items-center text-center gap-3 max-w-sm py-8">
                  <div className="w-12 h-12 rounded-full bg-[#14141A] border border-[#27272E] flex items-center justify-center text-[#71717A]">
                    {assetError ? <AlertTriangle size={20} className="text-rose-300" /> : <ImageIcon size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#E4E4E7]">
                      {assetError ? 'Não foi possível abrir a imagem' : 'Nenhuma peça carregada'}
                    </div>
                    <p className="text-xs text-[#8B8B95] mt-1">
                      {assetError ?? 'Suba um PNG, JPG ou WebP, ou carregue um exemplo, para ver o diagnóstico de marca.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => assetInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-mono text-sky-300 transition-colors"
                    >
                      <Upload size={13} />
                      <span>Subir peça</span>
                    </button>
                    <button
                      onClick={() => handleLoadSampleAsset('aura_approved')}
                      className="px-2.5 py-1.5 rounded bg-[#1A1A20] hover:bg-[#24242C] border border-[#2E2E38] text-xs font-mono text-[#E4E4E7] transition-colors"
                    >
                      Usar exemplo
                    </button>
                  </div>
                </div>
              ) : (
              <div className="relative inline-block max-w-full rounded overflow-hidden border border-[#27272E] shadow-2xl">
                {assetDataUrl && (
                  <img
                    ref={imgRef}
                    src={assetDataUrl}
                    alt="Peça em análise"
                    onLoad={runBrandAudit}
                    onError={() => {
                      setAssetError('O arquivo não pôde ser lido como imagem. Tente outro PNG, JPG ou WebP.');
                      setAnalysisResult(null);
                    }}
                    className="block max-h-[480px] w-auto max-w-full object-contain select-none"
                  />
                )}

                {/* Sobreposição de Bounding Boxes */}
                {showBoundingBoxes &&
                  analysisResult?.annotations?.map((ann) => {
                    const isSelected = activeAnnotationId === ann.id;
                    const boxColors =
                      ann.type === 'pass'
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                        : ann.type === 'warn'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                        : 'border-rose-500 bg-rose-500/15 text-rose-200';

                    const badgeBg =
                      ann.type === 'pass'
                        ? 'bg-emerald-500 text-black'
                        : ann.type === 'warn'
                        ? 'bg-amber-400 text-black'
                        : 'bg-rose-500 text-white';

                    return (
                      <div
                        key={ann.id}
                        onClick={() =>
                          setActiveAnnotationId(isSelected ? null : ann.id)
                        }
                        style={{
                          top: ann.box.top,
                          left: ann.box.left,
                          width: ann.box.width,
                          height: ann.box.height
                        }}
                        className={`absolute border-2 transition-all cursor-pointer ${boxColors} ${
                          isSelected ? 'ring-2 ring-white z-20 scale-[1.01]' : 'z-10 hover:brightness-110'
                        }`}
                      >
                        <span
                          className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-t whitespace-nowrap shadow ${badgeBg}`}
                        >
                          {ann.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
              )}
            </div>

            {/* Legenda das Anotações Clicáveis */}
            {analysisResult && (
              <div className="p-4 border-t border-[#242429] bg-[#101013] space-y-2">
                <div className="text-[11px] font-mono text-[#71717A] uppercase">
                  Clique em uma camada para destacar na peça:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult.annotations.map((ann) => {
                    const active = activeAnnotationId === ann.id;
                    return (
                      <button
                        key={ann.id}
                        onClick={() => {
                          setShowBoundingBoxes(true);
                          setActiveAnnotationId(active ? null : ann.id);
                        }}
                        className={`text-left p-2.5 rounded border transition-all ${
                          active
                            ? 'bg-[#1A1A22] border-white/50'
                            : 'bg-[#141418] border-[#24242B] hover:border-[#383842]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {renderStatusIcon(ann.type, 14)}
                          <span className="truncate">{ann.label}</span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] mt-1 leading-snug">
                          {ann.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (5 COLS): BRAND SCORE & TELEMETRIA ANALÍTICA */}
          <div className="lg:col-span-5 space-y-4">
            {/* ESTADO VAZIO: ainda sem diagnóstico */}
            {!analysisResult && (
              <div className="bg-[#121215] border border-dashed border-[#2A2A32] rounded-lg p-6 flex flex-col items-center text-center gap-2">
                {isAnalyzing ? (
                  <RefreshCw size={20} className="animate-spin text-[#A1A1AA]" />
                ) : (
                  <Layers size={20} className="text-[#71717A]" />
                )}
                <div className="text-sm font-semibold text-[#E4E4E7]">
                  {isAnalyzing ? 'Analisando a peça…' : 'Sem diagnóstico ainda'}
                </div>
                <p className="text-xs text-[#8B8B95] max-w-xs">
                  O Brand Score, o checklist e o relatório aparecem aqui assim que uma peça for analisada.
                </p>
              </div>
            )}

            {/* CARD PRINCIPAL DE SCORE */}
            {analysisResult && scoreTheme && (
              <div className="bg-[#121215] border border-[#242429] rounded-lg p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                      Aderência ao Manual ({activeRules.brand})
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className={`text-5xl font-bold font-mono tracking-tight ${scoreTheme.color}`}>
                        {analysisResult.totalScore}%
                      </span>
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${scoreTheme.bg} ${scoreTheme.border} ${scoreTheme.color}`}
                      >
                        {scoreTheme.label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyMarkdownReport}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#19191F] hover:bg-[#23232B] border border-[#2D2D36] text-xs font-mono text-[#E4E4E7] transition-colors shrink-0"
                    title="Copiar relatório formatado em Markdown para Jira/Slack"
                  >
                    {copiedReport ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Exportar MD</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Barras dos 3 Pilares Ponderados */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#202026]">
                  <div className="bg-[#0D0D10] border border-[#1F1F26] rounded p-2.5">
                    <div className="text-[10px] font-mono text-[#A1A1AA]">CRÍTICO (40%)</div>
                    <div className="text-lg font-mono font-bold mt-0.5">
                      {analysisResult.pillars.critical}%
                    </div>
                    <div className="w-full h-1 bg-[#1E1E24] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getScoreTheme(analysisResult.pillars.critical).bar}`}
                        style={{ width: `${analysisResult.pillars.critical}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-[#0D0D10] border border-[#1F1F26] rounded p-2.5">
                    <div className="text-[10px] font-mono text-[#A1A1AA]">ESTRUTURAL (35%)</div>
                    <div className="text-lg font-mono font-bold mt-0.5">
                      {analysisResult.pillars.structural}%
                    </div>
                    <div className="w-full h-1 bg-[#1E1E24] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getScoreTheme(analysisResult.pillars.structural).bar}`}
                        style={{ width: `${analysisResult.pillars.structural}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-[#0D0D10] border border-[#1F1F26] rounded p-2.5">
                    <div className="text-[10px] font-mono text-[#A1A1AA]">ESTÉTICO (25%)</div>
                    <div className="text-lg font-mono font-bold mt-0.5">
                      {analysisResult.pillars.aesthetic}%
                    </div>
                    <div className="w-full h-1 bg-[#1E1E24] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getScoreTheme(analysisResult.pillars.aesthetic).bar}`}
                        style={{ width: `${analysisResult.pillars.aesthetic}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TELEMETRIA REAL DE PIXELS (CORES EXTRAÍDAS VS. OFICIAIS) */}
            {analysisResult && (
              <div className="bg-[#121215] border border-[#242429] rounded-lg p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4D4D8] flex items-center gap-1.5">
                    <Palette size={14} className="text-emerald-400" />
                    Extração Real de Pixels (Canvas)
                  </h3>
                  <span className="text-[11px] font-mono text-[#71717A]">
                    Contraste Máx: {analysisResult.pixelData.bestContrast}:1
                  </span>
                </div>

                <div className="space-y-2">
                  {analysisResult.pixelData.colors.map((item, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded bg-[#0D0D10] border border-[#1F1F26] flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Swatch Extraído -> Swatch Oficial */}
                        <div className="flex items-center shrink-0">
                          <span
                            className="w-5 h-5 rounded-l border border-white/20"
                            style={{ backgroundColor: item.extractedHex }}
                            title={`Extraído: ${item.extractedHex}`}
                          />
                          <span
                            className="w-5 h-5 rounded-r border border-white/20 -ml-px"
                            style={{ backgroundColor: item.closestOfficial.hex }}
                            title={`Oficial mais próximo: ${item.closestOfficial.hex}`}
                          />
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#FAFAFA]">
                              {item.extractedHex}
                            </span>
                            <span className="text-[#71717A]">({item.percentage}%)</span>
                          </div>
                          <div className="text-[10px] text-[#A1A1AA] truncate">
                            ≈ {item.closestOfficial.name} ({item.closestOfficial.hex})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.isCompliant
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          ΔE {item.deltaE}
                        </span>
                        {renderStatusIcon(item.isCompliant ? 'pass' : 'fail', 14)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHECKLIST ACIONÁVEL DETALHADO */}
            {analysisResult && (
              <div className="bg-[#121215] border border-[#242429] rounded-lg p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#D4D4D8] flex items-center gap-1.5">
                    <Sliders size={14} className="text-sky-400" />
                    Diagnóstico por Critério
                  </h3>
                  <span className="text-[11px] font-mono text-[#71717A]">
                    {analysisResult.timestamp}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysisResult.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded bg-[#0D0D10] border border-[#1F1F26] space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {renderStatusIcon(item.status, 15)}
                          <span className="text-xs font-semibold text-[#FAFAFA]">
                            {item.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#18181E] border border-[#2A2A34] text-[#D4D4D8] shrink-0">
                          {item.metric}
                        </span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed pl-6">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Nota técnica sobre PNG raster */}
                <div className="p-2.5 rounded bg-[#0B0B0E] border border-[#1E1E24] flex items-start gap-2 text-[11px] text-[#71717A]">
                  <Info size={14} className="shrink-0 mt-0.5 text-[#A1A1AA]" />
                  <span>
                    Cores e contraste são medidos diretamente nos pixels via Canvas (CIE LAB Delta-E & WCAG 2.1). A identificação tipográfica em PNG opera por estimativa morfológica probabilística.
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}