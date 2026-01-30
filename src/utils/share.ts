/**
 * Unified Share Utilities
 *
 * Centralized sharing functionality for Web Share API with fallbacks.
 * Handles image conversion, clipboard fallback, and error states.
 */

export interface ShareOptions {
  title: string;
  caption: string;
  imageUrl?: string | null;
  fileName?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'failed';
  message?: string;
}

/**
 * Convert an image URL (including data URLs) to a File object
 */
async function imageUrlToFile(
  imageUrl: string,
  fileName: string = 'charcuterme-share.png'
): Promise<File | null> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: 'image/png' });
  } catch {
    return null;
  }
}

/**
 * Check if the browser supports sharing files
 */
function canShareFiles(file: File): boolean {
  return !!(navigator.canShare && navigator.canShare({ files: [file] }));
}

/**
 * Trigger haptic feedback on supported devices
 */
function triggerHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
}

/**
 * Share content using Web Share API with image support
 *
 * Falls back to clipboard copy if native sharing isn't available.
 * Returns a result object indicating success/failure and method used.
 */
export async function shareWithImage(options: ShareOptions): Promise<ShareResult> {
  const { title, caption, imageUrl, fileName } = options;

  // Try native share if available
  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title,
        text: caption,
      };

      // Try to include the image as a file
      if (imageUrl) {
        const file = await imageUrlToFile(imageUrl, fileName);
        if (file && canShareFiles(file)) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);
      triggerHaptic();

      return {
        success: true,
        method: 'native',
        message: 'Shared successfully!',
      };
    } catch (error) {
      // User cancelled the share dialog
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          method: 'native',
          message: 'Share cancelled',
        };
      }
      // Fall through to clipboard fallback
    }
  }

  // Fallback: copy caption to clipboard
  try {
    await navigator.clipboard.writeText(caption);
    triggerHaptic();

    return {
      success: true,
      method: 'clipboard',
      message: 'Caption copied! Open Instagram to share.',
    };
  } catch {
    return {
      success: false,
      method: 'failed',
      message: 'Unable to share. Please try again.',
    };
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(text);
    triggerHaptic();

    return {
      success: true,
      method: 'clipboard',
      message: 'Copied!',
    };
  } catch {
    return {
      success: false,
      method: 'failed',
      message: 'Failed to copy',
    };
  }
}

/**
 * Save image to device (download)
 */
export async function saveImage(
  imageUrl: string,
  fileName: string = 'charcuterme-dinner.png'
): Promise<ShareResult> {
  try {
    if (imageUrl.startsWith('data:')) {
      // For data URLs, create blob and download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerHaptic();
      return {
        success: true,
        method: 'native',
        message: 'Saved!',
      };
    } else {
      // For remote URLs, open in new tab (can't force download cross-origin)
      window.open(imageUrl, '_blank');
      return {
        success: true,
        method: 'native',
        message: 'Opened in new tab',
      };
    }
  } catch {
    return {
      success: false,
      method: 'failed',
      message: 'Failed to save',
    };
  }
}
