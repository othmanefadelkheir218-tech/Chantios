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
      .addTag('Users', 'Manage users (test module)')
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
