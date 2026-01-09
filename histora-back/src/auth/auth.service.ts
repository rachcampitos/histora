import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DoctorsService } from '../doctors/doctors.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterPatientDto, RegisterNurseDto } from './dto/register.dto';
import { NursesService } from '../nurses/nurses.service';
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

export interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean; // Indicates if user needs to complete registration
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    private doctorsService: DoctorsService,
    private nursesService: NursesService,
    private emailProvider: EmailProvider,
    private notificationsService: NotificationsService,
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

    // Create Doctor profile for the clinic owner (they are also a doctor)
    await this.doctorsService.create(
      clinic['_id'].toString(),
      user['_id'].toString(),
      {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        specialty: registerDto.specialty || 'Medicina General',
        email: registerDto.email,
        phone: registerDto.phone,
        isPublicProfile: true, // Visible in public directory by default
      },
    );

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

    // Notify admins about new doctor registration (async, don't block)
    this.notificationsService.notifyAdminNewDoctorRegistered({
      id: user['_id'].toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      clinicName: registerDto.clinicName,
    }).catch(err => {
      this.logger.error(`Failed to notify admins about new doctor: ${err.message}`);
    });

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

    // Notify admins about new patient registration (async, don't block)
    this.notificationsService.notifyAdminNewPatientRegistered({
      id: user['_id'].toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }).catch(err => {
      this.logger.error(`Failed to notify admins about new patient: ${err.message}`);
    });

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

  async registerNurse(registerDto: RegisterNurseDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Create user as nurse
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.NURSE,
    });

    // Create nurse profile
    const nurseProfile = await this.nursesService.create(user['_id'].toString(), {
      cepNumber: registerDto.cepNumber,
      specialties: registerDto.specialties || [],
    });

    const nurseProfileId = (nurseProfile as any)._id;

    // Update user with nurseProfileId
    await this.usersService.update(user['_id'].toString(), {
      nurseProfileId,
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      nurseId: nurseProfileId.toString(),
    };

    // Generate and save refresh token
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user['_id'].toString(), refreshToken);

    this.logger.log(`Nurse registered: ${user.email} with CEP: ${registerDto.cepNumber}`);

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

    // Get nurseId if user is a nurse
    let nurseId: string | undefined;
    if (user.role === UserRole.NURSE && user.nurseProfileId) {
      nurseId = user.nurseProfileId.toString();
    }

    // Generate JWT token with appropriate expiry
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId?.toString(),
      nurseId,
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

    // Build reset link (using hash routing for Angular)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const resetLink = `${frontendUrl}/#/authentication/reset-password?token=${resetToken}`;

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
  }): Promise<GoogleAuthResponse> {
    this.logger.log(`Google login attempt for: ${googleUser.email}`);

    let isNewUser = false;

    // Check if user exists by googleId
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    this.logger.log(`findByGoogleId result: ${user ? `found (role: ${user.role})` : 'not found'}`);

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
        // Create new user from Google data (with default PATIENT role)
        user = await this.usersService.createFromGoogle(googleUser);
        isNewUser = true; // Flag to indicate user needs to select their role
        this.logger.log(`New user created from Google: ${user.email}`);
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

    this.logger.log(`Google login successful for ${user.email} with role: ${user.role}, isNewUser: ${isNewUser}`);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      isNewUser,
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

  /**
   * Complete registration for new Google users who need to select their role
   */
  async completeGoogleRegistration(
    userId: string,
    userType: 'doctor' | 'patient',
    clinicData?: { clinicName: string; clinicPhone?: string },
  ): Promise<AuthResponse> {
    this.logger.log(`Completing Google registration for user ${userId} as ${userType}`);

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Only allow completion if user was created via Google and still has default patient role
    if (user.authProvider !== 'google') {
      throw new UnauthorizedException('Esta función solo está disponible para usuarios de Google');
    }

    if (userType === 'doctor') {
      if (!clinicData?.clinicName) {
        throw new UnauthorizedException('El nombre del consultorio es requerido');
      }

      // Create clinic
      const clinic = await this.clinicsService.create(
        {
          name: clinicData.clinicName,
          phone: clinicData.clinicPhone,
        },
        userId,
      );

      // Update user to clinic_owner role
      await this.usersService.update(userId, {
        role: UserRole.CLINIC_OWNER,
        clinicId: clinic['_id'],
      });

      // Create trial subscription
      await this.subscriptionsService.createTrialSubscription(
        clinic['_id'].toString(),
      );

      // Create doctor profile
      await this.doctorsService.create(
        clinic['_id'].toString(),
        userId,
        {
          firstName: user.firstName,
          lastName: user.lastName,
          specialty: 'Medicina General', // Default specialty
          email: user.email,
          phone: user.phone,
        },
      );

      // Notify admins
      await this.notificationsService.notifyAdminNewDoctorRegistered({
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        clinicName: clinicData.clinicName,
      });

      // Generate new token with updated role
      const payload: JwtPayload = {
        sub: userId,
        email: user.email,
        role: UserRole.CLINIC_OWNER,
        clinicId: clinic['_id'].toString(),
      };

      const refreshToken = this.generateRefreshToken();
      await this.saveRefreshToken(userId, refreshToken);

      this.logger.log(`Google user ${user.email} completed registration as doctor`);

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: UserRole.CLINIC_OWNER,
          clinicId: clinic['_id'].toString(),
          avatar: user.avatar,
        },
      };
    } else {
      // Patient registration - Google users already have PATIENT role by default
      // Just notify admins and generate new tokens

      // Notify admins
      await this.notificationsService.notifyAdminNewPatientRegistered({
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });

      // Generate token (role stays as PATIENT)
      const payload: JwtPayload = {
        sub: userId,
        email: user.email,
        role: UserRole.PATIENT,
      };

      const refreshToken = this.generateRefreshToken();
      await this.saveRefreshToken(userId, refreshToken);

      this.logger.log(`Google user ${user.email} completed registration as patient`);

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: UserRole.PATIENT,
          avatar: user.avatar,
        },
      };
    }
  }
}
