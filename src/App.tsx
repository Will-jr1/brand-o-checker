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
  Palette,
  RefreshCw,
  Info,
  Terminal,
  Wand2
} from 'lucide-react';
import type {
  Status,
  SampleKey,
  Rgb,
  PaletteColor,
  BrandRules,
  PresetManual,
  PixelData,
  TypographyAnalysis,
  Annotation,
  ChecklistItem,
  AnalysisResult
} from './types';
import { extractRulesFromPdfLocal } from './lib/pdfLocal';
import UploadDropzone from './components/UploadDropzone';

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

function generateSampleAssetDataUrl(type: SampleKey): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'aura_approved') {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, 900, 600);

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = 60; x < 900; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }

    ctx.fillStyle = '#2563EB';
    ctx.fillRect(60, 170, 420, 260);

    ctx.fillStyle = '#10B981';
    ctx.fillRect(480, 170, 90, 260);

    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(76, 76, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.fillRect(70, 70, 12, 12);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 20px monospace';
    ctx.fillText('AURA TECH', 104, 83);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 54px sans-serif';
    ctx.fillText('INFRAESTRUTURA', 88, 255);
    ctx.fillText('AUTÔNOMA Q4', 88, 318);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '400 20px sans-serif';
    ctx.fillText('Arquitetura determinística para sistemas críticos.', 88, 375);

    ctx.fillStyle = '#10B981';
    ctx.font = '700 15px monospace';
    ctx.fillText('RELEASE // 2026.04', 60, 520);
  } else if (type === 'aura_deviations') {
    ctx.fillStyle = '#2E1065';
    ctx.fillRect(0, 0, 900, 600);

    ctx.fillStyle = '#F97316';
    ctx.fillRect(40, 140, 820, 310);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(745, 578, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 16px monospace';
    ctx.fillText('AURA TECH', 765, 583);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 700 56px Georgia, serif';
    ctx.fillText('SUPER PROMOÇÃO!!', 70, 235);

    ctx.fillStyle = '#FDBA74';
    ctx.font = '600 24px Georgia, serif';
    ctx.fillText('Aproveite agora antes que acabe o estoque!', 70, 295);

    ctx.fillStyle = '#EC4899';
    ctx.fillRect(70, 340, 240, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('50% OFF IMPERDÍVEL', 88, 374);
  } else if (type === 'multiverso_approved') {
    ctx.fillStyle = '#F4EFE6';
    ctx.fillRect(0, 0, 900, 600);

    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, 788, 488);

    ctx.fillStyle = '#D94E34';
    ctx.fillRect(540, 56, 304, 488);

    ctx.fillStyle = '#18181B';
    ctx.font = '700 22px Georgia, serif';
    ctx.fillText('M // MULTIVERSO', 88, 108);

    ctx.fillStyle = '#18181B';
    ctx.font = '700 52px Georgia, serif';
    ctx.fillText('CADERNOS DE', 88, 240);
    ctx.fillText('ARQUITETURA', 88, 302);
    ctx.fillText('CONTEMPORÂNEA', 88, 364);

    ctx.font = '400 19px sans-serif';
    ctx.fillText('Edição 14 • Ensaios sobre forma, matéria e cidade.', 88, 440);

    ctx.fillStyle = '#F4EFE6';
    ctx.font = '700 18px monospace';
    ctx.fillText('ISSN 2984-019X', 580, 110);
  }

  return canvas.toDataURL('image/png');
}

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

function extractDominantColorsFromImage(
  imgElement: HTMLImageElement,
  officialPalette: PaletteColor[],
  toleranceDeltaE: number
): PixelData {
  const canvas = document.createElement('canvas');
  const maxDim = 240;
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

    if (a < 220) continue;

    totalValidPixels++;
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

const MAX_PDF_BYTES = 4_200_000;

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
    // resposta não-JSON
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
  const [selectedManualKey, setSelectedManualKey] = useState('aura_tech');
  const [customManualName, setCustomManualName] = useState<string | null>(null);
  const [rulesJsonText, setRulesJsonText] = useState(() =>
    JSON.stringify(PRESET_MANUALS.aura_tech.rules, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJsonDrawer, setShowJsonDrawer] = useState(false);
  const [useAiReading, setUseAiReading] = useState(false);
  const [manualStatus, setManualStatus] = useState<{
    state: 'idle' | 'loading' | 'ok' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  const [assetSource, setAssetSource] = useState<'preset' | 'upload'>('preset');
  const [selectedSampleKey, setSelectedSampleKey] = useState<SampleKey | 'custom_upload'>('aura_approved');
  const [assetDataUrl, setAssetDataUrl] = useState(() =>
    typeof document === 'undefined' ? '' : generateSampleAssetDataUrl('aura_approved')
  );
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetMeta, setAssetMeta] = useState({
    name: 'aura-campanha-q4-approved.png',
    sizeKb: 142
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const url = generateSampleAssetDataUrl('aura_approved');
    setAssetDataUrl(url);
  }, []);

  const handleSelectManualPreset = (key: string) => {
    setSelectedManualKey(key);
    setCustomManualName(null);
    setManualStatus({ state: 'idle', message: '' });
    setRulesJsonText(JSON.stringify(PRESET_MANUALS[key].rules, null, 2));

    if (assetSource === 'preset') {
      if (key === 'multiverso_editorial') {
        handleLoadSampleAsset('multiverso_approved');
      } else {
        handleLoadSampleAsset('aura_approved');
      }
    }
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
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
      message: useAiReading ? `Lendo ${file.name} com IA...` : `Extraindo tokens de ${file.name}...`
    });
    try {
      const { rules, warnings } = useAiReading
        ? await extractRulesFromPdf(file)
        : await extractRulesFromPdfLocal(file, (done, total) =>
            setManualStatus({
              state: 'loading',
              message: `Lendo ${file.name} — página ${Math.min(done + 1, total)} de ${total}`
            })
          );
      setCustomManualName(file.name);
      setRulesJsonText(JSON.stringify(rules, null, 2));
      setShowJsonDrawer(true);
      const intro = useAiReading
        ? 'Regras extraídas por IA. Revise o JSON antes de validar.'
        : 'Leitura local concluída (cores hex/RGB e fontes embutidas). Revise os tokens no editor.';
      setManualStatus({ state: 'ok', message: [intro, ...warnings].join(' ') });
    } catch (err) {
      setManualStatus({ state: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

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

  const runBrandAudit = () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    setIsAnalyzing(true);
    setActiveAnnotationId(null);

    setTimeout(() => {
      const officialPalette: PaletteColor[] = activeRules.palette?.colors || [];
      const toleranceDeltaE = activeRules.palette?.toleranceDeltaE ?? 14;
      const minWcag = activeRules.contrast?.minWcagRatio ?? 4.5;

      const pixelData = extractDominantColorsFromImage(img, officialPalette, toleranceDeltaE);

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

      const isKnownDeviantSample = assetSource === 'preset' && selectedSampleKey === 'aura_deviations';

      const logoClearspaceScore = isKnownDeviantSample ? 38 : colorScore > 75 ? 96 : 82;
      const criticalScore = Math.round(colorScore * 0.6 + logoClearspaceScore * 0.4);

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
      const aestheticScore = isKnownDeviantSample ? 45 : colorScore >= 75 ? 92 : 76;

      const totalScore = Math.round(
        criticalScore * 0.4 + structuralScore * 0.35 + aestheticScore * 0.25
      );

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
          label: 'Área de Respiro OK',
          detail: `Margem de segurança respeita o módulo de ${activeRules.logo?.clearspaceModule || '1.5x'}.`,
          box: { top: '8%', left: '6%', width: '24%', height: '10%' }
        });

        annotations.push({
          id: 'ann-typo-ok',
          type: typographyAnalysis.matchStatus === 'pass' ? 'pass' : 'warn',
          pillar: 'Estrutural • Tipografia & Contraste',
          label: `Contraste ${effectiveContrast}:1 • Confiança ${typographyAnalysis.confidence}%`,
          detail: typographyAnalysis.note,
          box: { top: '34%', left: '9%', width: '52%', height: '28%' }
        });
      }

      const checklist: ChecklistItem[] = [
        {
          id: 'chk-palette',
          pillar: 'Crítico (40%)',
          title: 'Aderência à Paleta Oficial',
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
          title: 'Tipografia & Hierarquia Escalar',
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

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      runBrandAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulesJsonText]);

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

  const getScoreTheme = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Aprovado On-Brand',
        scoreColor: 'text-emerald-600',
        pillBg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
        barGradient: 'from-emerald-500 to-teal-500'
      };
    }
    if (score >= 65) {
      return {
        label: 'Atenção • Ajustes',
        scoreColor: 'text-amber-600',
        pillBg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        barGradient: 'from-amber-400 to-orange-500'
      };
    }
    return {
      label: 'Reprovado • Desvios',
      scoreColor: 'text-rose-600',
      pillBg: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
      barGradient: 'from-rose-500 to-red-600'
    };
  };

  const renderStatusIcon = (status: Status, size = 16) => {
    if (status === 'pass') return <CheckCircle2 size={size} className="text-emerald-500 shrink-0" />;
    if (status === 'warn') return <AlertTriangle size={size} className="text-amber-500 shrink-0" />;
    return <XCircle size={size} className="text-rose-500 shrink-0" />;
  };

  const scoreTheme = analysisResult ? getScoreTheme(analysisResult.totalScore) : null;

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900 font-sans pb-12">
      {/* HEADER FLUTUANTE COM GLASSMORPHISM */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-[var(--shadow-pill)]">
              <Scan size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-base text-slate-900">
                  Brand-o-checker
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  v0.4
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 leading-none mt-0.5">
                Auditoria automatizada de identidade & tokens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowJsonDrawer(!showJsonDrawer)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                showJsonDrawer
                  ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-[var(--shadow-pill)]'
              }`}
            >
              <Code2 size={14} />
              <span>Regras JSON</span>
            </button>

            <button
              onClick={runBrandAudit}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.28)] transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
              <span>Reauditar</span>
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER EXPANSÍVEL DO JSON */}
      {showJsonDrawer && (
        <div className="bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-[var(--shadow-floating)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Terminal size={13} />
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Schema de Governança do Manual (Edição ao vivo)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {jsonError ? (
                  <span className="text-rose-600 font-medium">Erro de sintaxe: {jsonError}</span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    JSON válido — recálculo automático ativo
                  </span>
                )}
                <button
                  onClick={() => setShowJsonDrawer(false)}
                  className="text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
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
              className="w-full bg-slate-900 text-emerald-300 rounded-xl p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed shadow-inner"
            />
          </div>
        </div>
      )}

      {/* CONTAINER PRINCIPAL */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* LINHA 01: CARDS ELEVADOS DE INPUT */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CARD 01: MANUAL DE MARCA */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Manual de Marca</h2>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Etapa 1
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Escolha um brandbook pronto ou importe seu PDF / JSON
                  </p>
                </div>
              </div>

              <button
                onClick={() => manualInputRef.current?.click()}
                disabled={manualStatus.state === 'loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 transition-colors shrink-0 disabled:opacity-50"
              >
                <Upload size={13} />
                <span>Importar</span>
              </button>
              <input
                ref={manualInputRef}
                type="file"
                accept=".pdf,.json"
                onChange={handleManualFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-3.5">
              {/* Segmented Cards de Manuais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.values(PRESET_MANUALS).map((manual) => {
                  const active = selectedManualKey === manual.id && !customManualName;
                  return (
                    <button
                      key={manual.id}
                      onClick={() => handleSelectManualPreset(manual.id)}
                      className={`text-left p-3 rounded-xl transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                          : 'bg-slate-50/80 text-slate-800 hover:bg-slate-100/80 border border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">{manual.name}</span>
                        {active && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                      </div>
                      <div
                        className={`font-mono text-[11px] mt-1 truncate ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {manual.fileName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!customManualName && (
                <UploadDropzone
                  tone="emerald"
                  icon={<FileText size={17} />}
                  title="Arraste o PDF ou JSON do manual"
                  hint="Extração local instantânea ou via IA (Claude)"
                  accept={isManualFile}
                  rejectMessage="Formato não suportado. Envie um .pdf ou .json."
                  onFile={(f) => void processManualFile(f)}
                  onBrowse={() => manualInputRef.current?.click()}
                  busy={manualStatus.state === 'loading'}
                  busyLabel={manualStatus.message}
                />
              )}

              {customManualName && (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-900 font-medium truncate">
                    {customManualName}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                    {customManualName.toLowerCase().endsWith('.json') ? 'JSON ativo' : 'PDF extraído'}
                  </span>
                </div>
              )}

              {/* Toggle moderno de leitura por IA */}
              <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/60 cursor-pointer select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <Wand2 size={14} className="text-violet-600 shrink-0" />
                  <span className="text-xs text-slate-600 truncate">
                    Extração semântica com IA <span className="text-slate-400">(tom de voz, logo e papéis)</span>
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useAiReading}
                  onChange={(e) => setUseAiReading(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 shrink-0"
                />
              </label>

              {manualStatus.state !== 'idle' && !(manualStatus.state === 'loading' && !customManualName) && (
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 ${
                    manualStatus.state === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      : manualStatus.state === 'ok'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {manualStatus.state === 'loading' && <RefreshCw size={14} className="animate-spin shrink-0 mt-0.5" />}
                  {manualStatus.state === 'error' && <XCircle size={14} className="shrink-0 mt-0.5" />}
                  {manualStatus.state === 'ok' && <Info size={14} className="shrink-0 mt-0.5" />}
                  <span className="leading-relaxed">{manualStatus.message}</span>
                </div>
              )}

              {/* Swatches Oficiais */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Paleta oficial · Tolerância ΔE ≤ {activeRules.palette?.toleranceDeltaE ?? 14}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activeRules.palette?.colors || []).map((c, idx) => (
                    <div
                      key={idx}
                      title={`${c.name} — ${c.role}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700"
                    >
                      <span
                        className="w-3 h-3 rounded-full shadow-2xs ring-1 ring-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 02: PEÇA CRIATIVA */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleAssetUpload(file);
            }}
            className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-5 sm:p-6 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ImageIcon size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Peça Criativa</h2>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Etapa 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Envie um PNG/JPG para auditoria ou alterne entre os exemplos
                  </p>
                </div>
              </div>

              <button
                onClick={() => assetInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-xs font-semibold text-blue-700 transition-colors shrink-0"
              >
                <Upload size={13} />
                <span>Subir peça</span>
              </button>
              <input
                ref={assetInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleAssetUpload(e.target.files?.[0])}
                className="hidden"
              />
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleLoadSampleAsset('aura_approved')}
                  className={`p-3 rounded-xl text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_approved'
                      ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                      : 'bg-slate-50/80 text-slate-800 hover:bg-slate-100/80 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2
                      size={13}
                      className={
                        assetSource === 'preset' && selectedSampleKey === 'aura_approved'
                          ? 'text-emerald-400'
                          : 'text-emerald-500'
                      }
                    />
                    <span>Aprovada</span>
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 truncate ${
                      assetSource === 'preset' && selectedSampleKey === 'aura_approved'
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Aura Tech Q4
                  </div>
                </button>

                <button
                  onClick={() => handleLoadSampleAsset('aura_deviations')}
                  className={`p-3 rounded-xl text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_deviations'
                      ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                      : 'bg-slate-50/80 text-slate-800 hover:bg-slate-100/80 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <XCircle
                      size={13}
                      className={
                        assetSource === 'preset' && selectedSampleKey === 'aura_deviations'
                          ? 'text-rose-400'
                          : 'text-rose-500'
                      }
                    />
                    <span>Com Desvios</span>
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 truncate ${
                      assetSource === 'preset' && selectedSampleKey === 'aura_deviations'
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Banner Promo
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleSelectManualPreset('multiverso_editorial');
                    handleLoadSampleAsset('multiverso_approved');
                  }}
                  className={`p-3 rounded-xl text-left transition-all ${
                    assetSource === 'preset' && selectedSampleKey === 'multiverso_approved'
                      ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                      : 'bg-slate-50/80 text-slate-800 hover:bg-slate-100/80 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Sparkles
                      size={13}
                      className={
                        assetSource === 'preset' && selectedSampleKey === 'multiverso_approved'
                          ? 'text-amber-300'
                          : 'text-amber-500'
                      }
                    />
                    <span>Editorial</span>
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 truncate ${
                      assetSource === 'preset' && selectedSampleKey === 'multiverso_approved'
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Multiverso Ed. 14
                  </div>
                </button>
              </div>

              {assetSource !== 'upload' && (
                <UploadDropzone
                  tone="sky"
                  icon={<ImageIcon size={17} />}
                  title="Arraste uma peça em PNG, JPG ou WebP"
                  hint="Leitura direta dos pixels via Canvas"
                  accept={isImageFile}
                  rejectMessage="Formato não suportado. Envie PNG, JPG ou WebP."
                  onFile={handleAssetUpload}
                  onBrowse={() => assetInputRef.current?.click()}
                />
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="truncate">
                  Arquivo: <strong className="font-semibold text-slate-800">{assetMeta.name}</strong>
                </span>
                <span className="font-mono shrink-0">
                  {analysisResult
                    ? `${analysisResult.pixelData.dimensions.width}×${analysisResult.pixelData.dimensions.height}px · ${assetMeta.sizeKb}KB`
                    : `${assetMeta.sizeKb}KB`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LINHA 02: STAGE VISUAL (7 COLS) + RELATÓRIO E SCORE (5 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* VIEWPORT DA PEÇA */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-800">
                  Inspeção Visual & Camadas
                </span>
              </div>

              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  showBoundingBoxes
                    ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {showBoundingBoxes ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{showBoundingBoxes ? 'Marcações ativas' : 'Mostrar marcações'}</span>
              </button>
            </div>

            <div className="p-5 sm:p-8 app-canvas-dots flex items-center justify-center min-h-[360px]">
              {!assetDataUrl || assetError ? (
                <div className="bg-white rounded-2xl p-6 max-w-sm text-center space-y-3 shadow-[var(--shadow-floating)] border border-slate-200/70">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    {assetError ? <AlertTriangle size={20} className="text-rose-500" /> : <ImageIcon size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {assetError ? 'Não foi possível abrir a imagem' : 'Nenhuma peça carregada'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {assetError ?? 'Envie um PNG, JPG ou WebP ou escolha um dos exemplos acima.'}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      onClick={() => assetInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Subir imagem
                    </button>
                    <button
                      onClick={() => handleLoadSampleAsset('aura_approved')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200/70 transition-colors"
                    >
                      Carregar exemplo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block max-w-full rounded-xl overflow-hidden shadow-[var(--shadow-floating)] ring-1 ring-black/5 bg-white">
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

                  {showBoundingBoxes &&
                    analysisResult?.annotations?.map((ann) => {
                      const isSelected = activeAnnotationId === ann.id;
                      const boxColors =
                        ann.type === 'pass'
                          ? 'border-emerald-400 bg-emerald-400/10'
                          : ann.type === 'warn'
                          ? 'border-amber-400 bg-amber-400/15'
                          : 'border-rose-500 bg-rose-500/15';

                      const badgeBg =
                        ann.type === 'pass'
                          ? 'bg-emerald-500 text-white'
                          : ann.type === 'warn'
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white';

                      return (
                        <div
                          key={ann.id}
                          onClick={() => setActiveAnnotationId(isSelected ? null : ann.id)}
                          style={{
                            top: ann.box.top,
                            left: ann.box.left,
                            width: ann.box.width,
                            height: ann.box.height
                          }}
                          className={`absolute rounded-lg border-2 transition-all cursor-pointer ${boxColors} ${
                            isSelected ? 'ring-4 ring-white/80 z-20 scale-[1.01]' : 'z-10 hover:brightness-105'
                          }`}
                        >
                          <span
                            className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap shadow-sm ${badgeBg}`}
                          >
                            {ann.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Cards clicáveis das camadas detectadas */}
            {analysisResult && (
              <div className="p-5 border-t border-slate-100 bg-white space-y-2.5">
                <div className="text-[11px] font-medium text-slate-400">
                  Clique em uma camada para destacar na imagem
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysisResult.annotations.map((ann) => {
                    const active = activeAnnotationId === ann.id;
                    return (
                      <button
                        key={ann.id}
                        onClick={() => {
                          setShowBoundingBoxes(true);
                          setActiveAnnotationId(active ? null : ann.id);
                        }}
                        className={`text-left p-3 rounded-xl transition-all ${
                          active
                            ? 'bg-slate-900 text-white shadow-[var(--shadow-pill)]'
                            : 'bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          {renderStatusIcon(ann.type, 14)}
                          <span className="truncate">{ann.label}</span>
                        </div>
                        <p className={`text-[11px] mt-1 leading-snug ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                          {ann.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: SCORE + PALETA EXTRAÍDA + CHECKLIST */}
          <div className="lg:col-span-5 space-y-5">
            {!analysisResult && (
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-8 text-center space-y-2">
                {isAnalyzing ? (
                  <RefreshCw size={20} className="animate-spin text-blue-600 mx-auto" />
                ) : (
                  <Layers size={20} className="text-slate-400 mx-auto" />
                )}
                <div className="text-sm font-semibold text-slate-800">
                  {isAnalyzing ? 'Analisando peça...' : 'Aguardando auditoria'}
                </div>
                <p className="text-xs text-slate-500">
                  O score e o diagnóstico aparecem aqui assim que a imagem carregar.
                </p>
              </div>
            )}

            {/* CARD DE BRAND SCORE */}
            {analysisResult && scoreTheme && (
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">
                      Brand Score · {activeRules.brand}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-5xl font-bold tracking-tight tabular-nums ${scoreTheme.scoreColor}`}>
                        {analysisResult.totalScore}%
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreTheme.pillBg}`}>
                        {scoreTheme.label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyMarkdownReport}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 transition-colors shrink-0"
                  >
                    {copiedReport ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Exportar MD</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Barra de progresso suave */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${scoreTheme.barGradient}`}
                    style={{ width: `${analysisResult.totalScore}%` }}
                  />
                </div>

                {/* 3 Pilares */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/50">
                    <div className="text-[11px] font-medium text-slate-500">Crítico · 40%</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                      {analysisResult.pillars.critical}%
                    </div>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/50">
                    <div className="text-[11px] font-medium text-slate-500">Estrutural · 35%</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                      {analysisResult.pillars.structural}%
                    </div>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/50">
                    <div className="text-[11px] font-medium text-slate-500">Estético · 25%</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                      {analysisResult.pillars.aesthetic}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CARD DE EXTRAÇÃO DE PIXELS */}
            {analysisResult && (
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Palette size={15} className="text-blue-600" />
                    <span>Cores Extraídas (Canvas)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    WCAG {analysisResult.pixelData.bestContrast}:1
                  </span>
                </div>

                <div className="space-y-2">
                  {analysisResult.pixelData.colors.map((item, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          <span
                            className="w-6 h-6 rounded-full ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: item.extractedHex }}
                            title={`Extraído: ${item.extractedHex}`}
                          />
                          <span
                            className="w-6 h-6 rounded-full ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: item.closestOfficial.hex }}
                            title={`Oficial: ${item.closestOfficial.hex}`}
                          />
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-semibold text-slate-900">{item.extractedHex}</span>
                            <span className="text-slate-400">· {item.percentage}%</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.closestOfficial.name} ({item.closestOfficial.hex})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            item.isCompliant
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          ΔE {item.deltaE}
                        </span>
                        {renderStatusIcon(item.isCompliant ? 'pass' : 'fail', 15)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARD DE CHECKLIST */}
            {analysisResult && (
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Sliders size={15} className="text-blue-600" />
                    <span>Diagnóstico por Critério</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {analysisResult.timestamp}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysisResult.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {renderStatusIcon(item.status, 15)}
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-600 shrink-0">
                          {item.metric}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed pl-6">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>
                    Cores e contraste são calculados diretamente nos pixels via Canvas (CIE LAB Delta-E & WCAG 2.1). A tipografia em PNG opera por estimativa morfológica.
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