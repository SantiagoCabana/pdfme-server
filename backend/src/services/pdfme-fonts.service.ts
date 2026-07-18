import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import type { Font } from '@pdfme/common';

const require = createRequire(import.meta.url);

const fontSources = [
  ['Poppins 300', '@fontsource/poppins/files/poppins-latin-300-normal.woff'],
  ['Poppins 400', '@fontsource/poppins/files/poppins-latin-400-normal.woff'],
  ['Poppins 500', '@fontsource/poppins/files/poppins-latin-500-normal.woff'],
  ['Poppins 600', '@fontsource/poppins/files/poppins-latin-600-normal.woff'],
  ['Poppins 700', '@fontsource/poppins/files/poppins-latin-700-normal.woff'],
  ['Poppins 800', '@fontsource/poppins/files/poppins-latin-800-normal.woff'],
  ['Poppins 900', '@fontsource/poppins/files/poppins-latin-900-normal.woff'],
  ['Montserrat 300', '@fontsource/montserrat/files/montserrat-latin-300-normal.woff'],
  ['Montserrat 400', '@fontsource/montserrat/files/montserrat-latin-400-normal.woff'],
  ['Montserrat 500', '@fontsource/montserrat/files/montserrat-latin-500-normal.woff'],
  ['Montserrat 600', '@fontsource/montserrat/files/montserrat-latin-600-normal.woff'],
  ['Montserrat 700', '@fontsource/montserrat/files/montserrat-latin-700-normal.woff'],
  ['Montserrat 800', '@fontsource/montserrat/files/montserrat-latin-800-normal.woff'],
  ['Montserrat 900', '@fontsource/montserrat/files/montserrat-latin-900-normal.woff'],
  ['Lora 400', '@fontsource/lora/files/lora-latin-400-normal.woff'],
  ['Lora 500', '@fontsource/lora/files/lora-latin-500-normal.woff'],
  ['Lora 600', '@fontsource/lora/files/lora-latin-600-normal.woff'],
  ['Lora 700', '@fontsource/lora/files/lora-latin-700-normal.woff'],
  ['Playfair Display 400', '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff'],
  ['Playfair Display 500', '@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff'],
  ['Playfair Display 600', '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff'],
  ['Playfair Display 700', '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff'],
  ['Playfair Display 800', '@fontsource/playfair-display/files/playfair-display-latin-800-normal.woff'],
  ['Playfair Display 900', '@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff'],
  ['Roboto Mono 300', '@fontsource/roboto-mono/files/roboto-mono-latin-300-normal.woff'],
  ['Roboto Mono 400', '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff'],
  ['Roboto Mono 500', '@fontsource/roboto-mono/files/roboto-mono-latin-500-normal.woff'],
  ['Roboto Mono 600', '@fontsource/roboto-mono/files/roboto-mono-latin-600-normal.woff'],
  ['Roboto Mono 700', '@fontsource/roboto-mono/files/roboto-mono-latin-700-normal.woff'],
  ['Oswald 300', '@fontsource/oswald/files/oswald-latin-300-normal.woff'],
  ['Oswald 400', '@fontsource/oswald/files/oswald-latin-400-normal.woff'],
  ['Oswald 500', '@fontsource/oswald/files/oswald-latin-500-normal.woff'],
  ['Oswald 600', '@fontsource/oswald/files/oswald-latin-600-normal.woff'],
  ['Oswald 700', '@fontsource/oswald/files/oswald-latin-700-normal.woff'],
] as const;

let cachedPdfmeFonts: Promise<Font> | null = null;

async function readFontData(packagePath: string) {
  return readFile(require.resolve(packagePath));
}

export function loadPdfmeFonts() {
  cachedPdfmeFonts ??= Promise.all(fontSources.map(([, packagePath]) => readFontData(packagePath))).then((fontData) => {
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
