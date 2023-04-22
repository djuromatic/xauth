export type RequestParams = {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
};

export class GoogleService {
  public static redirectAuthorizeUrl(requestParams: RequestParams): string {
    const url = new URL('https://accounts.google.com/o/oauth2/auth');
    url.search = new URLSearchParams(requestParams).toString();

    return url.toString();
  }
}
