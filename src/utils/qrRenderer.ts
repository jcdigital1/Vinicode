import QRCode from 'qrcode';

export function getDynamicRedirectUrl(code: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/q/${code}`;
  }
  return `/q/${code}`;
}

export async function generateQRCodeDataUrl(url: string, size = 300): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export async function generateQRCodeSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export interface DownloadOptions {
  code: string;
  name: string;
  includeName: boolean;
  format: 'png' | 'svg';
}

export async function downloadQRCode({ code, name, includeName, format }: DownloadOptions): Promise<void> {
  const dynamicUrl = getDynamicRedirectUrl(code);
  const cleanFileName = (name || 'vinicode')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 30);

  if (format === 'svg') {
    let svgContent = await generateQRCodeSvg(dynamicUrl);

    if (includeName) {
      // Wrap SVG with extra height and text beneath
      const match = svgContent.match(/viewBox="0 0 (\d+) (\d+)"/);
      if (match) {
        const origW = parseInt(match[1], 10);
        const origH = parseInt(match[2], 10);
        const newH = origH + 35;
        svgContent = svgContent.replace(
          /viewBox="0 0 \d+ \d+"/,
          `viewBox="0 0 ${origW} ${newH}"`
        );
        const textSvg = `
          <rect x="0" y="${origH}" width="${origW}" height="35" fill="#ffffff"/>
          <text x="${origW / 2}" y="${origH + 20}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#111827" text-anchor="middle">${escapeXml(name)}</text>
        </svg>`;
        svgContent = svgContent.replace(/<\/svg>\s*$/, textSvg);
      }
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, `${cleanFileName}_${code}.svg`);
    return;
  }

  // PNG generation with high resolution canvas (1024x1024 base)
  const canvas = document.createElement('canvas');
  const qrSize = 900;
  const padding = 50;
  const bottomExtra = includeName ? 90 : padding;
  
  const canvasWidth = qrSize + padding * 2;
  const canvasHeight = qrSize + padding + bottomExtra;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // White background for optimal QR scanning
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Render QR
  const qrDataUrl = await generateQRCodeDataUrl(dynamicUrl, qrSize);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  ctx.drawImage(img, padding, padding, qrSize, qrSize);

  // Render label if option checked
  if (includeName && name) {
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text centered below QR
    const textY = padding + qrSize + 45;
    ctx.fillText(name, canvasWidth / 2, textY, canvasWidth - 80);
  }

  canvas.toBlob((blob) => {
    if (blob) {
      triggerDownload(blob, `${cleanFileName}_${code}.png`);
    }
  }, 'image/png');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
