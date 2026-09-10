type Translate = (key: string, fallback?: string) => string;

function resolve(t: Translate, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = t(key, key);
    if (value !== key) return value;
  }
  // Catalogs created before the sidebar keys often index the visible source
  // copy instead. Passing the label as a fallback lets the shared resolver
  // find those entries by their English value.
  return t(keys[0], fallback);
}

/**
 * AppKit catalogs in use predate the sidebar and use both `nav.*` and
 * `navigation.*` namespaces.  Keep the sidebar compatible with either while
 * giving its dedicated keys precedence.
 */
export function localizeSidebarText(
  t: Translate,
  kind: 'group' | 'item' | 'section' | 'description',
  slug: string,
  fallback: string,
) {
  const keys = kind === 'description'
    ? [`sidebar.item.description.${slug}`, `nav.description.${slug}`, `navigation.description.${slug}`]
    : [`sidebar.${kind}.${slug}`, `nav.${kind === 'item' ? '' : `${kind}.`}${slug}`, `navigation.${kind === 'item' ? '' : `${kind}.`}${slug}`];

  return resolve(t, keys, fallback);
}
