import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  
  // --- START DYNAMIC CORS FIX ---
  const whitelist = [
    frontendUrl,                // Your production URL from .env
    'http://localhost:3000',    // Your local development URL
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if the origin is in our static whitelist
      if (whitelist.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      // Check if the origin is a Vercel preview URL for your frontend
      // This regex checks for URLs like: https://flexy-mgmt-frontend-*.vercel.app
      const vercelPreviewRegex = /^https:\/\/flexy-mgmt-frontend-.*\.vercel\.app$/;
      if (vercelPreviewRegex.test(origin)) {
        return callback(null, true);
      }

      // If the origin is not allowed, reject the request
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });
  // --- END DYNAMIC CORS FIX ---

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Swagger Config
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