import { describe, expect, it } from 'vitest';
import { getBrandingLogoUploadTileClasses } from './branding-logo-upload-utils';

describe('branding-logo-upload-utils', () => {
  it('builds large upload tile classes', () => {
    const classes = getBrandingLogoUploadTileClasses('large');

    expect(classes.containerClassName).toBe('h-24 w-36 rounded-[5px]');
    expect(classes.emptyIconClassName).toContain('h-8');
    expect(classes.emptyTextClassName).toBe('text-xs');
    expect(classes.imageClassName).toContain('p-2');
    expect(classes.previewWrapperClassName).toContain('w-full h-full');
    expect(classes.removeButtonClassName).toContain('h-6');
    expect(classes.removeButtonClassName).toContain('bg-background');
    expect(classes.removeIconClassName).toBe('h-3 w-3');
  });

  it('builds small upload tile classes', () => {
    const classes = getBrandingLogoUploadTileClasses('small');

    expect(classes.containerClassName).toBe('h-14 w-24 rounded-[4px]');
    expect(classes.emptyIconClassName).toContain('h-4');
    expect(classes.emptyTextClassName).toBe('text-[10px]');
    expect(classes.imageClassName).toContain('p-1');
    expect(classes.previewWrapperClassName).toBe('relative group');
    expect(classes.removeButtonClassName).toContain('h-4');
    expect(classes.removeButtonClassName).not.toContain('bg-background');
    expect(classes.removeIconClassName).toBe('h-2.5 w-2.5');
  });
});
