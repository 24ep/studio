export function syncPopoverWrapperZIndex(
  content: HTMLElement | null,
  zIndex: number,
) {
  const wrapper = content?.parentElement?.closest<HTMLElement>(
    '[data-radix-popper-content-wrapper]',
  );

  if (!wrapper) {
    return () => undefined;
  }

  const previousZIndex = wrapper.style.zIndex;
  const nextZIndex = String(zIndex);
  wrapper.style.zIndex = nextZIndex;

  return () => {
    if (wrapper.style.zIndex === nextZIndex) {
      wrapper.style.zIndex = previousZIndex;
    }
  };
}
