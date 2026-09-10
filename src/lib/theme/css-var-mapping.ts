import { buttonTextCssVarMapping, primaryButtonShadowMapping } from "./button-css-var-mapping";
import { darkSidebarCssVarMapping } from "./sidebar-css-var-mapping-dark";
import { lightSidebarCssVarMapping } from "./sidebar-css-var-mapping-light";

export const cssVarMapping: Record<string, string> = {
  ...lightSidebarCssVarMapping,
  ...darkSidebarCssVarMapping,
  ...buttonTextCssVarMapping,
};

export { primaryButtonShadowMapping };
