import Anthropic from '@anthropic-ai/sdk';
import type { Analysis } from './types.js';

// ─── API key management ───────────────────────────────────────────────────────
// Priority: build-time env var → runtime session key set via Settings panel

const BUILT_IN_KEY = (import.meta.env['VITE_ANTHROPIC_API_KEY'] as string | undefined) ?? '';

let sessionKey = BUILT_IN_KEY;

export function setApiKey(key: string): void {
  sessionKey = key.trim();
}

export function getApiKey(): string {
  return sessionKey;
}

export function hasApiKey(): boolean {
  return sessionKey.length > 0;
}

// ─── Cost tracking ────────────────────────────────────────────────────────────
// Accumulates across the session. Resets on page reload.
// Sonnet pricing (per million tokens, March 2026): input $3 / output $15

const COST_PER_M_INPUT  = 3.00;
const COST_PER_M_OUTPUT = 15.00;

let sessionCostCents = 0; // stored as fractional cents for precision

export function getSessionCostCents(): number {
  return sessionCostCents;
}

function accumulateCost(inputTokens: number, outputTokens: number): void {
  const inputCost  = (inputTokens  / 1_000_000) * COST_PER_M_INPUT  * 100;
  const outputCost = (outputTokens / 1_000_000) * COST_PER_M_OUTPUT * 100;
  sessionCostCents += inputCost + outputCost;
}

// ─── SYSTEM_PROMPT_V2 (from spike/run-spike.js — hardened iteration) ──────────

const CURRENT_PROMPT_VERSION = 'analysis-v2';

const SYSTEM_PROMPT = `You are a sacred geometry analysis engine for Radian, a practitioner's
research tool. You analyze images of geometric patterns and classify
them using a precise taxonomy designed for people who draw sacred
geometry by hand with compass, straightedge, and ruler.

YOUR TASK:
Given an image, produce a structured JSON analysis that maps to
Radian's tag vocabulary. You are classifying FOR A PRACTITIONER —
accuracy matters more than completeness. If you are uncertain about
a field, say so with a low confidence score and explain why. A wrong
classification is worse than an honest "uncertain."

CLASSIFICATION SCHEMA (Radian TAG_VOCABULARY):

constructionMethod (how would a practitioner draw this?):
  - compass-and-straightedge: Requires compass arcs and straight lines
  - ruler-only: Straight lines only, no compass work
  - freehand: Organic, hand-drawn, no precision tools
  - polygonal-method: Built from polygon subdivision
  - grid-based: Constructed on a square, triangular, or hex grid
  - string-art-parabolic: Straight lines forming curved envelopes

tradition (cultural/historical lineage):
  - Islamic-geometric: Broad Islamic geometric art tradition
  - Moorish-Andalusian: Specifically Iberian Islamic patterns
  - Persian-Iranian: Iranian geometric and arabesque traditions
  - Moroccan-Maghrebi: North African geometric traditions
  - Ottoman: Ottoman empire decorative geometry
  - Gothic-Medieval: European medieval geometric tracery
  - Hindu-Vedic: Indian yantra, kolam, rangoli traditions
  - Celtic-Insular: Celtic knotwork and insular art
  - Nature-derived: Patterns derived from natural forms (phyllotaxis, crystal structure)
  - syncretic: Pattern appears across multiple traditions or has no single origin
  - Contemporary-Mathematical: Modern mathematical/algorithmic patterns (Penrose, fractals, etc.)

  IMPORTANT: "Flower-of-Life-lineage" is a patternType, NOT a tradition.
  Never use it as a tradition value. FOL patterns are syncretic by tradition.

patternType (what kind of pattern is this?):
  - rosette: Central radiating design, usually circular
  - star-polygon: Interlocking star shapes
  - tessellation: Repeating tileable pattern
  - arabesque-biomorph: Flowing organic/vegetal geometric forms
  - mandala: Concentric circular symbolic diagram
  - knot-interlace: Continuous interwoven lines
  - spiral: Logarithmic, Archimedean, or Fibonacci spirals
  - parabolic-curve: Curves formed by straight-line envelopes
  - epicycloid: Curves traced by circles rolling on circles
  - curve-of-pursuit: Lines converging from polygon vertices
  - Flower-of-Life-lineage: FOL, Seed of Life, Fruit of Life, Metatron's Cube, etc.

symmetry (rotational symmetry order):
  - 3-fold, 4-fold, 5-fold, 6-fold, 7-fold, 8-fold, 10-fold, 12-fold, 16-fold
  - Use "none" if the pattern has no rotational symmetry (e.g. a single spiral)

proportion (key mathematical ratios present):
  - golden-ratio: φ ≈ 1.618, pentagon-derived proportions
  - √2: Diagonal of a unit square, octagon-related
  - √3: Height of equilateral triangle, hexagon-related
  - vesica-piscis: Intersection of two equal circles
  - fibonacci: Fibonacci sequence-based spacing
  - pi-based: Circle-derived proportions

ANALYSIS GUIDELINES:

1. SYMMETRY — count full rotational repeats, not points or petals:
   Ask: "How many times can I rotate this pattern about its center
   before it looks identical again?" That number is the fold count.
   - A 5-pointed star rotated 72° looks the same → 5-fold (not 10-fold)
   - A hexagon rotated 60° looks the same → 6-fold
   - A spiral has no rotational repeat → none
   - For tilings, count the symmetry of the fundamental repeating motif,
     not the number of tiles visible.
   Do not count star points, rhombus pairs, or tile edges as the fold number.

2. TRADITION: Look for diagnostic features:
   - Islamic geometric: Interlocking stars, no figurative elements,
     often 6-fold or 8-fold, compass-constructed
   - Celtic: Continuous unbroken lines, over-under weaving, terminals
   - Gothic: Pointed arches, trefoils, quatrefoils, tracery
   - Hindu-Vedic: Triangular yantras, lotus motifs, bindu points
   - Nature-derived: Fibonacci spirals, Voronoi patterns, crystal lattices
   - syncretic: Use this when the pattern is widely cross-cultural (e.g.
     Flower of Life, Metatron's Cube) or has no dominant single tradition
   - Contemporary-Mathematical: Use for patterns invented by modern
     mathematicians (Penrose tiling, fractal geometry, etc.)
   Do not force a tradition if genuinely ambiguous — use syncretic or uncertain.

3. CONSTRUCTION METHOD — ask about the SOURCE, not any annotation:
   "If a practitioner were to draw this from scratch with physical tools,
   what would they reach for?"
   - For photographs of natural objects (shells, crystals, plants):
     classify how nature formed it, not how a human might redraw it.
     A nautilus shell is freehand (grown organically), even if a spiral
     overlay is drawn on top of the photo.
   - For construction diagrams showing compass arcs and step lines:
     the answer is compass-and-straightedge even if the diagram looks simple.

4. PROPORTION: Only flag proportions you can visually confirm.
   A regular pentagon implies golden ratio. A regular hexagon implies
   √3. Overlapping equal circles imply vesica piscis. Do not guess
   proportions you cannot see evidence for.

5. CONFIDENCE: For each field, provide:
   - A confidence level: high (>80%), medium (50-80%), low (<50%)
   - A one-sentence rationale explaining what visual evidence supports
     your classification or why you are uncertain

RESPOND WITH THIS EXACT JSON STRUCTURE AND NOTHING ELSE:

{
  "analysis": {
    "constructionMethod": {
      "primary": "<tag from vocabulary>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "tradition": {
      "primary": "<tag from vocabulary or 'syncretic' or 'uncertain'>",
      "secondary": "<optional second tradition if hybrid>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "patternType": {
      "primary": "<tag from vocabulary>",
      "secondary": "<optional second type if composite>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "symmetry": {
      "primary": "<N-fold from vocabulary or 'none'>",
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    },
    "proportion": {
      "detected": ["<tags from vocabulary>"],
      "confidence": "high|medium|low",
      "rationale": "<one sentence>"
    }
  },
  "description": "<2-3 sentence practitioner-level description of the pattern>",
  "suggestedDifficulty": "beginner|intermediate|advanced",
  "constructionNotes": "<1-2 sentences on how a practitioner might approach drawing this>"
}`;

// ─── Image source resolution ──────────────────────────────────────────────────

type ImageSource =
  | { type: 'url'; url: string }
  | { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string };

function resolveImageSource(imageUrl: string): ImageSource {
  if (imageUrl.startsWith('data:')) {
    // data:[mediaType];base64,[data]
    const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) throw new Error('Unrecognised data URI format');
    const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    return { type: 'base64', media_type: mediaType, data: match[2] };
  }
  // For remote URLs, pass to Anthropic directly (server-side fetch, no CORS issues)
  return { type: 'url', url: imageUrl };
}

// ─── callClaude dispatcher ────────────────────────────────────────────────────

export type ApiCapability = 'analyze';

export async function callClaude(
  capability: ApiCapability,
  payload: { imageUrl: string },
): Promise<Analysis> {
  if (!hasApiKey()) {
    throw new Error('No API key configured. Add one in Settings.');
  }

  const client = new Anthropic({
    apiKey: sessionKey,
    dangerouslyAllowBrowser: true,
  });

  if (capability === 'analyze') {
    return analyzePattern(client, payload.imageUrl);
  }

  throw new Error(`Unknown capability: ${capability}`);
}

async function analyzePattern(client: Anthropic, imageUrl: string): Promise<Analysis> {
  const source = resolveImageSource(imageUrl);

  const imageBlock: Anthropic.ImageBlockParam = source.type === 'url'
    ? { type: 'image', source: { type: 'url', url: source.url } }
    : { type: 'image', source: { type: 'base64', media_type: source.media_type, data: source.data } };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          imageBlock,
          { type: 'text', text: 'Analyze this geometric pattern.' },
        ],
      },
    ],
  });

  accumulateCost(response.usage.input_tokens, response.usage.output_tokens);

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Strip markdown code fences if present
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const parsed = JSON.parse(jsonText) as { analysis: Omit<Analysis, 'description' | 'suggestedDifficulty' | 'constructionNotes' | 'promptVersion' | 'analyzedAt'>; description: string; suggestedDifficulty: Analysis['suggestedDifficulty']; constructionNotes: string };

  return {
    ...parsed.analysis,
    description:       parsed.description,
    suggestedDifficulty: parsed.suggestedDifficulty,
    constructionNotes: parsed.constructionNotes,
    promptVersion:     CURRENT_PROMPT_VERSION,
    analyzedAt:        new Date().toISOString(),
  };
}
