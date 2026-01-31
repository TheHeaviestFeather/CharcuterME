/**
 * Client-side image watermarking for CharcuterME
 * Adds branding to saved/shared images
 */

const WATERMARK_TEXT = 'charcuter.me';
const WATERMARK_FONT = '16px system-ui, sans-serif';
const WATERMARK_COLOR = 'rgba(255, 255, 255, 0.85)';
const WATERMARK_SHADOW_COLOR = 'rgba(0, 0, 0, 0.5)';
const WATERMARK_PADDING = 16;

/**
 * Add watermark to an image URL and return a new data URL
 */
export async function addWatermark(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark text style
        ctx.font = WATERMARK_FONT;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Add shadow for visibility on any background
        ctx.shadowColor = WATERMARK_SHADOW_COLOR;
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Draw watermark text
        ctx.fillStyle = WATERMARK_COLOR;
        ctx.fillText(
          WATERMARK_TEXT,
          canvas.width - WATERMARK_PADDING,
          canvas.height - WATERMARK_PADDING
        );

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for watermarking'));
    };

    // Handle data URLs directly, fetch remote URLs
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else {
      // For remote URLs, we need to fetch and convert to data URL first
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            img.src = reader.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    }
  });
}

/**
 * Download a watermarked image
 */
export async function downloadWithWatermark(
  imageUrl: string,
  filename: string
): Promise<void> {
  const watermarkedUrl = await addWatermark(imageUrl);

  const response = await fetch(watermarkedUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create a File object with watermark for sharing
 */
export async function createWatermarkedFile(
  imageUrl: string,
  filename: string = 'charcuterme-story.png'
): Promise<File> {
  const watermarkedUrl = await addWatermark(imageUrl);
  const response = await fetch(watermarkedUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: 'image/png' });
}
