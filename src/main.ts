import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  
  // Whitelist of static URLs
  const whitelist = [
    frontendUrl,                // Your production URL
    'http://localhost:3000',    // Your local development URL
  ];

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      // ✅ Regex to automatically allow all Vercel preview URLs for your frontend
      const vercelPreviewRegex = /^https:\/\/flexy-mgmt-frontend-.*\.vercel\.app$/;
      if (vercelPreviewRegex.test(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });

  // ... rest of your main.ts file
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  const config = new DocumentBuilder()
    .setTitle('Hoarding Management API')
    .setDescription('API documentation for managing city hoardings')
    .setVersion('1.0')
    .addTag('hoardings')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableShutdownHooks();
  await app.listen(configService.get<number>('BACKEND_PORT') || 8080);
}
bootstrap();