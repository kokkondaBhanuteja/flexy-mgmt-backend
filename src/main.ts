import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// 👈 New import for ConfigService
import { ConfigService } from '@nestjs/config'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👈 Retrieve ConfigService instance
  const configService = app.get(ConfigService); 
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // --- START CORS CONFIGURATION UPDATE using ConfigService ---
  // Retrieve the production frontend URL (e.g., https://flexy-mgmt-frontend.vercel.app)
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  
  // Define allowed origins: localhost for development, FRONTEND_URL for production
  const allowedOrigins = [
    'http://localhost:3000',
    frontendUrl, // Retrieved via ConfigService
  ].filter(Boolean); // Filter out null/undefined

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // If the origin is not allowed, reject the request
      callback(new Error(`Not allowed by CORS from origin: ${origin}`));
    },
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });
  // --- END CORS CONFIGURATION UPDATE ---
  
  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Hoarding Management API')
    .setDescription('API documentation for managing city hoardings')
    .setVersion('1.0')
    .addTag('hoardings') // Add a tag for grouping endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document)
  
  // 👈 Use ConfigService to get the port, defaulting to 8080
  const port = configService.get<number>('BACKEND_PORT') || 8080;
  await app.listen(port);
}
bootstrap();