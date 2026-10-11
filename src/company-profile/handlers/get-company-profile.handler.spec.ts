import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import type { MediaService } from '../../media/media.service';
import type { TenantsService } from '../../tenants/tenants.service';
import { GetCompanyProfileHandler } from './get-company-profile.handler';

describe('GetCompanyProfileHandler — step 18', () => {
  const logger = { warn: jest.fn() } as unknown as PinoLogger;
  const tenants = { findOne: jest.fn() };
  const media = { findOne: jest.fn() };
  const handler = new GetCompanyProfileHandler(
    logger,
    tenants as unknown as TenantsService,
    media as unknown as MediaService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('adds the logo URL', async () => {
    tenants.findOne.mockResolvedValue({
      id: 1,
      name: 'Alpha',
      logoMediaId: 62,
    });
    media.findOne.mockResolvedValue({ id: 62, fileUrl: 'https://ik/logo.png' });

    await expect(handler.execute(1)).resolves.toEqual({
      id: 1,
      name: 'Alpha',
      logoMediaId: 62,
      logoUrl: 'https://ik/logo.png',
    });
    expect(media.findOne).toHaveBeenCalledWith(62);
  });

  it('logoUrl is null without a logo', async () => {
    tenants.findOne.mockResolvedValue({ id: 1, logoMediaId: null });
    await expect(handler.execute(1)).resolves.toMatchObject({ logoUrl: null });
    expect(media.findOne).not.toHaveBeenCalled();
  });

  it('a missing logo file gives null, not an error', async () => {
    tenants.findOne.mockResolvedValue({ id: 1, logoMediaId: 9 });
    media.findOne.mockRejectedValue(new NotFoundException());
    await expect(handler.execute(1)).resolves.toMatchObject({ logoUrl: null });
  });
});
