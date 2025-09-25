import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/auth/services/auth.service';
import { UsersService } from '../../src/users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    userName: 'testuser',
    name: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    validateUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user with correct credentials', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    mockUsersService.validateUser.mockResolvedValue(mockUser);

    const result = await service.validateUser(email, password);

    expect(result).toEqual(mockUser);
    expect(mockUsersService.validateUser).toHaveBeenCalledWith(email, password);
  });

  it('should return null for invalid credentials', async () => {
    const email = 'test@example.com';
    const password = 'wrongpassword';

    mockUsersService.validateUser.mockResolvedValue(null);

    const result = await service.validateUser(email, password);

    expect(result).toBeNull();
  });

  it('should generate JWT token on login', async () => {
    const user = mockUser;
    const expectedToken = 'jwt.token.here';

    mockJwtService.sign.mockReturnValue(expectedToken);

    const result = await service.login(user);

    expect(result).toEqual({
      access_token: expectedToken,
      user: {
        id: user.id,
        userName: user.userName,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
      },
    });

    expect(mockJwtService.sign).toHaveBeenCalledWith({
      email: user.email,
      sub: user.id,
      userName: user.userName,
    });
  });
});
