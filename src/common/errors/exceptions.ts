import { errors } from 'oidc-provider';

export class InteractionException extends errors.CustomOIDCProviderError {
  constructor(public readonly message: string, public readonly description: string, public readonlystatus: number) {
    super(message, description);
  }
}

export class BadRequestException extends InteractionException {
  constructor(message: string) {
    super(message, 'bad_request', 400);
  }
}

export class UnauthorizedException extends InteractionException {
  constructor(message: string) {
    super(message, 'unauthorized', 401);
  }
}

export class UserNotFoundException extends InteractionException {
  constructor(message: string) {
    super(message, 'user_not_found', 404);
  }
}

export class LoginException extends InteractionException {
  constructor(description: string, message: string, status: number) {
    super(message, description, 200); //TODO: check if correct status
  }
}

export class SignupException extends InteractionException {
  constructor(description: string, message: string, status: number) {
    super(message, description, 200); //TODO: check if correct status
  }
}

export class MetamaskException extends InteractionException {
  constructor(description: string, message: string, status: number) {
    super(message, description, 200); //TODO: check if correct status
  }
}
