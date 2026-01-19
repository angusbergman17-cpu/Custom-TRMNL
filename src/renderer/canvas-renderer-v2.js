const sharp = require('sharp');

/**
 * Canvas Renderer using Sharp
 * Generates e-ink compatible images from data
 */
class CanvasRenderer {
  constructor(config = {}) {
    this.width = config.width || 800;
    this.height = config.height || 480;
    this.colorDepth = config.colorDepth || 1; // 1-bit (black/white) or 4-bit (grayscale)
  }

  /**
   * Create a new blank canvas (white background)
   */
  async createCanvas() {
    return sharp({
      create: {
        width: this.width,
        height: this.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
  }

  /**
   * Create SVG for text and shapes
   */
  createSVG(elements) {
    const svgElements = elements.map(el => {
      if (el.type === 'text') {
        return `<text x="${el.x}" y="${el.y}" font-family="Arial, sans-serif" font-size="${el.fontSize || 16}" fill="${el.fill || '#000'}" ${el.bold ? 'font-weight="bold"' : ''}>${this.escapeXml(el.text)}</text>`;
      } else if (el.type === 'rect') {
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || '#000'}" ${el.stroke ? `stroke="${el.stroke}" stroke-width="${el.strokeWidth || 1}"` : ''} />`;
      } else if (el.type === 'line') {
        return `<line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke || '#000'}" stroke-width="${el.strokeWidth || 1}" />`;
      }
      return '';
    }).join('\n');

    return `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Wrap text to fit within maxWidth
   */
  wrapText(text, maxWidth, fontSize = 16) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    // Rough estimate: each char is ~0.6 * fontSize pixels wide
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word itself is too long, split it
        lines.push(word.substring(0, maxChars));
        currentLine = word.substring(maxChars);
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Render SVG elements to image
   */
  async render(elements) {
    const svg = this.createSVG(elements);
    let image = await sharp(Buffer.from(svg))
      .resize(this.width, this.height)
      .png();

    return image;
  }

  /**
   * Convert to grayscale/monochrome for e-ink
   */
  async convertForEInk(imageBuffer) {
    let image = sharp(imageBuffer).greyscale();
    
    if (this.colorDepth === 1) {
      // Convert to pure black and white (1-bit)
      image = image.threshold(128);
    }

    return image;
  }

  /**
   * Save image to buffer
   */
  async toBuffer(image) {
    if (typeof image.png === 'function') {
      return image.png().toBuffer();
    }
    return image.toBuffer();
  }

  /**
   * Save image to file
   */
  async saveToFile(image, filepath) {
    if (typeof image.png === 'function') {
      await image.png().toFile(filepath);
    } else {
      await image.toFile(filepath);
    }
  }
}

module.exports = CanvasRenderer;
