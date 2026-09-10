import { useMemo, useState } from "react";

import {
  DEFAULT_EVALUATE_HEADER_BACKGROUND_COLOR,
  DEFAULT_EVALUATE_HEADER_BACKGROUND_TYPE,
  DEFAULT_EVALUATE_HEADER_TEXT_COLOR,
  DEFAULT_HEADER_BACKGROUND_COLOR,
  DEFAULT_HEADER_BACKGROUND_TYPE,
  DEFAULT_HEADER_TEXT_COLOR,
  DEFAULT_LOGIN_BACKGROUND_COLOR,
  DEFAULT_LOGIN_BACKGROUND_TYPE,
  DEFAULT_LOGIN_BACKGROUND_TYPE_MOBILE,
  type EvaluateHeaderBackgroundType,
  type HeaderBackgroundType,
  type LoginBackgroundType,
  type LoginPageLayoutType,
} from "@/components/settings/system-preferences/constants";

export function useSystemPreferenceAppearanceState() {
  const [loginBackgroundType, setLoginBackgroundType] = useState<LoginBackgroundType>(DEFAULT_LOGIN_BACKGROUND_TYPE);
  const [selectedLoginImageFile, setSelectedLoginImageFile] = useState<File | null>(null);
  const [loginImagePreviewUrl, setLoginImagePreviewUrl] = useState<string | null>(null);
  const [savedLoginImageDataUrl, setSavedLoginImageDataUrl] = useState<string | null>(null);
  const [loginBackgroundGradient, setLoginBackgroundGradient] = useState<string | null>(null);
  const [loginBackgroundColor, setLoginBackgroundColor] = useState<string>(DEFAULT_LOGIN_BACKGROUND_COLOR);

  const [loginBackgroundTypeMobile, setLoginBackgroundTypeMobile] = useState<LoginBackgroundType>(DEFAULT_LOGIN_BACKGROUND_TYPE_MOBILE);
  const [selectedLoginImageFileMobile, setSelectedLoginImageFileMobile] = useState<File | null>(null);
  const [loginImagePreviewUrlMobile, setLoginImagePreviewUrlMobile] = useState<string | null>(null);
  const [savedLoginImageDataUrlMobile, setSavedLoginImageDataUrlMobile] = useState<string | null>(null);
  const [loginBackgroundGradientMobile, setLoginBackgroundGradientMobile] = useState<string | null>(null);
  const [loginBackgroundColorMobile, setLoginBackgroundColorMobile] = useState<string>(DEFAULT_LOGIN_BACKGROUND_COLOR);
  const [loginLayoutType, setLoginLayoutType] = useState<LoginPageLayoutType>("center");

  const [evaluateHeaderBackgroundType, setEvaluateHeaderBackgroundType] = useState<EvaluateHeaderBackgroundType>(DEFAULT_EVALUATE_HEADER_BACKGROUND_TYPE);
  const [selectedEvaluateHeaderImageFile, setSelectedEvaluateHeaderImageFile] = useState<File | null>(null);
  const [evaluateHeaderImagePreviewUrl, setEvaluateHeaderImagePreviewUrl] = useState<string | null>(null);
  const [savedEvaluateHeaderImageDataUrl, setSavedEvaluateHeaderImageDataUrl] = useState<string | null>(null);
  const [evaluateHeaderBackgroundGradient, setEvaluateHeaderBackgroundGradient] = useState<string | null>(null);
  const [evaluateHeaderBackgroundColor, setEvaluateHeaderBackgroundColor] = useState<string>(DEFAULT_EVALUATE_HEADER_BACKGROUND_COLOR);
  const [evaluateHeaderTextColor, setEvaluateHeaderTextColor] = useState<string>(DEFAULT_EVALUATE_HEADER_TEXT_COLOR);

  const [headerBackgroundType, setHeaderBackgroundType] = useState<HeaderBackgroundType>(DEFAULT_HEADER_BACKGROUND_TYPE);
  const [selectedHeaderImageFile, setSelectedHeaderImageFile] = useState<File | null>(null);
  const [headerImagePreviewUrl, setHeaderImagePreviewUrl] = useState<string | null>(null);
  const [savedHeaderImageDataUrl, setSavedHeaderImageDataUrl] = useState<string | null>(null);
  const [headerBackgroundGradient, setHeaderBackgroundGradient] = useState<string | null>(null);
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState<string>(DEFAULT_HEADER_BACKGROUND_COLOR);
  const [headerTextColor, setHeaderTextColor] = useState<string>(DEFAULT_HEADER_TEXT_COLOR);
  const loadedPreferenceStateSetters = useMemo(() => ({
    setLoginBackgroundType,
    setSavedLoginImageDataUrl,
    setLoginImagePreviewUrl,
    setLoginBackgroundGradient,
    setLoginBackgroundColor,
    setLoginLayoutType,
    setLoginBackgroundTypeMobile,
    setSavedLoginImageDataUrlMobile,
    setLoginImagePreviewUrlMobile,
    setLoginBackgroundGradientMobile,
    setLoginBackgroundColorMobile,
    setEvaluateHeaderBackgroundType,
    setSavedEvaluateHeaderImageDataUrl,
    setEvaluateHeaderImagePreviewUrl,
    setEvaluateHeaderBackgroundGradient,
    setEvaluateHeaderBackgroundColor,
    setEvaluateHeaderTextColor,
    setHeaderBackgroundType,
    setSavedHeaderImageDataUrl,
    setHeaderImagePreviewUrl,
    setHeaderBackgroundGradient,
    setHeaderBackgroundColor,
    setHeaderTextColor,
  }), []);

  return {
    loginBackgroundType,
    setLoginBackgroundType,
    selectedLoginImageFile,
    setSelectedLoginImageFile,
    loginImagePreviewUrl,
    setLoginImagePreviewUrl,
    savedLoginImageDataUrl,
    setSavedLoginImageDataUrl,
    loginBackgroundGradient,
    setLoginBackgroundGradient,
    loginBackgroundColor,
    setLoginBackgroundColor,
    loginBackgroundTypeMobile,
    setLoginBackgroundTypeMobile,
    selectedLoginImageFileMobile,
    setSelectedLoginImageFileMobile,
    loginImagePreviewUrlMobile,
    setLoginImagePreviewUrlMobile,
    savedLoginImageDataUrlMobile,
    setSavedLoginImageDataUrlMobile,
    loginBackgroundGradientMobile,
    setLoginBackgroundGradientMobile,
    loginBackgroundColorMobile,
    setLoginBackgroundColorMobile,
    loginLayoutType,
    setLoginLayoutType,
    evaluateHeaderBackgroundType,
    setEvaluateHeaderBackgroundType,
    selectedEvaluateHeaderImageFile,
    setSelectedEvaluateHeaderImageFile,
    evaluateHeaderImagePreviewUrl,
    setEvaluateHeaderImagePreviewUrl,
    savedEvaluateHeaderImageDataUrl,
    setSavedEvaluateHeaderImageDataUrl,
    evaluateHeaderBackgroundGradient,
    setEvaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor,
    setEvaluateHeaderBackgroundColor,
    evaluateHeaderTextColor,
    setEvaluateHeaderTextColor,
    headerBackgroundType,
    setHeaderBackgroundType,
    selectedHeaderImageFile,
    setSelectedHeaderImageFile,
    headerImagePreviewUrl,
    setHeaderImagePreviewUrl,
    savedHeaderImageDataUrl,
    setSavedHeaderImageDataUrl,
    headerBackgroundGradient,
    setHeaderBackgroundGradient,
    headerBackgroundColor,
    setHeaderBackgroundColor,
    headerTextColor,
    setHeaderTextColor,
    loadedPreferenceStateSetters,
  };
}
