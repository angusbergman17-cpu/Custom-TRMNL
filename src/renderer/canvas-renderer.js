const { Jimp } = require('jimp');

/**
 * Canvas Renderer
 * Generates e-ink compatible images from data
 */
class CanvasRenderer {
  constructor(config = {}) {
    this.width = config.width || 800;
    this.height = config.height || 480;
    this.colorDepth = config.colorDepth || 1; // 1-bit (black/white) or 4-bit (grayscale)
    this.fontCache = {};
  }

  /**
   * Create a new blank canvas
   */
  async createCanvas() {
    return new Jimp({ width: this.width, height: this.height, color: 0xFFFFFFFF }); // White background
  }

  /**
   * Draw text on canvas
   */
  async drawText(image, text, x, y, options = {}) {
    const fontSize = options.fontSize || 16;
    const color = options.color || 0x000000FF; // Black
    
    // Load font
    let font;
    if (fontSize <= 16) {
      font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    } else if (fontSize <= 32) {
      font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    } else {
      font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    }

    // Wrap text if maxWidth specified
    if (options.maxWidth) {
      const lines = this.wrapText(text, font, options.maxWidth);
      let currentY = y;
      for (const line of lines) {
        image.print(font, x, currentY, line);
        currentY += fontSize + 4;
      }
    } else {
      image.print(font, x, y, text);
    }

    return image;
  }

  /**
   * Wrap text to fit within maxWidth
   */
  wrapText(text, font, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = Jimp.measureText(font, testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Draw rectangle
   */
  drawRect(image, x, y, width, height, color = 0x000000FF, filled = false) {
    if (filled) {
      for (let i = x; i < x + width; i++) {
        for (let j = y; j < y + height; j++) {
          if (i < this.width && j < this.height) {
            image.setPixelColor(color, i, j);
          }
        }
      }
    } else {
      // Draw outline
      for (let i = x; i < x + width; i++) {
        if (i < this.width) {
          image.setPixelColor(color, i, y);
          image.setPixelColor(color, i, y + height - 1);
        }
      }
      for (let j = y; j < y + height; j++) {
        if (j < this.height) {
          image.setPixelColor(color, x, j);
          image.setPixelColor(color, x + width - 1, j);
        }
      }
    }
    return image;
  }

  /**
   * Draw line
   */
  drawLine(image, x1, y1, x2, y2, color = 0x000000FF) {
    // Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (x1 >= 0 && x1 < this.width && y1 >= 0 && y1 < this.height) {
        image.setPixelColor(color, x1, y1);
      }

      if (x1 === x2 && y1 === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }

    return image;
  }

  /**
   * Convert to grayscale/monochrome for e-ink
   */
  convertForEInk(image) {
    image.greyscale();
    
    if (this.colorDepth === 1) {
      // Convert to pure black and white (1-bit)
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        const gray = image.bitmap.data[idx];
        const bw = gray > 128 ? 255 : 0;
        image.bitmap.data[idx] = bw;
        image.bitmap.data[idx + 1] = bw;
        image.bitmap.data[idx + 2] = bw;
      });
    }

    return image;
  }

  /**
   * Save image to buffer
   */
  async toBuffer(image, format = 'png') {
    return image.getBufferAsync(format === 'bmp' ? Jimp.MIME_BMP : Jimp.MIME_PNG);
  }

  /**
   * Save image to file
   */
  async saveToFile(image, filepath) {
    await image.writeAsync(filepath);
  }
}

module.exports = CanvasRenderer;
