import { NextFunction, Response, Request, Express } from 'express';
import Provider, { errors } from 'oidc-provider';
import {
  BadRequestException,
  InteractionException,
  LoginException,
  MetamaskException,
  ProfileUpdateException,
  SignupException,
  PasswordResetException
} from './exceptions.js';
import { debug } from '../../helpers/debug.js';
import { Logger } from '../../utils/winston.js';

const logger = new Logger('Interaction Error Handler');

export const interactionErrorHandler = async (app: Express, provider: Provider) => {
  const errorHandler = async (err: Error, req: Request, res: Response, next: NextFunction) => {
    // if (err instanceof errors.SessionNotFound) {
    //   return res.redirect('/login');
    // }

    const { uid, prompt, params, session } = await provider.interactionDetails(req, res);
    const client = await provider.Client.find(params.client_id as any);

    if (err instanceof InteractionException) {
      logger.error(err);

      const { message } = err;

      const returnObject = {
        client,
        uid,
        details: prompt.details,
        params,
        title: '',
        error: err,
        session: session ?? undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        },
        serverData: message
      };

      if (err instanceof SignupException || err instanceof MetamaskException) {
        return res.render('signup', returnObject);
      }

      if (err instanceof ProfileUpdateException) {
        const { code } = JSON.parse(message);
        returnObject.title = 'Finish registration';
        return res.render('finish-registration', { ...returnObject, code });
      }

      if (err instanceof LoginException) {
        return res.render('login', returnObject);
      }

      if (err instanceof PasswordResetException) {
        return res.render('forgot-password', returnObject);
      }
    }

    const defaultError = new BadRequestException(err.name);
    logger.error(err);
    next(defaultError);
  };

  app.use(errorHandler);
};
