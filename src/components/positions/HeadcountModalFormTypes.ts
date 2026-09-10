import type React from 'react';

import type { HeadcountModalSaveData } from './HeadcountModalTypes';

export interface HeadcountFormSectionProps {
  formData: HeadcountModalSaveData;
  loading: boolean;
  setFormData: React.Dispatch<React.SetStateAction<HeadcountModalSaveData>>;
}
