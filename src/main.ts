import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.enableCors({
      origin: frontendUrl, 
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
  
  //graceful Shutdown
  app.enableShutdownHooks();
  
  await app.listen(configService.get<number>('BACKEND_PORT') || 8080);
  // console.log(`Application is running on: ${await app.getUrl()}`);

}
bootstrap();
