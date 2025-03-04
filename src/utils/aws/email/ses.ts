import * as AWS from '@aws-sdk/client-ses';
import { fromProcess, fromSSO } from '@aws-sdk/credential-providers';
import { Logger } from '../../winston.js';
import { serverConfig } from '../../../config/server-config.js';

export class SesService {
  private readonly Source: string;
  private readonly SourceArn: string;
  private readonly Charset: string = 'UTF-8';
  private readonly logger = new Logger(SesService.name);
  private readonly client: AWS.SES;

  constructor() {
    const { region, ses } = serverConfig.aws;
    const { email_from, source_arn } = ses;

    const sesConfig: AWS.SESClientConfig = {
      region: region
    };
    if (serverConfig.node_env === 'local') {
      sesConfig['credentials'] = fromSSO({
        profile: serverConfig.aws.profile
      });
    }

    this.Source = email_from;
    this.SourceArn = source_arn;
    this.client = new AWS.SES(sesConfig);
  }

  async sendTextEmail(to: string[], subject: string, text: string): Promise<void> {
    try {
      this.logger.debug('Sending: ' + subject + ' to: ' + to.join(','));

      await this.client.sendEmail({
        Destination: { ToAddresses: to },
        Message: {
          Subject: { Charset: this.Charset, Data: subject },
          Body: {
            Text: {
              Charset: this.Charset,
              Data: text
            }
          }
        },
        SourceArn: this.SourceArn,
        Source: this.Source
      });
      this.logger.debug('Sent: ' + subject + ' to: ' + to.join(','));
    } catch (e) {
      this.logger.error(e);
    }
  }
}
