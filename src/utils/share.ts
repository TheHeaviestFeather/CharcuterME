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
function triggerHaptic(pattern: number | number[] = 50): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Error messages with personality - millennial chaos energy
 */
const ERROR_MESSAGES = {
  shareCancelled: 'Share cancelled. The vibes weren\'t right.',
  shareFailed: 'Sharing machine broke. Screenshot it like it\'s 2015?',
  copyFailed: 'Copy failed. Mercury must be in retrograde.',
  saveFailed: 'Save failed. Your phone said no. Try again?',
  noImage: 'No image yet. Patience is a virtue we don\'t have.',
} as const;

const SUCCESS_MESSAGES = {
  shared: 'Shared! Your followers are blessed.',
  copied: 'Copied! Ctrl+V when ready.',
  copiedWithHint: 'Caption copied! Open Instagram and paste away.',
  saved: 'Saved! Check your camera roll.',
  openedTab: 'Opened in new tab. Very old school.',
} as const;

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
      triggerHaptic([50, 30, 50]); // Double tap pattern for success

      return {
        success: true,
        method: 'native',
        message: SUCCESS_MESSAGES.shared,
      };
    } catch (error) {
      // User cancelled the share dialog
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          method: 'native',
          message: ERROR_MESSAGES.shareCancelled,
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
      message: SUCCESS_MESSAGES.copiedWithHint,
    };
  } catch {
    triggerHaptic([100, 50, 100]); // Error pattern
    return {
      success: false,
      method: 'failed',
      message: ERROR_MESSAGES.shareFailed,
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
      message: SUCCESS_MESSAGES.copied,
    };
  } catch {
    triggerHaptic([100, 50, 100]); // Error pattern
    return {
      success: false,
      method: 'failed',
      message: ERROR_MESSAGES.copyFailed,
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

      triggerHaptic([50, 30, 50]); // Success pattern
      return {
        success: true,
        method: 'native',
        message: SUCCESS_MESSAGES.saved,
      };
    } else {
      // For remote URLs, open in new tab (can't force download cross-origin)
      window.open(imageUrl, '_blank');
      return {
        success: true,
        method: 'native',
        message: SUCCESS_MESSAGES.openedTab,
      };
    }
  } catch {
    triggerHaptic([100, 50, 100]); // Error pattern
    return {
      success: false,
      method: 'failed',
      message: ERROR_MESSAGES.saveFailed,
    };
  }
}
