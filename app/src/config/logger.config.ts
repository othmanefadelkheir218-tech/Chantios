import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

/**
 * Pino logs (HTTP requests + handler logs), one short line each:
 *   [13:10:16] INFO: POST /api/users 201 47ms
 *   [13:10:16] INFO: [CreateUserHandler] User created: 3f8a...
 * Nest boot logs are not shown (see `logger` option in main.ts).
 */
export function loggerConfig(config: ConfigService): Params {
  const env = config.get<string>('NODE_ENV');
  const isProd = env === 'production';

  return {
    pinoHttp: {
      level: env === 'test' ? 'silent' : isProd ? 'info' : 'debug',
      autoLogging: {
        ignore: (req) => /^\/api\/(health|docs)/.test(req.url ?? ''),
      },
      customSuccessMessage: (req, res, time) =>
        `${req.method} ${req.url} ${res.statusCode} ${Math.round(time)}ms`,
      customErrorMessage: (req, res) =>
        `${req.method} ${req.url} ${res.statusCode} failed`,
      customLogLevel: (_req, res) =>
        res.statusCode >= 500
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname,req,res,responseTime,context',
              messageFormat: '{if context}[{context}] {end}{msg}',
            },
          },
    },
  };
}
