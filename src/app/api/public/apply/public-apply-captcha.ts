import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export type PublicApplyCaptcha = {
  question: string;
  token: string;
};

type CaptchaPayload = {
  answer: number;
  expiresAt: number;
};

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

function getCaptchaSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'public-apply-local-secret';
}

function encodePayload(payload: CaptchaPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getCaptchaSecret()).update(encodedPayload).digest('base64url');
}

export function createPublicApplyCaptcha(now = Date.now()): PublicApplyCaptcha {
  const left = randomInt(2, 10);
  const right = randomInt(2, 10);
  const encodedPayload = encodePayload({
    answer: left + right,
    expiresAt: now + CAPTCHA_TTL_MS,
  });

  return {
    question: `${left} + ${right}`,
    token: `${encodedPayload}.${signPayload(encodedPayload)}`,
  };
}

export function verifyPublicApplyCaptcha(token: string | null, answer: string | null, now = Date.now()) {
  if (!token || !answer) return false;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length
    || !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as CaptchaPayload;
    const submittedAnswer = Number.parseInt(answer.trim(), 10);
    return Number.isFinite(submittedAnswer)
      && payload.expiresAt >= now
      && payload.answer === submittedAnswer;
  } catch {
    return false;
  }
}
