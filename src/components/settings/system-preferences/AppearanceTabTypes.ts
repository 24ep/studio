import type {
  DrawerStyle,
  LoginBackgroundType,
  LoginPageLayoutType,
} from './constants';

export interface AppearanceTabProps {
  canEdit: boolean;
  loginBackgroundType: LoginBackgroundType;
  setLoginBackgroundType: (value: LoginBackgroundType) => void;
  loginImagePreviewUrl: string | null;
  removeSelectedLoginImage: (shouldRemoveSaved: boolean) => void;
  handleLoginImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loginBackgroundGradient: string | null;
  setLoginBackgroundGradient: (value: string) => void;
  loginBackgroundColor: string;
  setLoginBackgroundColor: (value: string) => void;
  loginBackgroundTypeMobile: LoginBackgroundType;
  setLoginBackgroundTypeMobile: (value: LoginBackgroundType) => void;
  loginImagePreviewUrlMobile: string | null;
  removeSelectedLoginImageMobile: (shouldRemoveSaved: boolean) => void;
  handleLoginImageFileChangeMobile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loginBackgroundGradientMobile: string | null;
  setLoginBackgroundGradientMobile: (value: string) => void;
  loginBackgroundColorMobile: string;
  setLoginBackgroundColorMobile: (value: string) => void;
  loginLayoutType: LoginPageLayoutType;
  setLoginLayoutType: (value: LoginPageLayoutType) => void;
  drawerStyle: DrawerStyle;
  setDrawerStyle: (value: DrawerStyle) => void;
}
