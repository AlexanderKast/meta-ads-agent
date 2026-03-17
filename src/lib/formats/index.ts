import type { Platform } from "@/lib/types";

export interface FormatSpecs {
  dimensions?: string;
  maxChars?: Record<string, number>;
  duration?: string;
}

export interface AdFormat {
  id: string;
  platform: Platform;
  name: string;
  specs: FormatSpecs;
  promptModifier: string;
}

const META_FORMATS: AdFormat[] = [
  { id: "meta-feed", platform: "meta", name: "Feed", specs: { dimensions: "1080x1080 o 1080x1350" }, promptModifier: "Optimiza para el feed de Facebook/Instagram. Formato cuadrado o vertical." },
  { id: "meta-stories", platform: "meta", name: "Stories/Reels", specs: { dimensions: "1080x1920", duration: "15-30s" }, promptModifier: "Copy para Stories/Reels verticales. Breve, impactante, con gancho inmediato." },
  { id: "meta-carousel", platform: "meta", name: "Carousel", specs: { dimensions: "1080x1080" }, promptModifier: "Copy para carousel de 3-5 slides. Cada headline es un slide. Narrativa secuencial." },
];

const TIKTOK_FORMATS: AdFormat[] = [
  { id: "tiktok-infeed", platform: "tiktok", name: "In-Feed", specs: { dimensions: "1080x1920", duration: "15-60s" }, promptModifier: "Anuncio In-Feed nativo. Debe parecer contenido organico." },
  { id: "tiktok-spark", platform: "tiktok", name: "Spark Ads", specs: { duration: "15-60s" }, promptModifier: "Spark Ad (boosted organic). Tono 100% creator, como si fuera un video personal." },
  { id: "tiktok-topview", platform: "tiktok", name: "TopView", specs: { dimensions: "1080x1920", duration: "5-60s" }, promptModifier: "TopView ad - primer anuncio al abrir la app. Maximo impacto en 3 segundos." },
];

const GOOGLE_FORMATS: AdFormat[] = [
  { id: "google-search", platform: "google", name: "Search (RSA)", specs: { maxChars: { headline: 30, description: 90 } }, promptModifier: "Responsive Search Ad. 3 headlines de 30 chars y 2 descriptions de 90 chars." },
  { id: "google-pmax", platform: "google", name: "Performance Max", specs: {}, promptModifier: "Performance Max. Genera headlines cortos y largos, descriptions, y CTAs para multiples formatos." },
  { id: "google-display", platform: "google", name: "Display", specs: { dimensions: "300x250, 728x90, 160x600" }, promptModifier: "Display ad. Copy muy corto y directo. Headline + CTA prominente." },
];

const YOUTUBE_FORMATS: AdFormat[] = [
  { id: "youtube-preroll", platform: "youtube", name: "Pre-roll (Skippable)", specs: { duration: "15-30s" }, promptModifier: "Pre-roll skippable. Los primeros 5 segundos son criticos. Guion de 15-30 segundos." },
  { id: "youtube-bumper", platform: "youtube", name: "Bumper (6s)", specs: { duration: "6s" }, promptModifier: "Bumper ad de 6 segundos. Un solo mensaje, maximo impacto, sin skip." },
  { id: "youtube-shorts", platform: "youtube", name: "Shorts", specs: { dimensions: "1080x1920", duration: "15-60s" }, promptModifier: "YouTube Shorts ad. Vertical, estilo UGC, como TikTok." },
];

const LINKEDIN_FORMATS: AdFormat[] = [
  { id: "linkedin-sponsored", platform: "linkedin", name: "Sponsored Content", specs: { maxChars: { headline: 70, introText: 150 } }, promptModifier: "Sponsored Content para feed de LinkedIn. Tono profesional pero no aburrido." },
  { id: "linkedin-inmail", platform: "linkedin", name: "InMail", specs: { maxChars: { subject: 60, body: 1500 } }, promptModifier: "Message/InMail ad. Personal, directo, como un mensaje real. Subject + body." },
];

const PINTEREST_FORMATS: AdFormat[] = [
  { id: "pinterest-pin", platform: "pinterest", name: "Standard Pin", specs: { dimensions: "1000x1500" }, promptModifier: "Standard Pin ad. Aspiracional, con keywords naturales para busqueda." },
  { id: "pinterest-idea", platform: "pinterest", name: "Idea Pin", specs: { dimensions: "1080x1920" }, promptModifier: "Idea Pin (multi-pagina). Tutorial o paso-a-paso. Copy overlay corto por pagina." },
];

const TWITTER_FORMATS: AdFormat[] = [
  { id: "twitter-promoted", platform: "twitter", name: "Promoted Tweet", specs: { maxChars: { text: 280 } }, promptModifier: "Promoted Tweet. Maximo 280 chars. Debe parecer un tweet organico." },
  { id: "twitter-card", platform: "twitter", name: "Website Card", specs: { maxChars: { headline: 70, description: 200 } }, promptModifier: "Website Card ad. Tweet + card con headline y descripcion." },
];

const MICROSOFT_FORMATS: AdFormat[] = [
  { id: "microsoft-search", platform: "microsoft", name: "Search", specs: { maxChars: { headline: 30, description: 90 } }, promptModifier: "Bing Search ad. Similar a Google pero para audiencia Bing (35+, mayor poder adquisitivo)." },
  { id: "microsoft-audience", platform: "microsoft", name: "Audience Network", specs: { maxChars: { headline: 40, description: 90 } }, promptModifier: "Microsoft Audience Network. Aparece en MSN, Outlook, LinkedIn." },
];

const ALL_FORMATS: AdFormat[] = [
  ...META_FORMATS, ...TIKTOK_FORMATS, ...GOOGLE_FORMATS, ...YOUTUBE_FORMATS,
  ...LINKEDIN_FORMATS, ...PINTEREST_FORMATS, ...TWITTER_FORMATS, ...MICROSOFT_FORMATS,
];

export function getFormatsForPlatform(platform: Platform): AdFormat[] {
  return ALL_FORMATS.filter((f) => f.platform === platform);
}

export function getFormat(id: string): AdFormat | undefined {
  return ALL_FORMATS.find((f) => f.id === id);
}
