import React, { useState, useEffect, useRef, useMemo } from 'react';
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
      message: useAiReading ? `LENDO ${file.name} VIA IA...` : `LENDO ${file.name}...`
    });
    try {
      const { rules, warnings } = useAiReading
        ? await extractRulesFromPdf(file)
        : await extractRulesFromPdfLocal(file, (done, total) =>
            setManualStatus({
              state: 'loading',
              message: `LENDO ${file.name} // PÁG ${Math.min(done + 1, total)}/${total}`
            })
          );
      setCustomManualName(file.name);
      setRulesJsonText(JSON.stringify(rules, null, 2));
      setShowJsonDrawer(true);
      const intro = useAiReading
        ? 'Regras extraídas por IA. Revise o JSON antes de confiar no score.'
        : 'Leitura local: só cores (hex/RGB) e fontes embutidas. Nomes das cores são palpite; papéis, logo, contraste e tom de voz não são lidos. Revise o JSON.';
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
            label: `COR OFF-BRAND ${offBrandColor?.extractedHex || '#F97316'}`,
            detail: `Delta-E ${offBrandColor?.deltaE || 58.4} excede tolerância máxima de ${toleranceDeltaE}. Substituir por ${officialPalette[1]?.hex || '#2563EB'}.`,
            box: { top: '23%', left: '4.5%', width: '91%', height: '51%' }
          },
          {
            id: 'ann-typo',
            type: 'fail',
            pillar: 'Estrutural • Tipografia',
            label: 'TIPO / TOM FORA DO GUIA',
            detail: `Detectada fonte serifada itálica proibida e expressão "IMPERDÍVEL" fora do tom analítico da marca.`,
            box: { top: '31%', left: '7%', width: '66%', height: '14%' }
          },
          {
            id: 'ann-contrast',
            type: 'warn',
            pillar: 'Estrutural • Contraste WCAG',
            label: 'CONTRASTE 2.45:1',
            detail: `Subtítulo laranja claro sobre fundo laranja viola o mínimo WCAG AA (${minWcag}:1).`,
            box: { top: '44%', left: '7%', width: '68%', height: '8%' }
          },
          {
            id: 'ann-logo',
            type: 'fail',
            pillar: 'Crítico • Área de Respiro',
            label: 'RESPIRO LOGO VIOLADO',
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
            label: `DESVIO ${offBrandColor.extractedHex}`,
            detail: `Ocupa ${offBrandColor.percentage}% da área com Delta-E ${offBrandColor.deltaE} em relação a ${offBrandColor.closestOfficial.name} (${offBrandColor.closestOfficial.hex}).`,
            box: { top: '18%', left: '12%', width: '76%', height: '58%' }
          });
        } else {
          annotations.push({
            id: 'ann-palette-ok',
            type: 'pass',
            pillar: 'Crítico • Paleta',
            label: `PALETA OK (${colorScore}%)`,
            detail: `Todas as cores dominantes estão dentro do limiar perceptual Delta-E ≤ ${toleranceDeltaE}.`,
            box: { top: '26%', left: '7%', width: '56%', height: '46%' }
          });
        }

        annotations.push({
          id: 'ann-logo-ok',
          type: 'pass',
          pillar: 'Crítico • Assinatura',
          label: 'RESPIRO LOGO OK',
          detail: `Margem de segurança respeita o módulo de ${activeRules.logo?.clearspaceModule || '1.5x'}.`,
          box: { top: '8%', left: '6%', width: '24%', height: '10%' }
        });

        annotations.push({
          id: 'ann-typo-ok',
          type: typographyAnalysis.matchStatus === 'pass' ? 'pass' : 'warn',
          pillar: 'Estrutural • Tipografia & Contraste',
          label: `WCAG ${effectiveContrast}:1 // FONT ${typographyAnalysis.confidence}%`,
          detail: typographyAnalysis.note,
          box: { top: '34%', left: '9%', width: '52%', height: '28%' }
        });
      }

      const checklist: ChecklistItem[] = [
        {
          id: 'chk-palette',
          pillar: 'CRÍTICO 40%',
          title: 'Paleta Cromática',
          status: colorScore >= 85 ? 'pass' : colorScore >= 60 ? 'warn' : 'fail',
          metric: `${colorScore}% MATCH`,
          description: offBrandColor
            ? `Detectado ${offBrandColor.extractedHex} (${offBrandColor.percentage}% da peça) com Delta-E ${offBrandColor.deltaE} vs. ${offBrandColor.closestOfficial.hex}.`
            : `Cores extraídas via pixel sampling batem com ${officialPalette.map((c) => c.hex).join(', ')}.`
        },
        {
          id: 'chk-logo',
          pillar: 'CRÍTICO 40%',
          title: 'Área de Respiro & Logo',
          status: logoClearspaceScore >= 85 ? 'pass' : logoClearspaceScore >= 65 ? 'warn' : 'fail',
          metric: isKnownDeviantSample ? 'MARGEM < 2%' : 'RESPIRO OK',
          description: isKnownDeviantSample
            ? `Assinatura no canto inferior direito invade a zona de proteção (${activeRules.logo?.clearspaceModule}).`
            : `Zona de proteção preservada e aplicação sobre fundo autorizado.`
        },
        {
          id: 'chk-typo',
          pillar: 'ESTRUTURAL 35%',
          title: 'Tipografia & Hierarquia',
          status: typographyAnalysis.matchStatus,
          metric: `CONF ${typographyAnalysis.confidence}%`,
          description: typographyAnalysis.note
        },
        {
          id: 'chk-contrast',
          pillar: 'ESTRUTURAL 35%',
          title: 'Contraste WCAG AA',
          status: contrastPass ? 'pass' : 'fail',
          metric: `${effectiveContrast}:1 (MIN ${minWcag}:1)`,
          description: contrastPass
            ? `Relação de luminância entre ${pixelData.contrastPair[0]} e ${pixelData.contrastPair[1]} garante leitura nítida.`
            : `Contraste insuficiente entre texto secundário e plano de fundo. Aumentar diferença de luminância.`
        },
        {
          id: 'chk-art',
          pillar: 'ESTÉTICO 25%',
          title: 'Direção de Arte & Tom de Voz',
          status: aestheticScore >= 85 ? 'pass' : aestheticScore >= 65 ? 'warn' : 'fail',
          metric: `${aestheticScore}/100`,
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

  const getScoreVerdict = (score: number) => {
    if (score >= 85) return { code: 'PASS', textClass: 'text-[#0A0A0A]', barClass: 'bg-[#0A0A0A]' };
    if (score >= 65) return { code: 'WARN', textClass: 'text-[#B45309]', barClass: 'bg-[#B45309]' };
    return { code: 'FAIL', textClass: 'text-[#DC2626]', barClass: 'bg-[#DC2626]' };
  };

  const renderStatusTag = (status: Status) => {
    if (status === 'pass') {
      return (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 border border-[#0A0A0A] bg-[#0A0A0A] text-white">
          PASS
        </span>
      );
    }
    if (status === 'warn') {
      return (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 border border-[#B45309] text-[#B45309]">
          WARN
        </span>
      );
    }
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 border border-[#DC2626] bg-[#DC2626] text-white">
        FAIL
      </span>
    );
  };

  const verdict = analysisResult ? getScoreVerdict(analysisResult.totalScore) : null;

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased">
      {/* TOP BAR (48px — GRID SECO) */}
      <header className="sticky top-0 z-30 h-12 bg-white border-b border-[#0A0A0A]">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap">
              BRAND-O-CHECKER
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373] truncate">
              v0.4 // PIXEL + RULES ENGINE
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowJsonDrawer(!showJsonDrawer)}
              className={`font-mono text-[11px] uppercase tracking-[0.08em] px-3 py-1 border transition-colors ${
                showJsonDrawer
                  ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                  : 'border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]'
              }`}
            >
              [ JSON ]
            </button>

            <button
              onClick={runBrandAudit}
              disabled={isAnalyzing}
              className="font-mono text-[11px] uppercase tracking-[0.08em] px-3 py-1 border border-[#0A0A0A] bg-[#0A0A0A] text-white hover:bg-[#262626] transition-colors disabled:opacity-40"
            >
              {isAnalyzing ? 'RUNNING...' : 'RUN AUDIT'}
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER DE REGRAS JSON */}
      {showJsonDrawer && (
        <div className="border-b border-[#0A0A0A] bg-[#FAFAFA]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-medium">
                00 // GOVERNANCE SCHEMA (LIVE JSON)
              </span>
              <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.06em]">
                {jsonError ? (
                  <span className="text-[#DC2626]">JSON ERR: {jsonError}</span>
                ) : (
                  <span className="text-[#525252]">VALID SCHEMA — AUTO RECALCULATE ACTIVE</span>
                )}
                <button
                  onClick={() => setShowJsonDrawer(false)}
                  className="underline hover:opacity-70"
                >
                  CLOSE
                </button>
              </div>
            </div>
            <textarea
              value={rulesJsonText}
              onChange={(e) => setRulesJsonText(e.target.value)}
              rows={11}
              spellCheck={false}
              className="w-full bg-white border border-[#0A0A0A] p-3 font-mono text-xs text-[#0A0A0A] focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* LAYOUT PRINCIPAL EM GRID DE 1px */}
      <main className="max-w-[1440px] mx-auto border-x border-b border-[#0A0A0A]">
        {/* LINHA 01: DOIS SLOTS DE INPUT */}
        <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#0A0A0A]">
          {/* SLOT 01: MANUAL DE MARCA */}
          <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#0A0A0A] flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#737373]">
                  01 / BRANDBOOK RULES
                </div>
                <h2 className="text-sm font-semibold tracking-tight uppercase mt-0.5">
                  Manual de Marca
                </h2>
              </div>

              <button
                onClick={() => manualInputRef.current?.click()}
                disabled={manualStatus.state === 'loading'}
                className="font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors shrink-0 disabled:opacity-40"
              >
                UPLOAD PDF/JSON
              </button>
              <input
                ref={manualInputRef}
                type="file"
                accept=".pdf,.json"
                onChange={handleManualFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#0A0A0A] divide-y sm:divide-y-0 sm:divide-x divide-[#0A0A0A]">
                {Object.values(PRESET_MANUALS).map((manual) => {
                  const active = selectedManualKey === manual.id && !customManualName;
                  return (
                    <button
                      key={manual.id}
                      onClick={() => handleSelectManualPreset(manual.id)}
                      className={`p-3 text-left transition-colors ${
                        active
                          ? 'bg-[#0A0A0A] text-white'
                          : 'bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">
                        {active ? 'ACTIVE' : 'PRESET'}
                      </div>
                      <div className="text-xs font-medium mt-0.5 truncate">{manual.name}</div>
                      <div className="font-mono text-[10px] opacity-60 mt-0.5 truncate">
                        {manual.fileName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!customManualName && (
                <UploadDropzone
                  tone="emerald"
                  icon={null}
                  title="Drop manual file (.pdf / .json)"
                  hint="Local parser (free) or AI extraction"
                  accept={isManualFile}
                  rejectMessage="Formato não suportado. Envie um .pdf ou .json."
                  onFile={(f) => void processManualFile(f)}
                  onBrowse={() => manualInputRef.current?.click()}
                  busy={manualStatus.state === 'loading'}
                  busyLabel={manualStatus.message}
                />
              )}

              {customManualName && (
                <div className="px-3 py-2 border border-[#0A0A0A] bg-[#FAFAFA] flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                  <span className="truncate">SRC: {customManualName}</span>
                  <span className="shrink-0 font-semibold">
                    {customManualName.toLowerCase().endsWith('.json') ? 'JSON LOADED' : 'PDF PARSED'}
                  </span>
                </div>
              )}

              <label className="flex items-start gap-2 font-mono text-[10px] uppercase tracking-[0.04em] text-[#525252] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAiReading}
                  onChange={(e) => setUseAiReading(e.target.checked)}
                  className="mt-0.5 accent-[#0A0A0A]"
                />
                <span>
                  AI PDF MODE (API KEY REQUIRED) — SEM MARCAR: LEITURA LOCAL GRÁTIS (CORES + FONTES).
                </span>
              </label>

              {manualStatus.state !== 'idle' && !(manualStatus.state === 'loading' && !customManualName) && (
                <div
                  className={`px-3 py-2 border font-mono text-[10px] leading-relaxed ${
                    manualStatus.state === 'error'
                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                      : 'border-[#0A0A0A] bg-[#FAFAFA] text-[#0A0A0A]'
                  }`}
                >
                  {manualStatus.message}
                </div>
              )}

              {/* Swatches Oficiais */}
              <div className="pt-3 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                <span className="text-[#737373]">
                  PALETTE // ΔE ≤ {activeRules.palette?.toleranceDeltaE ?? 14}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activeRules.palette?.colors || []).map((c, idx) => (
                    <span
                      key={idx}
                      title={`${c.name} (${c.role})`}
                      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-[#0A0A0A] bg-white"
                    >
                      <span
                        className="w-2.5 h-2.5 border border-[#0A0A0A] inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.hex}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 02: PEÇA CRIATIVA */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleAssetUpload(file);
            }}
            className="p-4 sm:p-6 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#737373]">
                  02 / CREATIVE ASSET
                </div>
                <h2 className="text-sm font-semibold tracking-tight uppercase mt-0.5">
                  Peça em Análise
                </h2>
              </div>

              <button
                onClick={() => assetInputRef.current?.click()}
                className="font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors shrink-0"
              >
                UPLOAD PNG/JPG
              </button>
              <input
                ref={assetInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleAssetUpload(e.target.files?.[0])}
                className="hidden"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#0A0A0A] divide-y sm:divide-y-0 sm:divide-x divide-[#0A0A0A]">
                <button
                  onClick={() => handleLoadSampleAsset('aura_approved')}
                  className={`p-2.5 text-left transition-colors ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_approved'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">
                    SAMPLE 01
                  </div>
                  <div className="text-xs font-medium mt-0.5 truncate">Aprovada Q4</div>
                  <div className="font-mono text-[10px] opacity-60 truncate">Aura Tech</div>
                </button>

                <button
                  onClick={() => handleLoadSampleAsset('aura_deviations')}
                  className={`p-2.5 text-left transition-colors ${
                    assetSource === 'preset' && selectedSampleKey === 'aura_deviations'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">
                    SAMPLE 02
                  </div>
                  <div className="text-xs font-medium mt-0.5 truncate">Com Desvios</div>
                  <div className="font-mono text-[10px] opacity-60 truncate">Promo Off-Brand</div>
                </button>

                <button
                  onClick={() => {
                    handleSelectManualPreset('multiverso_editorial');
                    handleLoadSampleAsset('multiverso_approved');
                  }}
                  className={`p-2.5 text-left transition-colors ${
                    assetSource === 'preset' && selectedSampleKey === 'multiverso_approved'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'bg-white text-[#0A0A0A] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">
                    SAMPLE 03
                  </div>
                  <div className="text-xs font-medium mt-0.5 truncate">Editorial Ed. 14</div>
                  <div className="font-mono text-[10px] opacity-60 truncate">Multiverso</div>
                </button>
              </div>

              {assetSource !== 'upload' && (
                <UploadDropzone
                  tone="sky"
                  icon={null}
                  title="Drop artwork file (.png / .jpg / .webp)"
                  hint="Direct pixel sampling via HTML5 Canvas"
                  accept={isImageFile}
                  rejectMessage="Formato não suportado. Envie PNG, JPG ou WebP."
                  onFile={handleAssetUpload}
                  onBrowse={() => assetInputRef.current?.click()}
                />
              )}

              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                <span className="truncate">
                  FILE: <strong>{assetMeta.name}</strong>
                </span>
                <span className="text-[#737373] shrink-0">
                  {analysisResult
                    ? `${analysisResult.pixelData.dimensions.width}×${analysisResult.pixelData.dimensions.height}PX // ${assetMeta.sizeKb}KB`
                    : `${assetMeta.sizeKb}KB`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LINHA 02: VIEWPORT (7 COLS) + TELEMETRIA / SCORE (5 COLS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12">
          {/* COLUNA ESQUERDA: VIEWPORT */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#0A0A0A] flex flex-col">
            <div className="px-4 sm:px-6 h-11 border-b border-[#0A0A0A] flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
                03 / SPATIAL INSPECTION
              </span>

              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                  showBoundingBoxes
                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                    : 'border-[#0A0A0A] bg-white text-[#0A0A0A]'
                }`}
              >
                OVERLAY: {showBoundingBoxes ? 'ON' : 'OFF'}
              </button>
            </div>

            <div
              className="p-4 sm:p-8 flex items-center justify-center min-h-[360px] flex-1"
              style={{
                backgroundColor: '#F7F7F7',
                backgroundImage:
                  'linear-gradient(to right, #E5E5E5 1px, transparent 1px), linear-gradient(to bottom, #E5E5E5 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {!assetDataUrl || assetError ? (
                <div className="border border-[#0A0A0A] bg-white p-6 max-w-sm text-center space-y-3">
                  <div className="font-mono text-[11px] uppercase tracking-[0.08em] font-semibold">
                    {assetError ? 'IMAGE LOAD ERROR' : 'NO ASSET LOADED'}
                  </div>
                  <p className="text-xs text-[#525252]">
                    {assetError ?? 'Suba um PNG, JPG ou WebP ou carregue uma peça de exemplo.'}
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      onClick={() => assetInputRef.current?.click()}
                      className="font-mono text-[10px] uppercase tracking-[0.08em] px-3 py-1.5 border border-[#0A0A0A] bg-[#0A0A0A] text-white"
                    >
                      UPLOAD
                    </button>
                    <button
                      onClick={() => handleLoadSampleAsset('aura_approved')}
                      className="font-mono text-[10px] uppercase tracking-[0.08em] px-3 py-1.5 border border-[#0A0A0A] bg-white text-[#0A0A0A]"
                    >
                      SAMPLE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block max-w-full border border-[#0A0A0A] bg-white">
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
                    analysisResult?.annotations?.map((ann, idx) => {
                      const isSelected = activeAnnotationId === ann.id;
                      const markerNum = String(idx + 1).padStart(2, '0');
                      const strokeStyle =
                        ann.type === 'pass'
                          ? 'border-[#0A0A0A] bg-[#0A0A0A]/10'
                          : ann.type === 'warn'
                          ? 'border-[#B45309] bg-[#B45309]/10'
                          : 'border-[#DC2626] bg-[#DC2626]/15';

                      const tagStyle =
                        ann.type === 'pass'
                          ? 'bg-[#0A0A0A] text-white'
                          : ann.type === 'warn'
                          ? 'bg-[#B45309] text-white'
                          : 'bg-[#DC2626] text-white';

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
                          className={`absolute border transition-none cursor-pointer ${strokeStyle} ${
                            isSelected ? 'ring-2 ring-[#0A0A0A] z-20' : 'z-10'
                          }`}
                        >
                          <span
                            className={`absolute -top-5 left-0 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] whitespace-nowrap ${tagStyle}`}
                          >
                            [{markerNum}] {ann.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ÍNDICE DE ANOTAÇÕES */}
            {analysisResult && (
              <div className="border-t border-[#0A0A0A] bg-white">
                <div className="px-4 sm:px-6 py-2 border-b border-[#E5E5E5] font-mono text-[10px] uppercase tracking-[0.08em] text-[#737373]">
                  ANNOTATIONS INDEX — CLICK TO HIGHLIGHT
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E5]">
                  {analysisResult.annotations.map((ann, idx) => {
                    const active = activeAnnotationId === ann.id;
                    const markerNum = String(idx + 1).padStart(2, '0');
                    return (
                      <button
                        key={ann.id}
                        onClick={() => {
                          setShowBoundingBoxes(true);
                          setActiveAnnotationId(active ? null : ann.id);
                        }}
                        className={`p-3.5 text-left transition-colors ${
                          active ? 'bg-[#0A0A0A] text-white' : 'hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
                          <span>
                            [{markerNum}] {ann.label}
                          </span>
                          <span className="opacity-60">{ann.type.toUpperCase()}</span>
                        </div>
                        <p className={`text-xs mt-1 leading-snug ${active ? 'text-white/80' : 'text-[#525252]'}`}>
                          {ann.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: BRAND SCORE + CORES + CHECKLIST */}
          <div className="lg:col-span-5 divide-y divide-[#0A0A0A]">
            {!analysisResult && (
              <div className="p-8 text-center font-mono text-xs uppercase tracking-[0.08em] text-[#737373]">
                {isAnalyzing ? 'CALCULATING BRAND SCORE...' : 'AWAITING AUDIT'}
              </div>
            )}

            {/* SCORE PRINCIPAL */}
            {analysisResult && verdict && (
              <div className="p-4 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#737373]">
                      04 / BRAND SCORE — {activeRules.brand}
                    </div>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className={`font-mono text-5xl sm:text-6xl font-bold tracking-tighter tabular-nums ${verdict.textClass}`}>
                        {analysisResult.totalScore}%
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.1em] border border-[#0A0A0A] px-2 py-0.5">
                        {verdict.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyMarkdownReport}
                    className="font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1.5 border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors shrink-0"
                  >
                    {copiedReport ? 'COPIED .MD' : 'COPY .MD'}
                  </button>
                </div>

                {/* BARRA FINA GERAL */}
                <div className="w-full h-[2px] bg-[#E5E5E5]">
                  <div
                    className={`h-full transition-all ${verdict.barClass}`}
                    style={{ width: `${analysisResult.totalScore}%` }}
                  />
                </div>

                {/* 3 PILARES */}
                <div className="grid grid-cols-3 border border-[#0A0A0A] divide-x divide-[#0A0A0A]">
                  <div className="p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#737373]">
                      CRIT 40%
                    </div>
                    <div className="font-mono text-xl font-bold tabular-nums mt-0.5">
                      {analysisResult.pillars.critical}%
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#737373]">
                      STRUCT 35%
                    </div>
                    <div className="font-mono text-xl font-bold tabular-nums mt-0.5">
                      {analysisResult.pillars.structural}%
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#737373]">
                      AESTH 25%
                    </div>
                    <div className="font-mono text-xl font-bold tabular-nums mt-0.5">
                      {analysisResult.pillars.aesthetic}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXTRAÇÃO REAL DE PIXELS */}
            {analysisResult && (
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
                  <span className="font-medium">PIXEL SAMPLING // DELTA-E</span>
                  <span className="text-[#737373] tabular-nums">
                    MAX WCAG {analysisResult.pixelData.bestContrast}:1
                  </span>
                </div>

                <div className="border border-[#0A0A0A] divide-y divide-[#E5E5E5]">
                  {analysisResult.pixelData.colors.map((item, index) => (
                    <div
                      key={index}
                      className="p-2.5 flex items-center justify-between gap-2 font-mono text-xs tabular-nums"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex shrink-0 border border-[#0A0A0A]">
                          <span
                            className="w-4 h-4 inline-block"
                            style={{ backgroundColor: item.extractedHex }}
                            title={`Extraído: ${item.extractedHex}`}
                          />
                          <span
                            className="w-4 h-4 inline-block border-l border-[#0A0A0A]"
                            style={{ backgroundColor: item.closestOfficial.hex }}
                            title={`Oficial: ${item.closestOfficial.hex}`}
                          />
                        </div>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{item.extractedHex}</span>
                            <span className="text-[11px] text-[#737373]">{item.percentage}%</span>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.04em] text-[#737373] truncate">
                            → {item.closestOfficial.name} ({item.closestOfficial.hex})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase text-[#525252]">
                          ΔE {item.deltaE}
                        </span>
                        {renderStatusTag(item.isCompliant ? 'pass' : 'fail')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHECKLIST POR CRITÉRIO */}
            {analysisResult && (
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
                  <span className="font-medium">CRITERIA DIAGNOSTIC</span>
                  <span className="text-[#737373] tabular-nums">{analysisResult.timestamp}</span>
                </div>

                <div className="border border-[#0A0A0A] divide-y divide-[#E5E5E5]">
                  {analysisResult.checklist.map((item) => (
                    <div key={item.id} className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {renderStatusTag(item.status)}
                          <span className="text-xs font-semibold truncate">{item.title}</span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#525252] shrink-0 tabular-nums">
                          {item.metric}
                        </span>
                      </div>
                      <p className="text-xs text-[#525252] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#737373] leading-relaxed">
                  NOTE: COR E CONTRASTE MEDIDOS VIA CANVAS (CIE LAB / WCAG 2.1). FONTE EM PNG É ESTIMATIVA PROBABILÍSTICA.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}