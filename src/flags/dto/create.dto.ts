import { IsString, IsArray, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsBoolean()
  isActive: boolean = true;

  @IsArray()
  dependencies: number[] = [];
}
