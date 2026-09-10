/**
 * Higher-Order Component for Dynamic Z-Index Management
 * 
 * This HOC provides a layerId prop to components that need dynamic z-index management.
 */

import React from 'react';
import { zIndexManager, LayerType } from '@/lib/z-index-manager';

export interface WithDynamicZIndexProps {
  layerId?: string;
  layerType?: LayerType;
  parentLayerId?: string;
}

export function withDynamicZIndex<P extends object>(
  Component: React.ComponentType<P>,
  defaultLayerType: LayerType = 'modal'
) {
  const WrappedComponent = React.forwardRef<
    unknown,
    P & WithDynamicZIndexProps
  >((props, ref) => {
    const { layerId, layerType = defaultLayerType, parentLayerId, ...restProps } = props;
    
    // Generate a layer ID if not provided
    const generatedLayerId = React.useMemo(() => {
      return layerId || zIndexManager.generateId(layerType);
    }, [layerId, layerType]);
    
    // Register the layer and get its z-index
    const zIndex = React.useMemo(() => {
      return zIndexManager.registerLayer(generatedLayerId, layerType, parentLayerId);
    }, [generatedLayerId, layerType, parentLayerId]);
    
    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        zIndexManager.unregisterLayer(generatedLayerId);
      };
    }, [generatedLayerId]);
    
    return (
      <Component
        {...(restProps as P)}
        ref={ref}
        layerId={generatedLayerId}
        zIndex={zIndex}
      />
    );
  });
  
  WrappedComponent.displayName = `withDynamicZIndex(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for components that need to manage their own z-index
export function useDynamicZIndex(
  layerType: LayerType = 'modal',
  parentLayerId?: string
) {
  const [layerId, setLayerId] = React.useState<string | null>(null);
  const [zIndex, setZIndex] = React.useState<number>(0);
  
  React.useEffect(() => {
    const id = zIndexManager.generateId(layerType);
    const zIndexValue = zIndexManager.registerLayer(id, layerType, parentLayerId);
    setLayerId(id);
    setZIndex(zIndexValue);
    
    return () => {
      zIndexManager.unregisterLayer(id);
    };
  }, [layerType, parentLayerId]);
  
  return { layerId, zIndex };
}

// Context for passing layer information down the component tree
export const LayerContext = React.createContext<{
  layerId?: string;
  zIndex?: number;
}>({});

export const LayerProvider: React.FC<{
  children: React.ReactNode;
  layerId?: string;
  zIndex?: number;
}> = ({ children, layerId, zIndex }) => {
  return (
    <LayerContext.Provider value={{ layerId, zIndex }}>
      {children}
    </LayerContext.Provider>
  );
};

export const useLayerContext = () => {
  return React.useContext(LayerContext);
};

