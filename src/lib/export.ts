import type { AdResponse, AdVariation } from "./types";
import { PLATFORMS } from "./constants";

function variationToRow(v: AdVariation, platform: string, index: number): Record<string, string> {
  return {
    Platform: platform,
    Variation: String(index + 1),
    Headline: v.headline,
    "Primary Text": v.primaryText,
    Description: v.description || "",
    CTA: v.cta,
    Hook: v.hook || "",
    "Image Prompt": v.imagePrompt || "",
  };
}

export function exportToCSV(response: AdResponse): string {
  const platform = PLATFORMS[response.platform].label;
  const rows = response.variations.map((v, i) => variationToRow(v, platform, i));
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  return csvLines.join("\n");
}

export function exportToJSON(response: AdResponse): string {
  return JSON.stringify(
    {
      platform: response.platform,
      platformName: PLATFORMS[response.platform].label,
      variations: response.variations,
      tips: response.tips,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export function exportAllToClipboard(response: AdResponse): string {
  const platform = PLATFORMS[response.platform];
  const lines: string[] = [
    `=== ${platform.icon} ${platform.label} ===`,
    "",
  ];

  response.variations.forEach((v, i) => {
    lines.push(`--- Variacion ${i + 1} ---`);
    if (v.hook) lines.push(`Hook: ${v.hook}`);
    lines.push(`Headline: ${v.headline}`);
    lines.push(`Primary Text: ${v.primaryText}`);
    if (v.description) lines.push(`Description: ${v.description}`);
    lines.push(`CTA: ${v.cta}`);
    if (v.imagePrompt) lines.push(`Image Prompt: ${v.imagePrompt}`);
    lines.push("");
  });

  if (response.tips.length) {
    lines.push("--- Tips ---");
    response.tips.forEach((tip) => lines.push(`* ${tip}`));
  }

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
