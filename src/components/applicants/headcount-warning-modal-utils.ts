export interface HeadcountWarningStatus {
  total: number;
  vacant: number;
  filled: number;
}

export function parseHeadcountWarningStatus(errorMessage: string): HeadcountWarningStatus | null {
  const headcountMatch = errorMessage.match(/\(Total: (\d+), Vacant: (\d+), Filled: (\d+)\)/);
  return headcountMatch
    ? {
        total: Number.parseInt(headcountMatch[1], 10),
        vacant: Number.parseInt(headcountMatch[2], 10),
        filled: Number.parseInt(headcountMatch[3], 10),
      }
    : null;
}

export function shouldKeepHeadcountWarningOpen(open: boolean, shouldStayOpen: boolean) {
  return !open && shouldStayOpen;
}
