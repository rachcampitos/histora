import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schema/user.schema';
import { Clinic, ClinicDocument } from '../clinics/schema/clinic.schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/admin-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
  ) {}

  async getUsers(query: UserQueryDto) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isDeleted: false };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    // Get total count
    const total = await this.userModel.countDocuments(filter);

    // Get users with clinic info
    const users = await this.userModel
      .find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Transform data
    const data = users.map((user) => {
      const userDoc = user as any;
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clinic: user.clinicId ? (user.clinicId as any).name : null,
        clinicId: user.clinicId ? (user.clinicId as any)._id?.toString() : null,
        status: user.isActive ? 'active' : 'inactive',
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider || 'local',
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('clinicId', 'name')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userDoc = user as any;
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      clinic: user.clinicId ? (user.clinicId as any).name : null,
      clinicId: user.clinicId ? (user.clinicId as any)._id?.toString() : null,
      status: user.isActive ? 'active' : 'inactive',
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider || 'local',
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };
  }

  async createUser(dto: CreateUserDto) {
    // Check if email exists
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      isDeleted: false,
    });

    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = new this.userModel({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      isActive: true,
      isEmailVerified: true, // Admin created users are verified
      authProvider: 'local',
    });

    await user.save();
    this.logger.log(`Admin created user: ${user.email}`);

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: 'Usuario creado exitosamente',
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: dto.email.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException('Este email ya está registrado');
      }
      dto.email = dto.email.toLowerCase();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password -refreshToken');

    this.logger.log(`Admin updated user: ${updatedUser?.email}`);

    return {
      id: updatedUser?._id.toString(),
      firstName: updatedUser?.firstName,
      lastName: updatedUser?.lastName,
      email: updatedUser?.email,
      role: updatedUser?.role,
      isActive: updatedUser?.isActive,
      message: 'Usuario actualizado exitosamente',
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Soft delete
    await this.userModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
    });

    this.logger.log(`Admin deleted user: ${user.email}`);

    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  async toggleUserStatus(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = !user.isActive;
    await user.save();

    this.logger.log(`Admin toggled user status: ${user.email} -> ${user.isActive ? 'active' : 'inactive'}`);

    return {
      id: user._id.toString(),
      isActive: user.isActive,
      status: user.isActive ? 'active' : 'inactive',
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
    };
  }

  async resetUserPassword(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });

    this.logger.log(`Admin reset password for user: ${user.email}`);

    // In production, send email with temp password
    // For now, return it (only for development)
    return {
      message: 'Contraseña restablecida exitosamente',
      temporaryPassword: tempPassword, // Remove in production
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
