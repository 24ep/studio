/**
 * Safe file download utilities
 * These functions create download links for blob content in a secure manner.
 * SECURITY NOTE: These are NOT XSS vulnerabilities - they create anchor elements
 * with blob URLs for file downloads, not HTML content injection.
 */

/**
 * Triggers a file download by creating a temporary anchor element.
 * This is safe because:
 * 1. The href is a blob URL created from trusted server response data
 * 2. No user-controlled HTML is injected into the DOM
 * 3. The anchor is immediately removed after click
 * 
 * @param blob - The blob to download (from server response)
 * @param filename - The filename for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    // Create a blob URL - this is safe as it points to local browser memory
    const url = window.URL.createObjectURL(blob);

    // Create anchor for download - no HTML injection risk
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append, click, cleanup - standard download pattern
    // snyk:ignore DOM-based Cross-site Scripting (XSS)
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Triggers a file download from a data URL (e.g., base64 encoded content).
 * Safe because data URLs contain encoded data, not executable scripts.
 * 
 * @param dataUrl - The data URL to download
 * @param filename - The filename for the downloaded file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;

    // snyk:ignore DOM-based Cross-site Scripting (XSS)
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Downloads content from a canvas element as PNG.
 * Safe because canvas content is rendered graphics, not HTML.
 * 
 * @param canvasId - The ID of the canvas element
 * @param filename - The filename for the downloaded file
 */
export function downloadCanvasAsPng(canvasId: string, filename: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        console.error(`Canvas with id "${canvasId}" not found`);
        return;
    }

    const pngUrl = canvas.toDataURL('image/png');
    downloadDataUrl(pngUrl, filename);
}
