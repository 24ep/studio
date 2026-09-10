export interface OpenApiTag {
  name: string;
  description?: string;
}

export interface OpenApiOperation {
  tags?: string[];
  [key: string]: unknown;
}

export type OpenApiPathItem = Record<string, OpenApiOperation>;
export type OpenApiPaths = Record<string, OpenApiPathItem>;

export interface OpenApiSpec {
  tags?: OpenApiTag[];
  paths?: OpenApiPaths;
  [key: string]: unknown;
}

export interface SwaggerSpecState {
  servers: unknown;
  spec: OpenApiSpec;
}

export function getAvailableOpenApiTags(spec: OpenApiSpec): OpenApiTag[] {
  return Array.isArray(spec.tags)
    ? spec.tags.filter((tag) => typeof tag.name === 'string')
    : [];
}

export function filterOpenApiSpecByTag(
  specState: SwaggerSpecState | null,
  selectedTag: string
): OpenApiSpec | undefined {
  if (!specState || selectedTag === 'all') {
    return specState?.spec;
  }

  const filteredPaths = Object.entries(specState.spec.paths ?? {}).reduce<OpenApiPaths>(
    (paths, [path, pathMethods]) => {
      const filteredMethods = Object.entries(pathMethods).reduce<OpenApiPathItem>(
        (methods, [method, operation]) => {
          if (operation.tags?.includes(selectedTag)) {
            methods[method] = operation;
          }
          return methods;
        },
        {}
      );

      if (Object.keys(filteredMethods).length > 0) {
        paths[path] = filteredMethods;
      }

      return paths;
    },
    {}
  );

  return {
    ...specState.spec,
    paths: filteredPaths,
  };
}
