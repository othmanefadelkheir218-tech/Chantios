import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as open (no JWT). Until step 02 brings the guards, every
 * platform route carries it with a `TODO: step 02` comment.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
