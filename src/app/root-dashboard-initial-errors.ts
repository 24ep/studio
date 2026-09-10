function getErrorDiagnosticValue(error: unknown, key: string) {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getRootDashboardErrorDiagnostics(error: unknown) {
  return {
    message: getErrorMessage(error),
    code: getErrorDiagnosticValue(error, 'code'),
    detail: getErrorDiagnosticValue(error, 'detail'),
    hint: getErrorDiagnosticValue(error, 'hint'),
    position: getErrorDiagnosticValue(error, 'position'),
    where: getErrorDiagnosticValue(error, 'where'),
  };
}
