import { KoaContextWithOIDC } from "oidc-provider";
import { ErrorResult } from "./types";
import { errors } from "oidc-provider";

export class HttpException extends errors.CustomOIDCProviderError {
  description;
  constructor(description: string, message: string) {
    super(message, description);

    this.description = description;
    this.message = message;

    this.allow_redirect = true;
  }

  getErrorResult(): ErrorResult {
    return {
      message: this.message,
      cause: this.cause,
      status: this.status,
    };
  }

  public static async renderError(
    ctx: KoaContextWithOIDC,
    out: any,
    error: any
  ) {
    ctx.type = "html";
    ctx.body = `<!DOCTYPE html>
      <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta charset="utf-8">
        <title>oops! something went wrong</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <style>
          @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);h1{font-weight:100;text-align:center;font-size:2.3em}body{font-family:Roboto,sans-serif;margin-top:25px;margin-bottom:25px}.container{padding:0 40px 10px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:2px;box-shadow:0 2px 2px rgba(0,0,0,.3);overflow:hidden}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;margin:0 0 0 1em;text-indent:-1em}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>oops! something wfdsafsadfasent wrong</h1>
          ${Object.entries(out)
            .map(
              ([key, value]) =>
                `<pre><strong>${key}</strong>: ${htmlSafe(value)}</pre>`
            )
            .join("")}
        </div>
      </body>
      </html>`;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string) {
    super(message, "bad_request");
  }
}
export default function htmlSafe(input: any) {
  if (typeof input === "number" && Number.isFinite(input)) {
    return `${input}`;
  }

  if (typeof input === "string") {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  if (typeof input === "boolean") {
    return input.toString();
  }

  return "";
}
