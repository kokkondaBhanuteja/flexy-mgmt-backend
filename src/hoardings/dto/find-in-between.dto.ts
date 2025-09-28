import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator';

export class FindInBetweenDto {
  @ApiProperty({ type: [Number], example: [78.384, 17.447], description: 'Source GPS coordinates as [longitude, latitude].' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(Number) : value
  )
  source: [number, number];

  @ApiProperty({ type: [Number], example: [79.5941, 17.9689], description: 'Destination GPS coordinates as [longitude, latitude].' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Transform(({ value }) =>
  typeof value === 'string' ? value.split(',').map(Number) : value
)
  destination: [number, number];
}