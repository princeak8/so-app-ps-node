import { IsNumber, IsNotEmpty, IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class AcknowledgeStationLoadDropValidator {
  @IsNotEmpty()
  identifier: string;

  @IsDateString()
  acknowledgedAt: Date;
}