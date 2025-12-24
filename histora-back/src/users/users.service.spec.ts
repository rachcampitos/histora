import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './schema/user.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindById,
  configureMockFindByIdAndUpdate,
  configureMockFindOne,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userModel: MockModel;

  const mockUser = {
    _id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+51987654321',
    role: UserRole.CLINIC_OWNER,
    isActive: true,
    isEmailVerified: false,
    isDeleted: false,
  };

  const mockCreateDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+51987654321',
    role: UserRole.CLINIC_OWNER,
  };

  beforeEach(async () => {
    userModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      configureMockFindOne(userModel, null); // No existing user

      const result = await service.create(mockCreateDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockCreateDto.email);
      expect(result.firstName).toBe(mockCreateDto.firstName);
    });

    it('should throw ConflictException if email already exists', async () => {
      configureMockFindOne(userModel, mockUser);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return array of users without passwords', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: 'user-id-456' }];
      configureMockFind(userModel, mockUsers);

      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockUsers);
    });

    it('should filter by clinicId if provided', async () => {
      configureMockFind(userModel, [mockUser]);

      await service.findAll('clinic-123');

      expect(userModel.find).toHaveBeenCalledWith({
        isDeleted: false,
        clinicId: 'clinic-123',
      });
    });

    it('should return empty array when no users exist', async () => {
      configureMockFind(userModel, []);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findOne('user-id-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      configureMockFindOne(userModel, mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      configureMockFindOne(userModel, null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the modified user', async () => {
      const updateDto = { firstName: 'Jane', lastName: 'Smith' };
      const updatedUser = { ...mockUser, ...updateDto };

      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedUser),
        }),
      });

      const result = await service.update('user-id-123', updateDto);

      expect(result).toEqual(updatedUser);
      expect(result?.firstName).toBe('Jane');
    });

    it('should return null when user to update not found', async () => {
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.update('non-existent-id', {
        firstName: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete by setting isDeleted to true', async () => {
      const deletedUser = { ...mockUser, isDeleted: true };

      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(deletedUser),
        }),
      });

      const result = await service.remove('user-id-123');

      expect(result?.isDeleted).toBe(true);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const result = await service.comparePasswords(
        'password123',
        'hashed_password',
      );

      expect(result).toBe(true);
    });
  });
});
