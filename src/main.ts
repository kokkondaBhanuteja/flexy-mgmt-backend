import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.enableCors({
      origin: 'http://localhost:3000', 
      methods: 'GET,PATCH,POST,DELETE',
      credentials: true,
  });
  
  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Hoarding Management API')
    .setDescription('API documentation for managing city hoardings')
    .setVersion('1.0')
    .addTag('hoardings') // Add a tag for grouping endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document)
  
  await app.listen(8080);
}
bootstrap();
