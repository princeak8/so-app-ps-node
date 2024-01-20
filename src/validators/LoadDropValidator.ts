import { IsNumber, IsNotEmpty, IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class LoadDropValidator {
  @IsNotEmpty()
  powerStationId: string;

  @IsNumber()
  load: number;

  @IsNumber()
  previousLoad: number;

  @IsNumber()
  referenceLoad: number;

  @IsDateString()
  timeOfDrop: Date;

  @IsString()
  calType: string;

  @IsOptional()
  @IsDate()
  acknowledgedAt?: Date;
}