import { CredentialsSignin } from 'next-auth';

export class TwoFactorRequiredError extends CredentialsSignin {
  code = 'TWO_FACTOR_REQUIRED';

  constructor(method: string) {
    super(`TWO_FACTOR_REQUIRED:${method}`);
    this.code = `TWO_FACTOR_REQUIRED:${method}`;
  }
}

export class AccountDisabledError extends CredentialsSignin {
  constructor() {
    super('Your account is disabled');
    this.code = 'ACCOUNT_DISABLED';
  }
}

export class AccountLockedError extends CredentialsSignin {
  constructor() {
    super('Your account is locked');
    this.code = 'ACCOUNT_LOCKED';
  }
}

export class PasswordSetupRequiredError extends CredentialsSignin {
  constructor() {
    super('Set up your password using the secure link sent to your employee email before signing in.');
    this.code = 'PASSWORD_SETUP_REQUIRED';
  }
}
