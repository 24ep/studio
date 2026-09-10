export function parseHslString(hslString: string): { h: number; s: number; l: number } | null {
    const match = hslString?.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
    if (!match) return null;
    return {
        h: parseFloat(match[1]),
        s: parseFloat(match[2]) / 100,
        l: parseFloat(match[3]) / 100,
    };
}

export function hslToHex(h: number, s: number, l: number): string {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function hexToHslString(hex: string): string {
    let r = 0;
    let g = 0;
    let b = 0;
    let normalizedHex = hex;
    if (normalizedHex.startsWith('#')) normalizedHex = normalizedHex.substring(1);
    if (normalizedHex.length === 3) {
        r = parseInt(normalizedHex[0] + normalizedHex[0], 16);
        g = parseInt(normalizedHex[1] + normalizedHex[1], 16);
        b = parseInt(normalizedHex[2] + normalizedHex[2], 16);
    } else if (normalizedHex.length === 6) {
        r = parseInt(normalizedHex.substring(0, 2), 16);
        g = parseInt(normalizedHex.substring(2, 4), 16);
        b = parseInt(normalizedHex.substring(4, 6), 16);
    } else {
        return '0 0% 0%';
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    const lPercent = Math.round(l * 100);
    return `${h} ${s}% ${lPercent}%`;
}

export function convertHslStringToHex(hslString: string | null | undefined): string {
    if (!hslString) return '#000000';
    const hslObj = parseHslString(hslString);
    if (!hslObj) return '#000000';
    return hslToHex(hslObj.h, hslObj.s, hslObj.l);
}

export function hslGradientToGradientString(startHsl: string, endHsl: string, angle: number = 135): string {
    const startHex = convertHslStringToHex(startHsl);
    const endHex = convertHslStringToHex(endHsl);
    return `linear-gradient(${angle}deg, ${startHex} 0%, ${endHex} 100%)`;
}

export function gradientStringToHslGradient(gradientString: string): { start: string; end: string } | null {
    const match = gradientString.match(/linear-gradient\(\d+deg,\s*(.+)\)/);
    if (!match) return null;

    const stopsStr = match[1];
    const colorMatches = stopsStr.matchAll(/(#[0-9A-Fa-f]{6})\s+(\d+)%/g);
    const stops: Array<{ color: string; position: number }> = [];
    for (const match of colorMatches) {
        stops.push({ color: match[1], position: parseInt(match[2]) });
    }

    stops.sort((a, b) => a.position - b.position);
    if (stops.length >= 2) {
        return {
            start: hexToHslString(stops[0].color),
            end: hexToHslString(stops[stops.length - 1].color),
        };
    }

    if (stops.length === 1) {
        return {
            start: hexToHslString(stops[0].color),
            end: hexToHslString(stops[0].color),
        };
    }

    return null;
}
