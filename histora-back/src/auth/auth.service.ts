import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterPatientDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '../users/schema/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailProvider } from '../notifications/providers/email.provider';
import { randomBytes, createHash } from 'crypto';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    clinicId?: string;
    avatar?: string;
  };
}

@Injectable()
export class AuthService {
  // Token expiry durations
  private readonly SHORT_REFRESH_TOKEN_DAYS = 1; // Sin "Recordarme": 1 día
  private readonly LONG_REFRESH_TOKEN_DAYS = 30; // Con "Recordarme": 30 días
  private readonly SHORT_ACCESS_TOKEN_EXPIRY = '1h'; // Sin "Recordarme": 1 hora
  private readonly LONG_ACCESS_TOKEN_EXPIRY = '7d'; // Con "Recordarme": 7 días

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private clinicsService: ClinicsService,
    private subscriptionsService: SubscriptionsService,
    private emailProvider: EmailProvider,
  ) {}

  private readonly RESET_TOKEN_EXPIRY_HOURS = 24;

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: string, refreshToken: string, rememberMe = false): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date();
    const expiryDays = rememberMe ? this.LONG_REFRESH_TOKEN_DAYS : this.SHORT_REFRESH_TOKEN_DAYS;
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await this.usersService.update(userId, {
      refreshToken: hashedToken,
      refreshTokenExpires: expiresAt,
    });
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Create user as clinic owner
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.CLINIC_OWNER,
    });

    // Create clinic for the new owner
    const clinic = await this.clinicsService.create(
      {
        name: registerDto.clinicName,
        phone: registerDto.clinicPhone,
      },
      user['_id'].toString(),
    );

    // Update user with clinicId
    await this.usersService.update(user['_id'].toString(), {
      clinicId: clinic['_id'],
    });

    // Create trial subscription for the clinic
    await this.subscriptionsService.createTrialSubscription(clinic['_id'].toString());

    // Generate JWT token with clinicId
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      clinicId: clinic['_id'].toString(),
    };

    // Generate and save refresh token
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), refreshToken);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: clinic['_id'].toString(),
        avatar: user.avatar,
      },
    };
  }

  async registerPatient(registerDto: RegisterPatientDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Create user as patient
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.PATIENT,
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
    };

    // Generate and save refresh token
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), refreshToken);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Check if user has password (social login users may not have one)
    if (!user.password) {
      throw new UnauthorizedException('Por favor usa Google Sign-In para esta cuenta');
    }

    const isPasswordValid = await this.usersService.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Update last login
    await this.usersService.updateLastLogin(user['_id'].toString());

    const rememberMe = loginDto.rememberMe || false;

    // Generate JWT token with appropriate expiry
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId?.toString(),
    };

    const accessTokenExpiry = rememberMe
      ? this.LONG_ACCESS_TOKEN_EXPIRY
      : this.SHORT_ACCESS_TOKEN_EXPIRY;

    // Generate and save refresh token with appropriate expiry
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), refreshToken, rememberMe);

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: accessTokenExpiry }),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId?.toString(),
        avatar: user.avatar,
      },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const hashedToken = this.hashToken(refreshTokenDto.refresh_token);

    // Find user with matching refresh token
    const user = await this.usersService.findByRefreshToken(hashedToken);

    if (!user) {
      throw new UnauthorizedException('Token de actualización inválido');
    }

    // Check if token is expired
    if (user.refreshTokenExpires && user.refreshTokenExpires < new Date()) {
      throw new UnauthorizedException('El token de actualización ha expirado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId?.toString(),
    };

    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), newRefreshToken);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: newRefreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId?.toString(),
        avatar: user.avatar,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (user && user.password && (await this.usersService.comparePasswords(password, user.password))) {
      const { password: _, ...result } = user.toObject();
      return result;
    }

    return null;
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('No existe una cuenta con este correo electrónico');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(resetToken);

    // Set expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    // Save token to database
    await this.usersService.setPasswordResetToken(email, hashedToken, expiresAt);

    // Build reset link
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const resetLink = `${frontendUrl}/authentication/reset-password?token=${resetToken}`;

    // Send email
    const emailHtml = this.emailProvider.getPasswordResetTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      resetLink,
      expiresIn: '24 horas',
    });

    await this.emailProvider.send({
      to: email,
      subject: 'Recuperar Contraseña - Histora',
      html: emailHtml,
    });

    return {
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = this.hashToken(token);
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new UnauthorizedException('El enlace de recuperación es inválido o ha expirado');
    }

    // Update password
    await this.usersService.updatePassword(user['_id'].toString(), newPassword);

    // Clear reset token
    await this.usersService.clearPasswordResetToken(user['_id'].toString());

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente',
    };
  }

  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    picture?: string;
  }): Promise<AuthResponse> {
    // Check if user exists by googleId
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      // Check if user exists by email
      const existingUserByEmail = await this.usersService.findByEmail(googleUser.email);

      if (existingUserByEmail) {
        // Link Google account to existing user
        await this.usersService.linkGoogleAccount(
          existingUserByEmail['_id'].toString(),
          googleUser.googleId,
        );
        user = existingUserByEmail;
      } else {
        // Create new user from Google data
        user = await this.usersService.createFromGoogle(googleUser);
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Update last login
    await this.usersService.updateLastLogin(user['_id'].toString());

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId?.toString(),
    };

    // Generate and save refresh token
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), refreshToken);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId?.toString(),
        avatar: user.avatar,
      },
    };
  }
}
