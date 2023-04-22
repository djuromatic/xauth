import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { Express } from 'express';

import isEmpty from 'lodash/isEmpty.js';
import { NextFunction, Request, Response, urlencoded } from 'express'; // eslint-disable-line import/no-unresolved
import Provider, { InteractionResults } from 'oidc-provider';

import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';

import { check as passwordLoginCheck } from '../helpers/password-login-checks.js';

const keys = new Set();
const debug = (obj: any) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc: any, [key, value]) => {
      keys.add(key);
      if (isEmpty(value)) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
      }
    }
  );

export default (app: Express, provider: Provider) => {
  app.use('/interaction', urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const orig = res.render;
    // you'll probably want to use a full blown render engine capable of layouts

    res.render = (view, locals: any) => {
      const shouldRenderLayout = locals.layout !== false;
      if (!shouldRenderLayout) {
        app.render(view, locals, (err: any, html: any) => {
          if (err) throw err;
          //todo fix this we have html here no need to render again
          orig.call(res, 'repost', { ...locals });
        });
        return next();
      }

      app.render(view, locals as any, (err: any, html: any) => {
        if (err) throw err;

        orig.call(res, '_layout', {
          ...locals,
          body: html
        });
      });
    };

    next();
  });

  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.get(
    '/interaction/:uid',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } =
          await provider.interactionDetails(req, res);
        console.log({ uid, prompt, params, session });

        const client = await provider.Client.find(params.client_id as any);

        console.log({ promptName: prompt.name });

        if (prompt.name === 'consent') {
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',

            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          });
        }

        return res.render('landing', {
          client,
          uid,
          details: prompt.details,
          params,
          google: true,
          title: 'Landing',
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post(
    '/interaction/:uid/login-init',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } =
          await provider.interactionDetails(req, res);
        console.log({ uid, prompt, params, session });

        const client = await provider.Client.find(params.client_id as any);

        return res.render('login', {
          client,
          uid,
          details: prompt.details,
          params,
          google: true,
          title: 'Sign-In',
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post(
    '/interaction/:uid/login',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          prompt: { name },
          params
        } = await provider.interactionDetails(req, res);

        const result = await passwordLoginCheck(req.body);

        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/interaction/:uid/confirm',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const interactionDetails = await provider.interactionDetails(req, res);
        const {
          prompt: { name, details },
          params,
          session: { accountId }
        } = interactionDetails;
        // assert.equal(name, "consent");

        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
          // we'll be modifying existing grant in existing session
          grant = await provider.Grant.find(grantId);
        } else {
          // we're establishing a new grant
          grant = new provider.Grant({
            accountId,
            clientId: params.client_id as string
          });
        }

        if (details.missingOIDCScope) {
          grant.addOIDCScope(details.missingOIDCScope as string);
        }
        if (details.missingOIDCClaims) {
          grant.addOIDCClaims(details.missingOIDCClaims as string[]);
        }
        if (details.missingResourceScopes) {
          for (const [indicator, scopes] of Object.entries(
            details.missingResourceScopes
          )) {
            grant.addResourceScope(indicator, scopes.join(' '));
          }
        }

        grantId = await grant.save();

        const consent: Partial<InteractionResults> = {};
        if (!interactionDetails.grantId) {
          // we don't have to pass grantId to consent, we're just modifying existing one
          consent.grantId = grantId as string;
        }

        const result = { consent };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: true
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    '/interaction/:uid/abort',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = {
          error: 'access_denied',
          error_description: 'End-User aborted interaction'
        };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false
        });
      } catch (err) {
        next(err);
      }
    }
  );

  interactionErrorHandler(app, provider);
};
