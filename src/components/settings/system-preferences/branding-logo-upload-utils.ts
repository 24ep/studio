export type BrandingLogoUploadTileSize = 'large' | 'small';

export interface BrandingLogoUploadTileClasses {
  containerClassName: string;
  emptyIconClassName: string;
  emptyTextClassName: string;
  imageClassName: string;
  previewWrapperClassName: string;
  removeButtonClassName: string;
  removeIconClassName: string;
}

export function getBrandingLogoUploadTileClasses(size: BrandingLogoUploadTileSize): BrandingLogoUploadTileClasses {
  const isLarge = size === 'large';

  return {
    containerClassName: isLarge ? 'h-24 w-36 rounded-[5px]' : 'h-14 w-24 rounded-[4px]',
    emptyIconClassName: `${isLarge ? 'h-8 w-8' : 'h-4 w-4'} mx-auto mb-1 opacity-60`,
    emptyTextClassName: isLarge ? 'text-xs' : 'text-[10px]',
    imageClassName: isLarge
      ? 'max-w-full max-h-full object-contain p-2 transition-transform group-hover:scale-105'
      : 'max-w-full max-h-full object-contain p-1 transition-transform group-hover:scale-105',
    previewWrapperClassName: isLarge
      ? 'relative group w-full h-full flex items-center justify-center'
      : 'relative group',
    removeButtonClassName: `${isLarge ? 'absolute -top-2 -right-2 h-6 w-6' : 'absolute -top-1 -right-1 h-4 w-4'} text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full ${isLarge ? 'bg-background border shadow-sm' : ''}`,
    removeIconClassName: isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5',
  };
}
