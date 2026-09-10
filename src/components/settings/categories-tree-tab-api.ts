import { getJsonErrorMessage, readJsonObject } from "../../lib/response-json";

export async function readCategoryTreeErrorMessage(
  response: Response,
  fallback: string,
) {
  return getJsonErrorMessage(await readJsonObject(response), fallback);
}

export function getLowerCategoryTreeTitle(title: string) {
  return title.toLowerCase();
}
