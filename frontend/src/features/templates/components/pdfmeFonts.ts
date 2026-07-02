import type { Font } from '@pdfme/common';

import loraUrl from '@fontsource/lora/files/lora-latin-400-normal.woff2?url';
import montserratUrl from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff2?url';
import oswaldUrl from '@fontsource/oswald/files/oswald-latin-400-normal.woff2?url';
import playfairDisplayUrl from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url';
import poppinsUrl from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url';
import robotoMonoUrl from '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2?url';

let cachedPdfmeFonts: Promise<Font> | null = null;

async function loadFontData(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar la fuente pdfme: ${url}`);
  }

  return response.arrayBuffer();
}

export function loadPdfmeFonts() {
  cachedPdfmeFonts ??= Promise.all([
    loadFontData(poppinsUrl),
    loadFontData(montserratUrl),
    loadFontData(loraUrl),
    loadFontData(playfairDisplayUrl),
    loadFontData(robotoMonoUrl),
    loadFontData(oswaldUrl),
  ]).then(([poppins, montserrat, lora, playfairDisplay, robotoMono, oswald]) => ({
    Poppins: { data: poppins, fallback: true },
    Montserrat: { data: montserrat },
    Lora: { data: lora },
    'Playfair Display': { data: playfairDisplay },
    'Roboto Mono': { data: robotoMono },
    Oswald: { data: oswald },
  }));

  return cachedPdfmeFonts;
}
