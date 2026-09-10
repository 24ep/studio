import React from 'react';
import { cn, containsThaiText } from '@/lib/utils';

type AutoFontElement = React.ElementType;

interface AutoFontProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: AutoFontElement;
  asChild?: boolean;
}

type AutoFontChildProps = {
  className?: string;
  lang?: string;
};

export function AutoFont({ 
  children, 
  className, 
  as: Component = 'span',
  asChild = false,
  ...props 
}: AutoFontProps) {
  const text = typeof children === 'string' ? children : '';
  const isThai = containsThaiText(text);
  
  const fontClass = isThai ? 'font-ibm-plex-sans-thai' : 'font-sans';

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<AutoFontChildProps>;
    return React.cloneElement(child, {
      ...child.props,
      className: cn(fontClass, child.props.className, className),
      lang: isThai ? 'th' : 'en',
    });
  }
  
  return (
    <Component 
      className={cn(fontClass, className)}
      lang={isThai ? 'th' : 'en'}
      {...props}
    >
      {children}
    </Component>
  );
}

// Higher-order component for automatic font application
export function withAutoFont<P extends object>(
  Component: React.ComponentType<P>
) {
  type AutoFontWrappedProps = P & {
    children?: React.ReactNode;
    className?: string;
  };

  const AutoFontComponent = React.forwardRef<unknown, AutoFontWrappedProps>((props, ref) => {
    const { children, className, ...restProps } = props;
    const text = typeof children === 'string' ? children : '';
    const isThai = containsThaiText(text);
    
    const fontClass = isThai ? 'font-ibm-plex-sans-thai' : 'font-sans';
    const componentProps = {
      ...restProps,
      ref,
      className: cn(fontClass, className),
      lang: isThai ? 'th' : 'en',
      children,
    } as P & {
      ref: React.Ref<unknown>;
      className?: string;
      lang?: string;
      children?: React.ReactNode;
    };
    
    return <Component {...componentProps} />;
  });
  
  AutoFontComponent.displayName = `withAutoFont(${Component.displayName || Component.name || 'Component'})`;
  
  return AutoFontComponent;
}

// Hook for dynamic font application
export function useAutoFont(text: string) {
  const isThai = containsThaiText(text);
  
  return {
    fontClass: isThai ? 'font-ibm-plex-sans-thai' : 'font-sans',
    lang: isThai ? 'th' : 'en',
    isThai,
  };
} 
