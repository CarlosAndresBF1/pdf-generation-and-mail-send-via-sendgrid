import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'BD1051', description: 'Nombre de usuario' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'BD1051',
    description: 'Contraseña del usuario',
    required: true,
  })
  @IsString()
  password: string;
}
