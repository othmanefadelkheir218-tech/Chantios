import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { DEV_TOOLS_ENABLED } from '../../config/env.config';

/**
 * The dev tools exist only outside production AND with `DEV_TOOLS=true`
 * (doc/notes/Phaces/20-trial-end-dev-tools.md). Otherwise every route is a
 * plain `404` — the routes look as if they were never there.
 */
@Injectable()
export class DevToolsGuard implements CanActivate {
  canActivate(): boolean {
    if (!DEV_TOOLS_ENABLED) throw new NotFoundException();
    return true;
  }
}
