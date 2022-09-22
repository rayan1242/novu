import {
  ChannelTypeEnum,
  EmailEventStatusEnum,
  IEmailOptions,
  IEmailProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';

import { MailService } from '@sendgrid/mail';

export class SendgridEmailProvider implements IEmailProvider {
  id = 'sendgrid';
  channelType = ChannelTypeEnum.EMAIL as ChannelTypeEnum.EMAIL;
  private sendgridMail: MailService;

  constructor(
    private config: {
      apiKey: string;
      from: string;
    }
  ) {
    this.sendgridMail = new MailService();
    this.sendgridMail.setApiKey(this.config.apiKey);
  }

  async sendMessage(
    options: IEmailOptions
  ): Promise<ISendMessageSuccessResponse> {
    const response = await this.sendgridMail.send({
      from: options.from || this.config.from,
      to: options.to,
      html: options.html,
      subject: options.subject,
      substitutions: {},
      customArgs: {
        id: options.id,
      },
      attachments: options.attachments?.map((attachment) => {
        return {
          content: attachment.file.toString('base64'),
          filename: attachment.name,
          type: attachment.mime,
        };
      }),
    });

    return {
      id: options.id || response[0]?.headers['x-message-id'],
      date: response[0]?.headers?.date,
    };
  }

  getMessageId(body) {
    return body.id;
  }

  parseEventBody(body: any, identifier: string) {
    return {
      status: EmailEventStatusEnum.DELIVERY,
      date: new Date().toISOString(),
      externalId: body.id,
      attempts: body.attempt ? parseInt(body.attempt, 10) : 1,
      response: body.response ? body.response : '',
      row: body,
    };
  }
}
