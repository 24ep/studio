import {
  getNetworkErrorStatus,
  getNetworkErrorText,
} from './network-error-extractors';

type NetworkMessageRule = {
  includes: string[];
  message: string;
};

const API_RESPONSE_ERROR_MESSAGES = new Map<number, string>([
  [401, 'Authentication required. Please refresh the page and try again.'],
  [403, 'No permission'],
  [404, 'Resource not found. The requested item may have been deleted or moved.'],
  [500, 'Server error. Please try again or contact support if the problem persists.'],
]);

const USER_FRIENDLY_NETWORK_MESSAGE_RULES: NetworkMessageRule[] = [
  {
    includes: ['fetch failed', 'network'],
    message: 'Network connection failed. Please check your internet connection and try again.',
  },
  {
    includes: ['timeout', 'ETIMEDOUT'],
    message: 'Request timed out. The server took too long to respond. Please try again.',
  },
  {
    includes: ['ECONNRESET'],
    message: 'Connection was reset. Please try again.',
  },
  {
    includes: ['ENOTFOUND'],
    message: 'Server not found. Please check your connection and try again.',
  },
  {
    includes: ['ECONNREFUSED'],
    message: 'Connection refused. The server may be down or unreachable.',
  },
  {
    includes: ['deadlock'],
    message: 'Database conflict. Please try again in a moment.',
  },
  {
    includes: ['connection pool'],
    message: 'Database connection issue. Please try again.',
  },
];

function getMatchingUserFriendlyMessage(errorMessage: string) {
  return USER_FRIENDLY_NETWORK_MESSAGE_RULES.find(rule => (
    rule.includes.some(fragment => errorMessage.includes(fragment))
  ))?.message;
}

export function getUserFriendlyNetworkErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorMessage = getNetworkErrorText(error);
  const status = getNetworkErrorStatus(error);
  const messageRule = getMatchingUserFriendlyMessage(errorMessage);

  if (messageRule) {
    return messageRule;
  }

  if (status === 403) {
    return 'Access denied. You do not have permission to perform this action. Please contact your administrator if you believe this is an error.';
  }

  const responseMessage = status === undefined
    ? undefined
    : getApiResponseErrorMessage(status, '');
  if (responseMessage) return responseMessage;

  return errorMessage || 'An unexpected error occurred. Please try again.';
}

export function getApiResponseErrorMessage(status: number, defaultMessage = 'Request failed') {
  const mappedMessage = API_RESPONSE_ERROR_MESSAGES.get(status);
  if (mappedMessage) return mappedMessage;

  if (status >= 500) {
    return 'Server error. Please try again later.';
  }

  return defaultMessage;
}
