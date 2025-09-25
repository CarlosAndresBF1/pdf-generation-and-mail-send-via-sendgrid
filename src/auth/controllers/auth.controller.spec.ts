import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedUser } from '../interfaces/auth.interfaces';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and refresh token on successful login', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const mockUser: AuthenticatedUser = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'TESTUSER',
      };
      const expectedResult = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: mockUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockReturnValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'TESTUSER',
        'password123',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile from JWT token', () => {
      const mockUser: AuthenticatedUser = {
        id: 1,
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userName: 'TESTUSER',
      };
      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      const expectedResult = {
        accessToken: 'new-jwt-access-token',
        refreshToken: 'new-jwt-refresh-token',
      };

      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });
  });
});
