import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, HttpCode, HttpStatus, NotFoundException, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { HoardingsService } from './hoardings.service';
import { CreateHoardingDto } from './dto/create-hoarding.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Hoarding } from './schemas/hoarding.schema';
import { UpdateHoardingDto } from './dto/update-hoarding.dto';
import { FindInBetweenDto } from './dto/find-in-between.dto';

@ApiTags('hoardings')
@Controller('hoardings')
export class HoardingsController {
  constructor(private readonly hoardingsService: HoardingsService) { }

  @Post('find-in-between')
  @ApiOperation({ summary: 'Find hoardings between two points' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved hoardings.' })
  async findInBetween(@Body() findInBetweenDto: FindInBetweenDto) {
    const data = await this.hoardingsService.findInBetween(findInBetweenDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoardings retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new hoarding record' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Data for the new hoarding, including an image upload',
    type: CreateHoardingDto,
  })
  @ApiResponse({ status: 201, description: 'The hoarding was created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async create(
    @Body() createHoardingDto: CreateHoardingDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 8 }), // MAX-8MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    image: Express.Multer.File,
  ) {
    const data = await this.hoardingsService.create(createHoardingDto, image);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Hoarding created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all hoarding records' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all hoardings.' })

  async findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
  ) {
    const data = await this.hoardingsService.findAll(search, page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoardings retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a hoarding record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the hoarding.',
  })
  @ApiResponse({ status: 404, description: 'Hoarding not found.' })
  async findOne(@Param('id') id: string): Promise<{
    statusCode: number;
    message: string;
    data: Hoarding;
  }> {
    const data = await this.hoardingsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoarding retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a hoarding record by ID' })
  @ApiResponse({
    status: 200,
    description: 'The hoarding was updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Hoarding not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateHoardingDto: UpdateHoardingDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }), // 4MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Hoarding;
  }> {
    const data = await this.hoardingsService.update(id, updateHoardingDto, image);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoarding updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hoarding record by ID' })
  @ApiResponse({
    status: 200,
    description: 'The hoarding was deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Hoarding not found.' })
  async remove(@Param('id') id: string): Promise<{
    statusCode: number;
    message: string;
    data: Hoarding;
  }> {
    const data = await this.hoardingsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoarding deleted successfully',
      data,
    };
  }
}