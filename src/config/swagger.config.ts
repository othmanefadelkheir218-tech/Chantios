import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { env } from './env.config';
import { ServiceStatus } from './status';

export const SWAGGER_PATH = 'api/docs';

export function setupSwagger(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('ChantierOS API')
      .setDescription(
        'Backend API of ChantierOS, a SaaS for construction and renovation companies.\n\n' +
          '- All routes start with `/api`.\n' +
          '- Send and receive JSON.\n' +
          '- Errors have the format `{ statusCode, message, error }`.',
      )
      .setVersion('0.1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('Health', 'Check that the API and the database work')
      .addTag('Tenants', 'Companies using ChantierOS (platform admin)')
      .addTag('Admin users', 'ChantierOS staff accounts (platform admin)')
      .addTag('Plans', 'Plan catalogue and its versions (platform admin)')
      .addTag(
        'Subscriptions',
        'Tenant subscriptions and usage (platform admin)',
      )
      .addTag('Audit logs', 'Every sensitive platform action (platform admin)')
      .addTag('Analytics', 'Product analytics events (platform admin)')
      .addTag('Feedback', 'Tenant feature requests (platform admin)')
      .build(),
  );

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'ChantierOS API docs',
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}

export function getSwaggerStatus(): ServiceStatus {
  return env.SWAGGER_ENABLED
    ? {
        name: 'Swagger',
        ok: true,
        detail: `http://localhost:${env.PORT}/${SWAGGER_PATH}`,
      }
    : { name: 'Swagger', ok: true, detail: 'disabled (SWAGGER_ENABLED=false)' };
}
