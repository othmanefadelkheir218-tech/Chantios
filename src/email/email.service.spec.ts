import { BadGatewayException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';

const send = jest.fn();

jest.mock('../config/env.config', () => ({
  env: { EMAIL: 'no-reply@example.com' },
}));
jest.mock('../config/resend.config', () => ({
  resend: { emails: { send } },
}));

import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  const logger = { info: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getLoggerToken(EmailService.name), useValue: logger },
      ],
    }).compile();
    service = module.get(EmailService);
  });

  it('sends through Resend with the configured sender', async () => {
    send.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    await service.send('tenant@example.test', 'Subject', '<p>Body</p>');

    expect(send).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'tenant@example.test',
      subject: 'Subject',
      html: '<p>Body</p>',
    });
  });

  it('throws when Resend returns an error', async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: 'invalid_api_key', message: 'API key is invalid' },
    });

    await expect(
      service.send('tenant@example.test', 'Subject', '<p>Body</p>'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
