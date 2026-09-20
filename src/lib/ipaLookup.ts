"use client";

// Common IPA digraphs that must stay together as single phonemes
const DIGRAPHS = ["dʒ","tʃ","aɪ","aʊ","eɪ","ɔɪ","əʊ","ɪə","eə","ʊə","uː","iː","ɑː","ɔː","ɜː"];

/** Split an IPA string like "/ˈmæn.ɪ.dʒər/" into individual phoneme tokens */
export function splitIPA(ipa: string): string[] {
  const cleaned = ipa.replace(/[/\[\]ˈˌ.\s()\-‿ː̃]/g, "");
  const result: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    let matched = false;
    for (const dg of DIGRAPHS) {
      if (cleaned.startsWith(dg, i)) {
        result.push(dg);
        i += dg.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.push(cleaned[i]);
      i++;
    }
  }
  return result.filter(Boolean);
}

// Memory + localStorage cache
const memCache = new Map<string, string | null>();

const CACHE_KEY = (w: string) => `ipa-v3:${w}`;

function getCached(word: string): string | null | undefined {
  if (memCache.has(word)) return memCache.get(word)!;
  try {
    const raw = localStorage.getItem(CACHE_KEY(word));
    if (raw) {
      const { ipa, ts } = JSON.parse(raw) as { ipa: string | null; ts: number };
      if (Date.now() - ts < 30 * 24 * 60 * 60 * 1000) {
        memCache.set(word, ipa);
        return ipa;
      }
    }
  } catch {}
  return undefined;
}

function setCache(word: string, ipa: string | null) {
  memCache.set(word, ipa);
  try { localStorage.setItem(CACHE_KEY(word), JSON.stringify({ ipa, ts: Date.now() })); } catch {}
}

async function fetchWithTimeout(url: string, ms = 4000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(t);
  return res;
}

/** Extract IPA from Wiktionary MediaWiki API response (wikitext) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIPAFromWikitext(json: any): string | null {
  try {
    const pages = json?.query?.pages ?? {};
    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === "-1") return null;

    const wikitext: string = pages[pageId]?.revisions?.[0]?.slots?.main?.["*"] ?? "";
    if (!wikitext) { console.log("[IPA] no wikitext"); return null; }

    const enSection: string = wikitext.match(/==English==([\s\S]*?)(?:\n==[^=]|$)/)?.[1] ?? wikitext;
    console.log("[IPA] enSection first 200:", enSection.substring(0, 200));

    const m = enSection.match(/\{\{IPA\|en\|\/([^/|{}\n]{1,50})\//);
    console.log("[IPA] regex match:", m?.[0], "→ captured:", m?.[1]);
    if (m?.[1]) return `/${m[1].replace(/ɹ/g, "r")}/`;
  } catch (e) { console.error("[IPA] error:", e); }
  return null;
}

export async function fetchWordIPA(word: string): Promise<string | null> {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return null;
  const cached = getCached(clean);
  if (cached !== undefined) return cached;

  // Wiktionary MediaWiki API — returns raw wikitext with IPA
  try {
    const res = await fetchWithTimeout(
      `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(clean)}&prop=revisions&rvprop=content&rvslots=main&format=json&origin=*`,
      4000
    );
    if (res.ok) {
      const ipa = extractIPAFromWikitext(await res.json());
      setCache(clean, ipa);
      return ipa;
    }
  } catch {}

  setCache(clean, null);
  return null;
}
