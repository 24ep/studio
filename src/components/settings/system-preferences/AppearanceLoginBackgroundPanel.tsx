import {
  LoginBackgroundGradientControl,
  LoginBackgroundImageControl,
  LoginBackgroundSolidControl,
  LoginBackgroundTypeSelect,
  LoginLayoutTypeSelect,
} from './AppearanceLoginBackgroundPanelParts';
import {
  LoginBackgroundType,
  LoginPageLayoutType,
} from './constants';

interface AppearanceLoginBackgroundPanelProps {
  canEdit: boolean;
  idSuffix?: string;
  isMobile?: boolean;
  backgroundType: LoginBackgroundType;
  setBackgroundType: (value: LoginBackgroundType) => void;
  imagePreviewUrl: string | null;
  removeSelectedImage: (shouldRemoveSaved: boolean) => void;
  handleImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  backgroundGradient: string | null;
  setBackgroundGradient: (value: string) => void;
  backgroundColor: string;
  setBackgroundColor: (value: string) => void;
  defaultGradient: string;
  loginLayoutType?: LoginPageLayoutType;
  setLoginLayoutType?: (value: LoginPageLayoutType) => void;
}

export function AppearanceLoginBackgroundPanel({
  canEdit,
  idSuffix = '',
  isMobile = false,
  backgroundType,
  setBackgroundType,
  imagePreviewUrl,
  removeSelectedImage,
  handleImageFileChange,
  backgroundGradient,
  setBackgroundGradient,
  backgroundColor,
  setBackgroundColor,
  defaultGradient,
  loginLayoutType,
  setLoginLayoutType,
}: AppearanceLoginBackgroundPanelProps) {
  const suffix = idSuffix ? `-${idSuffix}` : '';
  const uploadId = `login-bg-upload${suffix}`;
  const backgroundTypeId = `background-type${suffix}`;

  return (
    <div className="space-y-6">
      <LoginBackgroundTypeSelect
        id={backgroundTypeId}
        backgroundType={backgroundType}
        canEdit={canEdit}
        isMobile={isMobile}
        onChange={setBackgroundType}
      />

      <LoginLayoutTypeSelect
        canEdit={canEdit}
        isMobile={isMobile}
        loginLayoutType={loginLayoutType}
        onChange={setLoginLayoutType}
      />

      {backgroundType === 'image' && (
        <LoginBackgroundImageControl
          canEdit={canEdit}
          imagePreviewUrl={imagePreviewUrl}
          isMobile={isMobile}
          onImageFileChange={handleImageFileChange}
          onRemoveImage={removeSelectedImage}
          uploadId={uploadId}
        />
      )}

      {backgroundType === 'gradient' && (
        <LoginBackgroundGradientControl
          backgroundGradient={backgroundGradient}
          canEdit={canEdit}
          defaultGradient={defaultGradient}
          isMobile={isMobile}
          onChange={setBackgroundGradient}
        />
      )}

      {backgroundType === 'solid' && (
        <LoginBackgroundSolidControl
          backgroundColor={backgroundColor}
          canEdit={canEdit}
          isMobile={isMobile}
          onChange={setBackgroundColor}
        />
      )}
    </div>
  );
}
