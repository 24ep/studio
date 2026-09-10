'use client';

import { useEffect } from 'react';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { preserveTextWhitespace, translateWithConfig } from '@/lib/localization-utils';

const TRANSLATABLE_ATTRIBUTES = [
  'placeholder',
  'title',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-valuetext',
  'alt',
  'label',
  'value',
] as const;

const originalText = new WeakMap<Text, { source: string; translated: string }>();
const originalAttributes = new WeakMap<Element, Map<string, { source: string; translated: string }>>();

function canTranslateAttribute(element: Element, attribute: typeof TRANSLATABLE_ATTRIBUTES[number]) {
  if (attribute === 'value') {
    return element.matches('input[type="button"], input[type="submit"], input[type="reset"]');
  }
  return true;
}

function canTranslateTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || !node.data.trim()) return false;
  if (parent.closest('script, style, noscript, code, pre, textarea, [contenteditable="true"], [data-no-localize]')) return false;
  if (parent.closest('[data-localization-managed]')) return false;
  return true;
}

export function LocalizationRuntime() {
  const { config, locale, isLoading } = useLocalization();
  const { settings } = useGlobalSettings();
  const appName = settings.appName.trim();

  useEffect(() => {
    if (isLoading || !config) return;

    let applying = false;

    const translateElement = (element: Element) => {
      if (element.closest('script, style, noscript, code, pre, textarea, [contenteditable="true"], [data-no-localize], [data-localization-managed]')) return;
      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        if (!canTranslateAttribute(element, attribute)) continue;
        const value = element.getAttribute(attribute);
        if (!value?.trim()) continue;
        const values = originalAttributes.get(element) || new Map<string, { source: string; translated: string }>();
        const cached = values.get(attribute);
        const source = cached && value === cached.translated ? cached.source : value;
        values.set(attribute, { source, translated: source });
        originalAttributes.set(element, values);
        if (appName && source.trim().toLocaleLowerCase() === appName.toLocaleLowerCase()) continue;
        const translated = translateWithConfig(config, locale, source, source);
        values.set(attribute, { source, translated });
        if (translated !== source) element.setAttribute(attribute, translated);
      }
    };

    const translateTextNode = (node: Text) => {
      if (!canTranslateTextNode(node)) return;
      const cached = originalText.get(node);
      const source = cached && node.data === cached.translated ? cached.source : node.data;
      if (appName && source.trim().toLocaleLowerCase() === appName.toLocaleLowerCase()) {
        originalText.set(node, { source, translated: source });
        if (node.data !== source) node.data = source;
        return;
      }
      const translated = translateWithConfig(config, locale, source.trim(), source.trim());
      const rendered = translated !== source.trim() ? preserveTextWhitespace(source, translated) : source;
      originalText.set(node, { source, translated: rendered });
      if (node.data !== rendered) node.data = rendered;
    };

    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let current: Node | null = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) nodes.push(current as Text);
        current = walker.nextNode();
      }
      if (root.nodeType === Node.ELEMENT_NODE) {
        const element = root as Element;
        // Text nodes are walked below, but a child node can carry an
        // accessibility label or placeholder without any text child. Apply
        // the catalog to the entire inserted subtree so labels update on a
        // locale switch as reliably as visible copy.
        translateElement(element);
        element.querySelectorAll('*').forEach(translateElement);
      }
      for (const node of nodes) translateTextNode(node);
    };

    const pendingTrees = new Set<Node>();
    const pendingAttributes = new Set<Element>();
    let scheduledFrame: number | null = null;

    const flush = () => {
      scheduledFrame = null;
      if (applying) return;

      applying = true;
      for (const node of pendingTrees) translateTree(node);
      for (const element of pendingAttributes) translateElement(element);
      pendingTrees.clear();
      pendingAttributes.clear();
      applying = false;
    };

    const scheduleFlush = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = window.requestAnimationFrame(flush);
    };

    pendingTrees.add(document.documentElement);
    scheduleFlush();
    const observer = new MutationObserver(mutations => {
      if (applying) return;
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') pendingTrees.add(mutation.target);
        mutation.addedNodes.forEach(node => pendingTrees.add(node));
        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          pendingAttributes.add(mutation.target as Element);
        }
      }
      scheduleFlush();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATABLE_ATTRIBUTES] });
    return () => {
      observer.disconnect();
      if (scheduledFrame !== null) window.cancelAnimationFrame(scheduledFrame);
    };
  }, [appName, config, isLoading, locale]);

  return null;
}
