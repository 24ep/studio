type ConsoleColor = keyof typeof colors;

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function log(message: string, color: ConsoleColor = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSuccess(message: string) {
  log(`[ok] ${message}`, "green");
}

export function logWarning(message: string) {
  log(`[warn] ${message}`, "yellow");
}

export function logError(message: string) {
  log(`[error] ${message}`, "red");
}

export function logInfo(message: string) {
  log(`[info] ${message}`, "blue");
}
