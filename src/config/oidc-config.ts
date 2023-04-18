import {
  Configuration,
  KoaContextWithOIDC,
  interactionPolicy,
} from "oidc-provider";
import { getInteractionPolicy } from "../helpers/interaction-policy.js";
import { getProviderClients } from "../helpers/provider-clients.js";
import { findAccount } from "../service/account.service.js";
import { MongoAdapter } from "../database/mongoose.adapter.js";

const jwks = {
  keys: [
    {
      d: "VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ",
      dp: "E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0",
      dq: "F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc",
      e: "AQAB",
      kty: "RSA",
      n: "xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ",
      p: "5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM",
      q: "3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M",
      qi: "wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU",
      use: "sig",
    },
    {
      crv: "P-256",
      d: "K9xfPv773dZR22TVUB80xouzdF7qCg5cWjPjkHyv7Ws",
      kty: "EC",
      use: "sig",
      x: "FWZ9rSkLt6Dx9E3pxLybhdM6xgR5obGsj5_pqmnz5J4",
      y: "_n8G69C-A2Xl4xUW2lF0i8ZGZnk_KPYrhv4GbTGu5G4",
    },
  ],
};

export const oidcConfig: Configuration = {
  clients: getProviderClients(),
  findAccount: findAccount,
  adapter: MongoAdapter,
  ttl: {
    AccessToken: 60 * 60, // 1 hour in seconds
    AuthorizationCode: 60 * 10, // 10 minutes in seconds
    IdToken: 60 * 60, // 1 hour in seconds
    DeviceCode: 60 * 10, // 10 minutes in seconds
    RefreshToken: 60 * 60 * 24 * 30, // 30 days in seconds
    Session: 60 * 60 * 24 * 7, // 7 days in seconds
    Interaction: 60 * 60 * 24, // 1 day in seconds
    Grant: 60 * 60 * 24 * 30, // 30 days in seconds
  },
  interactions: {
    url(ctx: KoaContextWithOIDC, interaction: any) {
      // cannot import Interaction that is why I am using any
      // eslint-disable-line no-unused-vars
      return `/interaction/${interaction.uid}`;
    },
    policy: getInteractionPolicy(),
  },
  cookies: {
    keys: [
      "some secret key",
      "and also the old rotated away some time ago",
      "and one more",
    ],
  },
  claims: {
    address: ["address"],
    email: ["email", "email_verified"],
    phone: ["phone_number", "phone_number_verified"],
    profile: [
      "birthdate",
      "family_name",
      "gender",
      "given_name",
      "locale",
      "middle_name",
      "name",
      "nickname",
      "picture",
      "preferred_username",
      "profile",
      "updated_at",
      "website",
      "zoneinfo",
    ],
  },
  features: {
    devInteractions: { enabled: false }, // defaults to true
    clientCredentials: { enabled: true },
    jwtResponseModes: { enabled: true },
    deviceFlow: { enabled: true }, // defaults to false
    revocation: { enabled: true }, // defaults to false
    resourceIndicators: {
      defaultResource: (ctx: KoaContextWithOIDC) => {
        return "http://xauth.test:3000";
      },
      enabled: false,
      getResourceServerInfo: (ctx, resourceIndicator, client) => {
        console.log("get resource server info", client);

        return {
          scope: "openid api:read api:write",
          accessTokenFormat: "jwt",
          jwt: {
            audience: "solid",
            accessTokenTTL: 2 * 60 * 60, // 2 hours
            accessTokenFormat: "jwt",
            sign: { alg: "RS256", key: jwks.keys[0] },
          },
        };
      },
      useGrantedResource: (ctx, model) => {
        // @param ctx - koa request context
        // @param model - depending on the request's grant_type this can be either an AuthorizationCode, BackchannelAuthenticationRequest,
        //                RefreshToken, or DeviceCode model instance.

        return true;
      },
    },
  },
  jwks,
};
