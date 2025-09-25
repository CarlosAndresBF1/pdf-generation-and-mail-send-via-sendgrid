import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const user = {
        id: 1,
        name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        username: 'testuser',
      };
      const expectedToken = 'jwt-token';

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(user);

      expect(result).toEqual({
        accessToken: expectedToken,
        user: user,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
      });
    });
  });
});
