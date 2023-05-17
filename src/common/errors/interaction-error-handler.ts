import { NextFunction, Response, Request, Express } from 'express';
import Provider, { errors } from 'oidc-provider';
import {
  BadRequestException,
  InteractionException,
  LoginException,
  MetamaskException,
  ProfileUpdateException,
  SignupException
} from './exceptions.js';
import { debug } from '../../helpers/debug.js';
import { Logger } from '../../utils/winston.js';

const logger = new Logger('Interaction Error Handler');

export const interactionErrorHandler = async (app: Express, provider: Provider) => {
  const errorHandler = async (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof errors.SessionNotFound) {
      return res.redirect('/login');
    }

    if (err instanceof SignupException || err instanceof MetamaskException) {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);
      const client = await provider.Client.find(params.client_id as any);

      const { message } = err;
      return res.render('signup', {
        client,
        uid,
        serverData: message,
        details: prompt.details,
        params,
        title: 'Sign-Up',
        session: session ?? undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        }
      });
    }

    if (err instanceof ProfileUpdateException) {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);
      const client = await provider.Client.find(params.client_id as any);

      const { message } = err;
      const code = JSON.parse(message).code;
      console.log({ code });
      return res.render('finish-registration', {
        code,
        client,
        uid,
        serverData: message,
        details: prompt.details,
        params,
        title: 'Finish registration',
        session: session ?? undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        }
      });
    }

    if (err instanceof InteractionException) {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

      const { description, status, message } = err;

      const client = await provider.Client.find(params.client_id as any);
      logger.error(err);
      res.render('error', {
        client,
        uid,
        details: prompt.details,
        error: { description, status, message },
        params,
        title: 'Interaction Error',
        session: session ? debug(session) : undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        }
      });
    }

    const defaultError = new BadRequestException(err.name);
    logger.error(err);
    next(defaultError);
  };

  app.use(errorHandler);
};
