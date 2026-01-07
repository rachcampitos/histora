import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailProvider } from '../notifications/providers/email.provider';
import { UserRole } from '../users/schema/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let clinicsService: jest.Mocked<ClinicsService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLINIC_OWNER,
    isActive: true,
    isDeleted: false,
    toObject: function () {
      return this;
    },
  };

  const mockClinic = {
    _id: 'clinic-id-123',
    name: 'Test Clinic',
    ownerId: 'user-id-123',
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByRefreshToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      comparePasswords: jest.fn(),
      updateLastLogin: jest.fn(),
      findOne: jest.fn(),
    };

    const mockClinicsService = {
      create: jest.fn().mockResolvedValue(mockClinic),
    };

    const mockSubscriptionsService = {
      createTrialSubscription: jest.fn().mockResolvedValue({}),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const mockEmailProvider = {
      send: jest.fn().mockResolvedValue({ success: true }),
      getPasswordResetTemplate: jest.fn().mockReturnValue('<html>Reset Password</html>'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ClinicsService, useValue: mockClinicsService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailProvider, useValue: mockEmailProvider },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    clinicsService = module.get(ClinicsService);
    subscriptionsService = module.get(SubscriptionsService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      clinicName: 'Test Clinic',
    };

    it('should register a new clinic owner', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      usersService.update.mockResolvedValue(mockUser as any);

      const result = await service.register(registerDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          role: UserRole.CLINIC_OWNER,
        }),
      );
      expect(clinicsService.create).toHaveBeenCalled();
      expect(subscriptionsService.createTrialSubscription).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('registerPatient', () => {
    const registerDto = {
      email: 'patient@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('should register a new patient', async () => {
      const patientUser = { ...mockUser, role: UserRole.PATIENT };
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(patientUser as any);

      const result = await service.registerPatient(registerDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.PATIENT,
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return JWT token on successful login', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.comparePasswords.mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(usersService.updateLastLogin).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      usersService.findByEmailWithPassword.mockResolvedValue(inactiveUser as any);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.getProfile('user-id-123');

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith('user-id-123');
    });
  });

  describe('refresh', () => {
    const refreshTokenDto = {
      refresh_token: 'valid-refresh-token',
    };

    it('should return new tokens on successful refresh', async () => {
      const userWithRefreshToken = {
        ...mockUser,
        refreshTokenExpires: new Date(Date.now() + 86400000), // 1 day in future
      };
      usersService.findByRefreshToken.mockResolvedValue(userWithRefreshToken as any);
      usersService.update.mockResolvedValue(mockUser as any);

      const result = await service.refresh(refreshTokenDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toBeDefined();
      expect(usersService.findByRefreshToken).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      usersService.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        refreshTokenExpires: new Date(Date.now() - 86400000), // 1 day in past
      };
      usersService.findByRefreshToken.mockResolvedValue(userWithExpiredToken as any);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        refreshTokenExpires: new Date(Date.now() + 86400000),
      };
      usersService.findByRefreshToken.mockResolvedValue(inactiveUser as any);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
