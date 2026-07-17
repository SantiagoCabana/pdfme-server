import type { Font } from '@pdfme/common';

import lora400Url from '@fontsource/lora/files/lora-latin-400-normal.woff2?url';
import lora500Url from '@fontsource/lora/files/lora-latin-500-normal.woff2?url';
import lora600Url from '@fontsource/lora/files/lora-latin-600-normal.woff2?url';
import lora700Url from '@fontsource/lora/files/lora-latin-700-normal.woff2?url';
import montserrat300Url from '@fontsource/montserrat/files/montserrat-latin-300-normal.woff2?url';
import montserrat400Url from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff2?url';
import montserrat500Url from '@fontsource/montserrat/files/montserrat-latin-500-normal.woff2?url';
import montserrat600Url from '@fontsource/montserrat/files/montserrat-latin-600-normal.woff2?url';
import montserrat700Url from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2?url';
import montserrat800Url from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2?url';
import montserrat900Url from '@fontsource/montserrat/files/montserrat-latin-900-normal.woff2?url';
import oswald300Url from '@fontsource/oswald/files/oswald-latin-300-normal.woff2?url';
import oswald400Url from '@fontsource/oswald/files/oswald-latin-400-normal.woff2?url';
import oswald500Url from '@fontsource/oswald/files/oswald-latin-500-normal.woff2?url';
import oswald600Url from '@fontsource/oswald/files/oswald-latin-600-normal.woff2?url';
import oswald700Url from '@fontsource/oswald/files/oswald-latin-700-normal.woff2?url';
import playfairDisplay400Url from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url';
import playfairDisplay500Url from '@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2?url';
import playfairDisplay600Url from '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2?url';
import playfairDisplay700Url from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url';
import playfairDisplay800Url from '@fontsource/playfair-display/files/playfair-display-latin-800-normal.woff2?url';
import playfairDisplay900Url from '@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff2?url';
import poppins300Url from '@fontsource/poppins/files/poppins-latin-300-normal.woff2?url';
import poppins400Url from '@fontsource/poppins/files/poppins-latin-400-normal.woff2?url';
import poppins500Url from '@fontsource/poppins/files/poppins-latin-500-normal.woff2?url';
import poppins600Url from '@fontsource/poppins/files/poppins-latin-600-normal.woff2?url';
import poppins700Url from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url';
import poppins800Url from '@fontsource/poppins/files/poppins-latin-800-normal.woff2?url';
import poppins900Url from '@fontsource/poppins/files/poppins-latin-900-normal.woff2?url';
import robotoMono300Url from '@fontsource/roboto-mono/files/roboto-mono-latin-300-normal.woff2?url';
import robotoMono400Url from '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2?url';
import robotoMono500Url from '@fontsource/roboto-mono/files/roboto-mono-latin-500-normal.woff2?url';
import robotoMono600Url from '@fontsource/roboto-mono/files/roboto-mono-latin-600-normal.woff2?url';
import robotoMono700Url from '@fontsource/roboto-mono/files/roboto-mono-latin-700-normal.woff2?url';

let cachedPdfmeFonts: Promise<Font> | null = null;

const fontSources = [
  ['Poppins 300', poppins300Url],
  ['Poppins 400', poppins400Url],
  ['Poppins 500', poppins500Url],
  ['Poppins 600', poppins600Url],
  ['Poppins 700', poppins700Url],
  ['Poppins 800', poppins800Url],
  ['Poppins 900', poppins900Url],
  ['Montserrat 300', montserrat300Url],
  ['Montserrat 400', montserrat400Url],
  ['Montserrat 500', montserrat500Url],
  ['Montserrat 600', montserrat600Url],
  ['Montserrat 700', montserrat700Url],
  ['Montserrat 800', montserrat800Url],
  ['Montserrat 900', montserrat900Url],
  ['Lora 400', lora400Url],
  ['Lora 500', lora500Url],
  ['Lora 600', lora600Url],
  ['Lora 700', lora700Url],
  ['Playfair Display 400', playfairDisplay400Url],
  ['Playfair Display 500', playfairDisplay500Url],
  ['Playfair Display 600', playfairDisplay600Url],
  ['Playfair Display 700', playfairDisplay700Url],
  ['Playfair Display 800', playfairDisplay800Url],
  ['Playfair Display 900', playfairDisplay900Url],
  ['Roboto Mono 300', robotoMono300Url],
  ['Roboto Mono 400', robotoMono400Url],
  ['Roboto Mono 500', robotoMono500Url],
  ['Roboto Mono 600', robotoMono600Url],
  ['Roboto Mono 700', robotoMono700Url],
  ['Oswald 300', oswald300Url],
  ['Oswald 400', oswald400Url],
  ['Oswald 500', oswald500Url],
  ['Oswald 600', oswald600Url],
  ['Oswald 700', oswald700Url],
] as const;

async function loadFontData(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar la fuente pdfme: ${url}`);
  }

  return response.arrayBuffer();
}

export function loadPdfmeFonts() {
  cachedPdfmeFonts ??= Promise.all(fontSources.map(([, url]) => loadFontData(url))).then((fontData) => {
    const font = fontSources.reduce<Font>((accumulator, [name], index) => {
      accumulator[name] = { data: fontData[index], fallback: name === 'Poppins 400' };
      return accumulator;
    }, {});

    return {
      ...font,
      Poppins: { data: fontData[1] },
      Montserrat: { data: fontData[8] },
      Lora: { data: fontData[14] },
      'Playfair Display': { data: fontData[18] },
      'Roboto Mono': { data: fontData[25] },
      Oswald: { data: fontData[30] },
    };
  });

  return cachedPdfmeFonts;
}
