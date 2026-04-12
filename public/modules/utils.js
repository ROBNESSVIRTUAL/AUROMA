/**
 * Utility Functions Module
 * Complete implementations extracted from editor.js
 */

/**
 * Validates an image file
 */
export function validateImageFile(file) {
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const maxSize = 10 * 1024 * 1024; // 10MB

if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.');
}
if (file.size > maxSize) {
    throw new Error('File too large. Maximum 10MB allowed.');
}

// Check file header (magic bytes)
return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result);
        let header = '';
        for (let i = 0; i < Math.min(4, arr.length); i++) {
            header += arr[i].toString(16).padStart(2, '0');
        }
        
        const validHeaders = ['ffd8ff', '89504e', '47494638', '52494646'];
        if (!validHeaders.some(valid => header.startsWith(valid))) {
            reject(new Error('Invalid file format detected.'));
        } else {
            resolve();
        }
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
});
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
let timeout;
return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
};
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
let lastCall = 0;
return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
        lastCall = now;
        return func.apply(this, args);
    }
};
}

/**
 * RGB to HSL color conversion
 */
export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

/**
 * HSL to RGB color conversion
 */
export function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * HSV to RGB color conversion
 */
export function hsvToRgb(h, s, v) {
h = h % 360;
s = Math.max(0, Math.min(1, s));
v = Math.max(0, Math.min(1, v));
let r, g, b;
const i = Math.floor(h / 60);
const f = h / 60 - i;
const p = v * (1 - s);
const q = v * (1 - f * s);
const t = v * (1 - (1 - f) * s);
switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
}
return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
};
}

/**
 * RGB to Hex color conversion
 */
export function rgbToHex(r, g, b) {
return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Hex to RGB color conversion
 */
export function hexToRgb(hex) {
hex = hex.replace(/^#/, '');
if (hex.length !== 6) return null;
const bigint = parseInt(hex, 16);
return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
};
}

/**
 * RGB to HSV color conversion
 */
export function rgbToHsv(r, g, b) {
r /= 255; g /= 255; b /= 255;
const max = Math.max(r, g, b), min = Math.min(r, g, b);
let h, s, v = max;
const d = max - min;
s = max === 0 ? 0 : d / max;
if (max === min) {
    h = 0;
} else {
    switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
}
return [h * 360, s, v];
}

/**
 * Calculate polygon bounds from points
 */
export function calculatePolygonBounds(points) {
const xMin = Math.min(...points.map(p => p.x));
const xMax = Math.max(...points.map(p => p.x));
const yMin = Math.min(...points.map(p => p.y));
const yMax = Math.max(...points.map(p => p.y));
return { xMin, xMax, yMin, yMax };
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
