import { handleJwtCallback } from './auth-jwt-callback';
import { handleSessionCallback } from './auth-session-callback';
import { handleSignInCallback } from './auth-signin-callback';

export function buildAuthCallbacks() {
  return {
    jwt: handleJwtCallback,
    session: handleSessionCallback,
    signIn: handleSignInCallback,
  };
}
