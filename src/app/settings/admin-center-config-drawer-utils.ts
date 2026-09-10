export function buildEmbeddedSettingsHref(href: string) {
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const embeddedHref = `${pathAndQuery}${separator}adminCenterEmbed=1`;

  return hash ? `${embeddedHref}#${hash}` : embeddedHref;
}
