/**
 * Dynamic OG Card Generator
 * 
 * Generates branded social preview images (PNG via svg2png-wasm) for:
 * - Company profiles (name + score)
 * - Battle comparisons (A vs B + scores)
 * - Score cards / receipts
 * - Career risk reports
 * 
 * LinkedIn requires PNG/JPEG — SVG is NOT supported for og:image.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { initialize, svg2png } from 'https://esm.sh/svg2png-wasm@0.6.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmUrl = 'https://esm.sh/svg2png-wasm@0.6.1/svg2png_wasm_bg.wasm';
  const wasmResp = await fetch(wasmUrl);
  const wasmBuf = await wasmResp.arrayBuffer();
  await initialize(wasmBuf);
  wasmInitialized = true;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

function bandLabel(score: number): string {
  if (score >= 80) return 'HIGH CLARITY';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'LOW CLARITY';
  return 'OPAQUE';
}

function generateCompanySVG(name: string, score: number, industry: string): string {
  const sc = scoreColor(score);
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="1200" height="4" fill="${sc}"/>
  <rect x="0" y="626" width="1200" height="4" fill="${sc}"/>
  
  <text x="60" y="80" font-family="monospace" font-size="11" fill="#888" letter-spacing="3">WHO DO I WORK FOR? — EMPLOYER INTELLIGENCE</text>
  
  <text x="60" y="200" font-family="sans-serif" font-weight="bold" font-size="64" fill="#fff">${escapeXml(name.length > 20 ? name.slice(0, 20) + '…' : name)}</text>
  <text x="60" y="240" font-family="monospace" font-size="16" fill="#888" letter-spacing="2">${escapeXml(industry.toUpperCase())}</text>
  
  <circle cx="1000" cy="300" r="120" fill="none" stroke="#333" stroke-width="8"/>
  <circle cx="1000" cy="300" r="120" fill="none" stroke="${sc}" stroke-width="8" 
    stroke-dasharray="${(score / 100) * 754} 754" transform="rotate(-90 1000 300)"/>
  <text x="1000" y="290" font-family="sans-serif" font-weight="bold" font-size="72" fill="#fff" text-anchor="middle">${score}</text>
  <text x="1000" y="330" font-family="monospace" font-size="14" fill="#888" text-anchor="middle" letter-spacing="2">/ 100</text>
  <text x="1000" y="360" font-family="monospace" font-size="11" fill="${sc}" text-anchor="middle" letter-spacing="3">${bandLabel(score)}</text>
  
  <text x="60" y="560" font-family="monospace" font-size="14" fill="#888" letter-spacing="2">KNOW BEFORE YOU SIGN → WDIWF.JACKYECLAYTON.COM</text>
  <text x="60" y="590" font-family="monospace" font-size="11" fill="#555">BY JACKYE CLAYTON · CAREER INTELLIGENCE</text>
</svg>`;
}

function generateBattleSVG(
  nameA: string, scoreA: number, industryA: string,
  nameB: string, scoreB: number, industryB: string
): string {
  const scA = scoreColor(scoreA);
  const scB = scoreColor(scoreB);
  const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null;
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="600" height="4" fill="${scA}"/>
  <rect x="600" y="0" width="600" height="4" fill="${scB}"/>
  
  <text x="600" y="60" font-family="monospace" font-size="11" fill="#888" text-anchor="middle" letter-spacing="3">WHO DO I WORK FOR? — BATTLE ARENA</text>
  
  <text x="300" y="180" font-family="sans-serif" font-weight="bold" font-size="${nameA.length > 12 ? 36 : 48}" fill="#fff" text-anchor="middle">${escapeXml(nameA.length > 18 ? nameA.slice(0, 18) + '…' : nameA)}</text>
  <text x="300" y="215" font-family="monospace" font-size="12" fill="#888" text-anchor="middle" letter-spacing="2">${escapeXml(industryA.toUpperCase())}</text>
  <circle cx="300" cy="350" r="90" fill="none" stroke="#333" stroke-width="6"/>
  <circle cx="300" cy="350" r="90" fill="none" stroke="${scA}" stroke-width="6" 
    stroke-dasharray="${(scoreA / 100) * 565} 565" transform="rotate(-90 300 350)"/>
  <text x="300" y="345" font-family="sans-serif" font-weight="bold" font-size="56" fill="#fff" text-anchor="middle">${scoreA}</text>
  <text x="300" y="380" font-family="monospace" font-size="12" fill="#888" text-anchor="middle">/ 100</text>
  ${winner === 'A' ? '<text x="300" y="480" font-family="monospace" font-size="14" fill="#22c55e" text-anchor="middle" letter-spacing="3">★ WINNER</text>' : ''}
  
  <text x="600" y="360" font-family="sans-serif" font-weight="bold" font-size="48" fill="#ef4444" text-anchor="middle">VS</text>
  <line x1="600" y1="100" x2="600" y2="280" stroke="#333" stroke-width="1"/>
  <line x1="600" y1="400" x2="600" y2="530" stroke="#333" stroke-width="1"/>
  
  <text x="900" y="180" font-family="sans-serif" font-weight="bold" font-size="${nameB.length > 12 ? 36 : 48}" fill="#fff" text-anchor="middle">${escapeXml(nameB.length > 18 ? nameB.slice(0, 18) + '…' : nameB)}</text>
  <text x="900" y="215" font-family="monospace" font-size="12" fill="#888" text-anchor="middle" letter-spacing="2">${escapeXml(industryB.toUpperCase())}</text>
  <circle cx="900" cy="350" r="90" fill="none" stroke="#333" stroke-width="6"/>
  <circle cx="900" cy="350" r="90" fill="none" stroke="${scB}" stroke-width="6" 
    stroke-dasharray="${(scoreB / 100) * 565} 565" transform="rotate(-90 900 350)"/>
  <text x="900" y="345" font-family="sans-serif" font-weight="bold" font-size="56" fill="#fff" text-anchor="middle">${scoreB}</text>
  <text x="900" y="380" font-family="monospace" font-size="12" fill="#888" text-anchor="middle">/ 100</text>
  ${winner === 'B' ? '<text x="900" y="480" font-family="monospace" font-size="14" fill="#22c55e" text-anchor="middle" letter-spacing="3">★ WINNER</text>' : ''}
  
  <text x="600" y="570" font-family="monospace" font-size="13" fill="#888" text-anchor="middle" letter-spacing="2">COMPARE YOUR EMPLOYER → WDIWF.JACKYECLAYTON.COM</text>
  <text x="600" y="600" font-family="monospace" font-size="11" fill="#555" text-anchor="middle">BY JACKYE CLAYTON · CAREER INTELLIGENCE</text>
</svg>`;
}

function generateReceiptSVG(companyName: string, score: number, signals: { label: string; score: number }[]): string {
  const sc = scoreColor(score);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
  
  // Receipt-style layout
  const signalRows = (signals || []).slice(0, 5).map((s, i) => {
    const y = 280 + i * 50;
    const barWidth = Math.max(10, (s.score / 100) * 500);
    const barColor = s.score >= 70 ? '#22c55e' : s.score >= 45 ? '#eab308' : '#ef4444';
    return `
      <text x="60" y="${y}" font-family="monospace" font-size="12" fill="#888" letter-spacing="2">${escapeXml(s.label.toUpperCase().slice(0, 25))}</text>
      <rect x="400" y="${y - 12}" width="${barWidth}" height="14" fill="${barColor}" rx="2"/>
      <text x="920" y="${y}" font-family="monospace" font-size="14" fill="#fff" text-anchor="end" font-weight="bold">${s.score}</text>
    `;
  }).join('');

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#111118"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="${sc}"/>
  
  <text x="60" y="60" font-family="monospace" font-size="11" fill="#888" letter-spacing="3">EMPLOYER RECEIPT — INTELLIGENCE REPORT</text>
  
  <text x="60" y="140" font-family="sans-serif" font-weight="bold" font-size="52" fill="#fff">${escapeXml(companyName.length > 22 ? companyName.slice(0, 22) + '…' : companyName)}</text>
  
  <text x="60" y="200" font-family="monospace" font-size="16" fill="#888">TRANSPARENCY SCORE</text>
  <text x="400" y="200" font-family="sans-serif" font-weight="bold" font-size="48" fill="${sc}">${score}</text>
  <text x="470" y="200" font-family="monospace" font-size="16" fill="#888">/100</text>
  <text x="560" y="200" font-family="monospace" font-size="18" fill="${sc}" letter-spacing="2">${bandLabel(score)}</text>

  <line x1="60" y1="230" x2="940" y2="230" stroke="#333" stroke-width="1" stroke-dasharray="4"/>
  
  ${signalRows}
  
  <line x1="60" y1="550" x2="940" y2="550" stroke="#333" stroke-width="1" stroke-dasharray="4"/>
  <text x="60" y="580" font-family="monospace" font-size="13" fill="${sc}" letter-spacing="2">KNOW BEFORE YOU SIGN</text>
  <text x="60" y="610" font-family="monospace" font-size="11" fill="#555">WDIWF.JACKYECLAYTON.COM · BY JACKYE CLAYTON</text>
</svg>`;
}

function generateCareerRiskSVG(companyName: string, riskScore: number, dimensions: { label: string; score: number }[]): string {
  // Risk: higher = worse, so invert colors
  const sc = riskScore >= 70 ? '#ef4444' : riskScore >= 45 ? '#eab308' : '#22c55e';
  const riskLabel = riskScore >= 70 ? 'HIGH RISK' : riskScore >= 45 ? 'MODERATE RISK' : 'LOW RISK';
  
  const dimRows = (dimensions || []).slice(0, 4).map((d, i) => {
    const y = 320 + i * 55;
    const barColor = d.score >= 70 ? '#ef4444' : d.score >= 45 ? '#eab308' : '#22c55e';
    const barWidth = Math.max(10, (d.score / 100) * 450);
    return `
      <text x="80" y="${y}" font-family="monospace" font-size="12" fill="#888" letter-spacing="1">${escapeXml(d.label.toUpperCase().slice(0, 28))}</text>
      <rect x="420" y="${y - 12}" width="${barWidth}" height="14" fill="${barColor}" rx="2"/>
      <text x="900" y="${y}" font-family="monospace" font-size="14" fill="#fff" text-anchor="end" font-weight="bold">${d.score}/100</text>
    `;
  }).join('');

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="1200" height="5" fill="${sc}"/>
  
  <text x="60" y="60" font-family="monospace" font-size="11" fill="#888" letter-spacing="3">CAREER RISK ASSESSMENT</text>
  
  <text x="60" y="150" font-family="sans-serif" font-weight="bold" font-size="48" fill="#fff">${escapeXml(companyName.length > 24 ? companyName.slice(0, 24) + '…' : companyName)}</text>
  
  <text x="60" y="220" font-family="monospace" font-size="14" fill="#888">RISK SCORE</text>
  <text x="60" y="275" font-family="sans-serif" font-weight="bold" font-size="72" fill="${sc}">${riskScore}</text>
  <text x="180" y="275" font-family="monospace" font-size="18" fill="#888">/100</text>
  <text x="300" y="275" font-family="monospace" font-size="16" fill="${sc}" letter-spacing="3">${riskLabel}</text>
  
  ${dimRows}
  
  <text x="60" y="580" font-family="monospace" font-size="13" fill="${sc}" letter-spacing="2">SHOULD YOU WORK HERE?</text>
  <text x="60" y="610" font-family="monospace" font-size="11" fill="#555">WDIWF.JACKYECLAYTON.COM · BY JACKYE CLAYTON</text>
</svg>`;
}

function generateScoreCardSVG(companyName: string, score: number, headline: string): string {
  const sc = scoreColor(score);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="${sc}"/>
  
  <text x="600" y="60" font-family="monospace" font-size="11" fill="#888" text-anchor="middle" letter-spacing="3">YOUR EMPLOYER INTELLIGENCE REPORT</text>
  
  <text x="600" y="160" font-family="sans-serif" font-weight="bold" font-size="32" fill="#fff" text-anchor="middle">${escapeXml(headline.length > 50 ? headline.slice(0, 50) + '…' : headline)}</text>
  
  <text x="600" y="380" font-family="sans-serif" font-weight="bold" font-size="160" fill="${sc}" text-anchor="middle">${grade}</text>
  <text x="600" y="430" font-family="monospace" font-size="24" fill="#fff" text-anchor="middle">${score} / 100</text>
  <text x="600" y="470" font-family="sans-serif" font-size="20" fill="#888" text-anchor="middle">${escapeXml(companyName)}</text>
  
  <text x="600" y="570" font-family="monospace" font-size="14" fill="${sc}" text-anchor="middle" letter-spacing="2">KNOW BEFORE YOU SIGN</text>
  <text x="600" y="600" font-family="monospace" font-size="11" fill="#555" text-anchor="middle">WDIWF.JACKYECLAYTON.COM · BY JACKYE CLAYTON</text>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, companyA, companyB, scoreA, scoreB, industryA, industryB, headline, signals, dimensions } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let svg: string;
    let cacheKey: string;

    switch (type) {
      case 'battle':
        if (!companyA || !companyB) throw new Error('Both companies required');
        svg = generateBattleSVG(
          companyA, scoreA || 0, industryA || 'Corporation',
          companyB, scoreB || 0, industryB || 'Corporation'
        );
        cacheKey = `og-battle-${[companyA, companyB].sort().join('-vs-').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
        break;

      case 'company':
        if (!companyA) throw new Error('Company name required');
        svg = generateCompanySVG(companyA, scoreA || 0, industryA || 'Corporation');
        cacheKey = `og-company-${companyA.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        break;

      case 'receipt':
        if (!companyA) throw new Error('Company name required');
        svg = generateReceiptSVG(companyA, scoreA || 0, signals || []);
        cacheKey = `og-receipt-${companyA.toLowerCase().replace(/[^a-z0-9]/g, '')}-${scoreA || 0}`;
        break;

      case 'career-risk':
        if (!companyA) throw new Error('Company name required');
        svg = generateCareerRiskSVG(companyA, scoreA || 0, dimensions || []);
        cacheKey = `og-career-risk-${companyA.toLowerCase().replace(/[^a-z0-9]/g, '')}-${scoreA || 0}`;
        break;

      case 'scorecard':
        if (!companyA) throw new Error('Company name required');
        svg = generateScoreCardSVG(companyA, scoreA || 0, headline || 'Your employer transparency score');
        cacheKey = `og-scorecard-${companyA.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        break;

      default:
        throw new Error('Invalid type. Use: company, battle, scorecard, receipt, career-risk');
    }

    const fileName = `${cacheKey}.png`;

    // Check cache
    const { data: existing } = await supabase.storage.from('battle-images').createSignedUrl(fileName, 3600);
    if (existing?.signedUrl) {
      const check = await fetch(existing.signedUrl, { method: 'HEAD' });
      if (check.ok) {
        const { data: publicUrl } = supabase.storage.from('battle-images').getPublicUrl(fileName);
        return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Convert SVG → PNG using svg2png-wasm
    await ensureWasm();
    const pngBytes = await svg2png(svg, { width: 1200, height: 630 });

    // Upload PNG
    const { error: uploadError } = await supabase.storage
      .from('battle-images')
      .upload(fileName, pngBytes, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to store OG image');
    }

    const { data: publicUrl } = supabase.storage.from('battle-images').getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('OG card error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
