import { BadGatewayException } from '@nestjs/common';
import { toFile } from '@imagekit/nodejs';
import type { PinoLogger } from 'nestjs-pino';
import { imagekit } from '../../config/imagekit.config';

/**
 * The shared ImageKit client fails fast (5 s, no retry) because it is built
 * for the startup check. An upload needs more room: the first call after a
 * pause can be slow on the free plan.
 */
const UPLOAD_OPTIONS = { timeout: 30_000, maxRetries: 2 };

/**
 * Uploads one file to ImageKit. A failure is logged with the real cause and
 * returned as `502` — never a bare `500`.
 */
export async function uploadToImageKit(
  file: Express.Multer.File,
  folder: string,
  logger: PinoLogger,
): Promise<{ fileId: string; url: string }> {
  let uploaded: { fileId?: string; url?: string };
  try {
    uploaded = await imagekit.files.upload(
      {
        file: await toFile(file.buffer, file.originalname, {
          type: file.mimetype,
        }),
        fileName: file.originalname,
        folder,
      },
      UPLOAD_OPTIONS,
    );
  } catch (err: unknown) {
    logger.error({ err, folder }, 'ImageKit upload failed');
    throw new BadGatewayException(
      'The file service is not available, please try again',
    );
  }
  if (!uploaded.fileId || !uploaded.url) {
    logger.error({ folder }, 'ImageKit upload returned no file');
    throw new BadGatewayException(
      'The file service is not available, please try again',
    );
  }
  return { fileId: uploaded.fileId, url: uploaded.url };
}

/**
 * Removes a file that was uploaded but whose database row could not be
 * written, so no orphan stays in ImageKit. Never throws.
 */
export async function discardUploadedFile(
  fileId: string,
  logger: PinoLogger,
): Promise<void> {
  try {
    await imagekit.files.delete(fileId);
  } catch (err: unknown) {
    logger.error({ err, fileId }, 'Could not remove the orphan ImageKit file');
  }
}
