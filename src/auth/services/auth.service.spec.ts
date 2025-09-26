import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interfaces';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    comparePassword: jest.fn(),
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

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = {
        id: 1,
        userName: 'testuser',
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.comparePassword.mockResolvedValue(false);

      await expect(
        service.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        userName: 'testuser',
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult: AuthenticatedUser = {
        id: 1,
        userName: 'testuser',
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'correctpassword');

      expect(result).toMatchObject(expectedResult);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should return access token, refresh token and user data', () => {
      const user: AuthenticatedUser = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'testuser',
      };
      const expectedAccessToken = 'jwt-access-token';
      const expectedRefreshToken = 'jwt-refresh-token';

      mockJwtService.sign
        .mockReturnValueOnce(expectedAccessToken)
        .mockReturnValueOnce(expectedRefreshToken);

      const result = service.login(user);

      expect(result).toEqual({
        accessToken: expectedAccessToken,
        refreshToken: expectedRefreshToken,
        user: user,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          userName: user.userName,
        },
        { expiresIn: '7d' },
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const mockPayload = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'testuser',
      };
      const mockUser: AuthenticatedUser = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'testuser',
      };
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user no longer exists', async () => {
      const mockPayload = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'testuser',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
