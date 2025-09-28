import { PartialType } from '@nestjs/swagger';
import { CreateHoardingDto } from './create-hoarding.dto';

export class UpdateHoardingDto extends PartialType(CreateHoardingDto) {
}
