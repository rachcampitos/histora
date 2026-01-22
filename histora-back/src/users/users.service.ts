import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    try {
      return await newUser.save();
    } catch (error: any) {
      // Handle MongoDB duplicate key error (race condition)
      if (error.code === 11000) {
        throw new ConflictException('Este email ya está registrado');
      }
      throw error;
    }
  }

  async findAll(clinicId?: string): Promise<User[]> {
    const query: Record<string, any> = { isDeleted: false };
    if (clinicId) {
      query.clinicId = clinicId;
    }
    return this.userModel.find(query).select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
  }

  async findByDni(dni: string): Promise<UserDocument | null> {
    const cleanDni = dni.replace(/\D/g, '');
    return this.userModel
      .findOne({ dni: cleanDni, isDeleted: false })
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    return updatedUser;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .select('-password')
      .exec();
  }

  async setPasswordResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { passwordResetToken: token, passwordResetExpires: expires },
    );
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isDeleted: false,
      })
      .exec();
  }

  async findByRefreshToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        refreshToken: hashedToken,
        isDeleted: false,
      })
      .exec();
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      refreshToken: null,
      refreshTokenExpires: null,
    });
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  // OTP methods for password recovery
  async setPasswordResetOtp(
    email: string,
    otp: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        passwordResetOtp: otp,
        passwordResetOtpExpires: expires,
        passwordResetOtpAttempts: 0,
      },
    );
  }

  async findByPasswordResetOtp(email: string, otp: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.toLowerCase(),
        passwordResetOtp: otp,
        passwordResetOtpExpires: { $gt: new Date() },
        isDeleted: false,
      })
      .exec();
  }

  async incrementOtpAttempts(email: string): Promise<number> {
    const result = await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $inc: { passwordResetOtpAttempts: 1 } },
      { new: true },
    );
    return result?.passwordResetOtpAttempts || 0;
  }

  async clearPasswordResetOtp(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      passwordResetOtp: null,
      passwordResetOtpExpires: null,
      passwordResetOtpAttempts: 0,
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { isEmailVerified: true });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateAvatar(
    id: string,
    avatarUrl: string,
    publicId: string,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { avatar: avatarUrl, avatarPublicId: publicId },
        { new: true },
      )
      .select('-password')
      .exec();
  }

  async getAvatarPublicId(id: string): Promise<string | null> {
    const user = await this.userModel.findById(id).select('avatarPublicId').exec();
    return user?.avatarPublicId || null;
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ googleId, isDeleted: false })
      .exec();
  }

  async createFromGoogle(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    picture?: string;
  }): Promise<UserDocument> {
    const newUser = new this.userModel({
      email: googleUser.email.toLowerCase(),
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      googleId: googleUser.googleId,
      avatar: googleUser.picture,
      authProvider: 'google',
      isEmailVerified: true, // Google emails are verified
      isActive: true,
    });

    return newUser.save();
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { googleId },
        { new: true },
      )
      .select('-password')
      .exec();
  }
}
