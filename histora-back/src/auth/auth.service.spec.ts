import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schema/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
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

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
      comparePasswords: jest.fn(),
      updateLastLogin: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
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

      const result = await service.register(registerDto);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          role: UserRole.CLINIC_OWNER,
        }),
      );
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
});
