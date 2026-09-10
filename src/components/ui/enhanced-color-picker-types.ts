export type ColorMode = 'solid' | 'gradient' | 'texture' | 'image' | 'video';
export type GradientType = 'linear' | 'radial' | 'conic' | 'diamond';

export interface GradientStop {
  color: string;
  position: number;
  opacity?: number;
}

export interface ColorValue {
  mode: ColorMode;
  solid?: string;
  solidOpacity?: number;
  gradient?: {
    stops: GradientStop[];
    type?: GradientType;
    angle?: number;
    position?: { x: number; y: number };
    size?: number;
  };
  texture?: string;
  image?: string;
  video?: string;
}

export type GradientValue = NonNullable<ColorValue['gradient']>;
