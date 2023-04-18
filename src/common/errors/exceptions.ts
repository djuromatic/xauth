import { errors } from "oidc-provider";
export class InteractionException extends errors.CustomOIDCProviderError {
  constructor(description: string, message: string, status: number) {
    super(message, description);

    // this.allow_redirect = true;
  }
}

export class BadRequestException extends InteractionException {
  constructor(message: string) {
    super(message, "bad_request", 400);
  }
}

export class UnauthorizedException extends InteractionException {
  constructor(message: string) {
    super(message, "unauthorized", 401);
  }
}
