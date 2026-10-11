import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/** "As if `days` days passed" for one company's subscription. */
export class TimeTravelDto {
  @ApiProperty({ example: 11, minimum: 1, maximum: 400 })
  @IsInt()
  @Min(1)
  @Max(400)
  days: number;
}
