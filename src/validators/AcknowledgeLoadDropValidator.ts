import { IsNumber, IsNotEmpty, IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class AcknowledgeLoadDropValidator {
  @IsNotEmpty()
  id: number;

  @IsDateString()
  acknowledgedAt: Date;
}