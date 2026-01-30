/**
 * SVG Sanitization Utility
 *
 * Sanitizes SVG strings to prevent XSS attacks by removing
 * potentially dangerous elements and attributes.
 */

// Allowed SVG elements (whitelist approach)
const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clipPath',
  'mask',
  'linearGradient',
  'radialGradient',
  'stop',
  'use',
  'symbol',
  'title',
  'desc',
]);

// Allowed attributes (whitelist approach)
const ALLOWED_ATTRS = new Set([
  // Core attributes
  'id',
  'class',
  'style',
  // Presentation attributes
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'transform',
  'clip-path',
  'mask',
  // Geometry attributes
  'x',
  'y',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x1',
  'y1',
  'x2',
  'y2',
  'width',
  'height',
  'd',
  'points',
  'viewBox',
  'preserveAspectRatio',
  // Text attributes
  'text-anchor',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'dx',
  'dy',
  // Gradient attributes
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  // Link attributes (for use elements)
  'href',
  'xlink:href',
  // Namespace
  'xmlns',
  'xmlns:xlink',
]);

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /data:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<script/gi,
  /<\/script/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
];

/**
 * Sanitize an SVG string to prevent XSS attacks
 *
 * Uses a whitelist approach for tags and attributes,
 * and removes any potentially dangerous patterns.
 */
export function sanitizeSvg(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') {
    return '';
  }

  // Quick check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(svgString)) {
      console.warn('SVG sanitization: dangerous pattern detected, returning empty string');
      return '';
    }
  }

  // Parse the SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.warn('SVG sanitization: parse error, returning empty string');
    return '';
  }

  // Get the SVG element
  const svg = doc.querySelector('svg');
  if (!svg) {
    console.warn('SVG sanitization: no SVG element found, returning empty string');
    return '';
  }

  // Recursively sanitize the tree
  sanitizeNode(svg);

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/**
 * Recursively sanitize a DOM node
 */
function sanitizeNode(node: Element): void {
  // Remove disallowed elements
  const children = Array.from(node.children);
  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      child.remove();
      continue;
    }

    // Remove disallowed attributes
    const attrs = Array.from(child.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();

      if (!ALLOWED_ATTRS.has(attrName)) {
        child.removeAttribute(attr.name);
        continue;
      }

      // Check attribute value for dangerous content
      const value = attr.value.toLowerCase();
      if (
        value.includes('javascript:') ||
        value.includes('data:') ||
        value.includes('vbscript:') ||
        /expression\s*\(/.test(value)
      ) {
        child.removeAttribute(attr.name);
      }
    }

    // Recursively sanitize children
    sanitizeNode(child);
  }
}

/**
 * Check if a string contains valid SVG
 */
export function isValidSvg(svgString: string): boolean {
  if (!svgString || typeof svgString !== 'string') {
    return false;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    return !doc.querySelector('parsererror') && !!doc.querySelector('svg');
  } catch {
    return false;
  }
}
