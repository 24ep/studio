declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  interface SwaggerUIProps {
    url?: string;
    spec?: any;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    supportedSubmitMethods?: string[];
    domNode?: HTMLElement;
    onComplete?: (system: any) => void;
    onFailure?: (error: any) => void;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    showMutatedRequest?: boolean;
    showRequestHeaders?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tryItOutEnabled?: boolean;
    requestSnippetsEnabled?: boolean;
    requestSnippets?: {
      generators?: any;
      defaultExpanded?: boolean;
      languagesFilter?: string;
    };
    deepLinking?: boolean;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    filter?: string | boolean;
    layout?: string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    validatorUrl?: string | null;
    withCredentials?: boolean;
    oauth2RedirectUrl?: string;
    useUnsafeMarkdown?: boolean;
    presets?: any[];
    plugins?: any[];
    layout?: string;
    deepLinking?: boolean;
    persistAuthorization?: boolean;
    queryConfigEnabled?: boolean;
    tryItOutEnabled?: boolean;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    onComplete?: (system: any) => void;
    onFailure?: (error: any) => void;
    onSystem?: (system: any) => void;
    onConfig?: (config: any) => void;
    onSpec?: (spec: any) => void;
    onUrl?: (url: any) => void;
    onError?: (error: any) => void;
    onLoad?: (system: any) => void;
    onReady?: (system: any) => void;
    onUpdate?: (system: any) => void;
    onUnmount?: () => void;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
} 