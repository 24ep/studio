export type LayerType = 'base' | 'overlay' | 'modal' | 'popover' | 'toast';

class ZIndexManager {
  private baseZIndex: number = 0;
  private layerZIndex: Record<LayerType, number> = {
    base: 0,
    overlay: 1000,
    modal: 1100,
    popover: 1200,
    toast: 1300,
  };

  generateId(layer: LayerType): string {
    // Use crypto for secure random ID generation
    const randomBytes = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(36).slice(2, 8); // Fallback for non-browser environments
    return `${layer}-${randomBytes}`;
  }

  registerLayer(id: string, layer: LayerType, _parentId?: string): number {
    // Simple strategy: return configured z-index for layer
    return this.get(layer);
  }

  unregisterLayer(_id: string): void {
    // No-op for now
  }

  get(layer: LayerType): number {
    return this.layerZIndex[layer] ?? this.baseZIndex;
  }
}

export const zIndexManager = new ZIndexManager();

