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
import { RegisterDto, RegisterPatientDto, RegisterNurseDto, ValidateNurseCepDto, CompleteNurseRegistrationDto } from './dto/register.dto';
import { NursesService } from '../nurses/nurses.service';
import { CepValidationService } from '../nurses/cep-validation.service';
import { ReniecValidationService } from '../nurses/reniec-validation.service';
import { AccountLockoutService } from './services/account-lockout.service';
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
    private cepValidationService: CepValidationService,
    private reniecValidationService: ReniecValidationService,
    private accountLockoutService: AccountLockoutService,
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

    // Validate terms acceptance
    if (!registerDto.termsAccepted) {
      throw new UnauthorizedException('Debe aceptar los términos y condiciones');
    }
    if (!registerDto.professionalDisclaimerAccepted) {
      throw new UnauthorizedException('Debe aceptar la exención de responsabilidad profesional');
    }

    // Create user as clinic owner with terms acceptance
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.CLINIC_OWNER,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      professionalDisclaimerAccepted: true,
      professionalDisclaimerAcceptedAt: new Date(),
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

    // Validate terms acceptance
    if (!registerDto.termsAccepted) {
      throw new UnauthorizedException('Debe aceptar los términos y condiciones');
    }

    // Create user as patient with terms acceptance
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.PATIENT,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
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
    this.logger.log(`[REGISTER NURSE] Starting registration for email: ${registerDto.email}`);

    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(`[REGISTER NURSE] Email already exists: ${registerDto.email}`);
      throw new ConflictException('Este email ya está registrado');
    }
    this.logger.log(`[REGISTER NURSE] Email check passed, email is available`);

    // Check if CEP number is already registered BEFORE creating user
    const existingNurse = await this.nursesService.findByCepNumber(registerDto.cepNumber);
    if (existingNurse) {
      this.logger.warn(`[REGISTER NURSE] CEP already registered: ${registerDto.cepNumber}`);
      throw new ConflictException('Este número CEP ya está registrado');
    }
    this.logger.log(`[REGISTER NURSE] CEP check passed, CEP is available`);

    // Validate terms acceptance
    if (!registerDto.termsAccepted) {
      throw new UnauthorizedException('Debe aceptar los términos y condiciones');
    }
    if (!registerDto.professionalDisclaimerAccepted) {
      throw new UnauthorizedException('Debe aceptar la exención de responsabilidad profesional');
    }

    // Create user as nurse with terms acceptance
    this.logger.log(`[REGISTER NURSE] Creating user...`);
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.NURSE,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      professionalDisclaimerAccepted: true,
      professionalDisclaimerAcceptedAt: new Date(),
    });
    this.logger.log(`[REGISTER NURSE] User created with ID: ${user['_id']}`);

    // Create nurse profile
    this.logger.log(`[REGISTER NURSE] Creating nurse profile...`);
    const nurseProfile = await this.nursesService.create(user['_id'].toString(), {
      cepNumber: registerDto.cepNumber,
      specialties: registerDto.specialties || [],
    });
    this.logger.log(`[REGISTER NURSE] Nurse profile created`);

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
    const email = loginDto.email.toLowerCase();

    // Check if account is locked due to too many failed attempts
    const lockStatus = this.accountLockoutService.isLocked(email);
    if (lockStatus.isLocked) {
      const minutes = Math.ceil(lockStatus.remainingTime / 60);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutes} minuto${minutes !== 1 ? 's' : ''}.`,
      );
    }

    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      // Record failed attempt even for non-existent users (prevents user enumeration)
      this.accountLockoutService.recordFailedAttempt(email);
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
      // Record failed attempt
      const result = this.accountLockoutService.recordFailedAttempt(email);
      if (result.isLocked) {
        throw new UnauthorizedException(
          `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(result.lockoutDuration / 60)} minutos.`,
        );
      }
      throw new UnauthorizedException(
        `Credenciales inválidas. ${result.attemptsRemaining} intento${result.attemptsRemaining !== 1 ? 's' : ''} restante${result.attemptsRemaining !== 1 ? 's' : ''}.`,
      );
    }

    // Clear lockout on successful login
    this.accountLockoutService.recordSuccessfulLogin(email);

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

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Sesión cerrada exitosamente' };
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

  async updateProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    address?: string;
    phone?: string;
  }) {
    const updatedUser = await this.usersService.update(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: updatedUser['_id'].toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if user has a password (social login users may not have one)
    if (!user.password) {
      throw new UnauthorizedException('No puedes cambiar la contraseña de una cuenta de Google');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.usersService.comparePasswords(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Update password
    await this.usersService.updatePassword(userId, newPassword);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
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
    userType: 'doctor' | 'patient' | 'nurse',
    clinicData?: { clinicName: string; clinicPhone?: string },
    nurseData?: { cepNumber: string; specialties?: string[] },
    termsData?: { termsAccepted: boolean; professionalDisclaimerAccepted?: boolean },
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

    // Validate terms acceptance
    if (!termsData?.termsAccepted) {
      throw new UnauthorizedException('Debe aceptar los términos y condiciones');
    }

    // Validate professional disclaimer for doctors and nurses
    if ((userType === 'doctor' || userType === 'nurse') && !termsData?.professionalDisclaimerAccepted) {
      throw new UnauthorizedException('Debe aceptar la exención de responsabilidad profesional');
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

      // Update user to clinic_owner role with terms acceptance
      await this.usersService.update(userId, {
        role: UserRole.CLINIC_OWNER,
        clinicId: clinic['_id'],
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        professionalDisclaimerAccepted: true,
        professionalDisclaimerAcceptedAt: new Date(),
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
    } else if (userType === 'nurse') {
      // Nurse registration for Histora Care
      if (!nurseData?.cepNumber) {
        throw new UnauthorizedException('El número de CEP es requerido para enfermeras');
      }

      // Check if CEP number is already in use
      const existingNurse = await this.nursesService.findByCepNumber(nurseData.cepNumber);
      if (existingNurse) {
        throw new UnauthorizedException('El número de CEP ya está registrado');
      }

      // Update user role to NURSE with terms acceptance
      await this.usersService.update(userId, {
        role: UserRole.NURSE,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        professionalDisclaimerAccepted: true,
        professionalDisclaimerAcceptedAt: new Date(),
      });

      // Create nurse profile
      const nurse = await this.nursesService.create(userId, {
        cepNumber: nurseData.cepNumber,
        specialties: nurseData.specialties || [],
      });

      // Generate new token with updated role
      const payload: JwtPayload = {
        sub: userId,
        email: user.email,
        role: UserRole.NURSE,
      };

      const refreshToken = this.generateRefreshToken();
      await this.saveRefreshToken(userId, refreshToken);

      this.logger.log(`Google user ${user.email} completed registration as nurse`);

      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: UserRole.NURSE,
          avatar: user.avatar,
        },
        nurseId: (nurse as { _id: { toString(): string } })._id.toString(),
      } as AuthResponse & { nurseId: string };
    } else {
      // Patient registration - Google users already have PATIENT role by default
      // Save terms acceptance
      await this.usersService.update(userId, {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      });

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

  /**
   * Step 1: Validate nurse credentials with CEP registry
   * Returns official name and photo for user confirmation
   */
  async validateNurseCep(dto: ValidateNurseCepDto): Promise<{
    isValid: boolean;
    data?: {
      cepNumber: string;
      fullName?: string;
      dni: string;
      photoUrl?: string;
      isPhotoVerified: boolean;
    };
    error?: string;
  }> {
    this.logger.log(`Validating nurse CEP: DNI=${dto.dni}, CEP=${dto.cepNumber}`);

    // Clean inputs
    const cleanDni = dto.dni.replace(/\D/g, '');
    const cleanCep = dto.cepNumber.replace(/\D/g, '');

    // Validate DNI format
    if (!/^\d{8}$/.test(cleanDni)) {
      return {
        isValid: false,
        error: 'El DNI debe tener 8 dígitos',
      };
    }

    // Validate CEP format
    if (!/^\d{4,6}$/.test(cleanCep)) {
      return {
        isValid: false,
        error: 'El número de CEP debe tener entre 4 y 6 dígitos',
      };
    }

    // Check if DNI is already registered
    const existingUserByDni = await this.usersService.findByDni(cleanDni);
    if (existingUserByDni) {
      return {
        isValid: false,
        error: 'Este DNI ya está registrado en el sistema',
      };
    }

    // Check if CEP is already registered
    const existingNurse = await this.nursesService.findByCepNumber(cleanCep);
    if (existingNurse) {
      return {
        isValid: false,
        error: 'Este número de CEP ya está registrado',
      };
    }

    // Validate with CEP registry
    // First, check if photo exists (primary validation)
    const photoCheck = await this.cepValidationService.checkPhotoByDni(cleanDni);

    if (!photoCheck.exists) {
      return {
        isValid: false,
        error: 'No se encontró registro de enfermera(o) con este DNI en el CEP',
      };
    }

    // Search by CEP number to get the name
    const cepSearch = await this.cepValidationService.validateByCep(cleanCep);

    let fullName: string | undefined;
    if (cepSearch.isValid && cepSearch.data?.fullName) {
      fullName = cepSearch.data.fullName;
    }

    // If we couldn't find name by CEP, try to search by the CEP number itself
    if (!fullName) {
      const searchResults = await this.cepValidationService.searchByName(cleanCep);
      const exactMatch = searchResults.find(r => r.cep === cleanCep);
      if (exactMatch) {
        fullName = exactMatch.nombre;
      }
    }

    // If still no name, try RENIEC API to get name from DNI
    if (!fullName && this.reniecValidationService.isConfigured()) {
      this.logger.log(`CEP name not found, trying RENIEC lookup for DNI: ${cleanDni}`);
      const reniecResult = await this.reniecValidationService.validateDni(cleanDni);
      if (reniecResult.success && reniecResult.data) {
        // RENIEC returns: APELLIDO_PATERNO APELLIDO_MATERNO NOMBRES
        fullName = reniecResult.data.nombreCompleto;
        this.logger.log(`RENIEC lookup successful: ${fullName}`);
      } else {
        this.logger.warn(`RENIEC lookup failed: ${reniecResult.error}`);
      }
    }

    this.logger.log(`CEP validation successful: DNI=${cleanDni}, CEP=${cleanCep}, Name=${fullName || 'Not found'}`);

    return {
      isValid: true,
      data: {
        cepNumber: cleanCep,
        dni: cleanDni,
        fullName,
        photoUrl: photoCheck.url,
        isPhotoVerified: true,
      },
    };
  }

  /**
   * Step 2: Complete nurse registration after CEP validation
   * Creates user account and nurse profile
   */
  async completeNurseRegistration(dto: CompleteNurseRegistrationDto): Promise<AuthResponse & { nurseId: string; verificationStatus: string }> {
    this.logger.log(`Completing nurse registration: Email=${dto.email}, CEP=${dto.cepNumber}`);

    // Validate terms acceptance
    if (!dto.termsAccepted) {
      throw new UnauthorizedException('Debe aceptar los términos y condiciones');
    }
    if (!dto.professionalDisclaimerAccepted) {
      throw new UnauthorizedException('Debe aceptar la exención de responsabilidad profesional');
    }

    // Validate identity confirmation
    if (!dto.identityConfirmed) {
      throw new UnauthorizedException('Debe confirmar su identidad');
    }

    // Clean inputs
    const cleanDni = dto.dni.replace(/\D/g, '');
    const cleanCep = dto.cepNumber.replace(/\D/g, '');

    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Check if DNI is already registered
    const existingUserByDni = await this.usersService.findByDni(cleanDni);
    if (existingUserByDni) {
      throw new ConflictException('Este DNI ya está registrado en el sistema');
    }

    // Check if CEP is already registered
    const existingNurse = await this.nursesService.findByCepNumber(cleanCep);
    if (existingNurse) {
      throw new ConflictException('Este número de CEP ya está registrado');
    }

    // Re-validate with CEP registry to ensure data hasn't changed
    const photoCheck = await this.cepValidationService.checkPhotoByDni(cleanDni);
    if (!photoCheck.exists) {
      throw new UnauthorizedException('No se pudo verificar las credenciales con el CEP');
    }

    // Parse name from CEP registry
    const nameParts = this.parseFullName(dto.fullNameFromCep);

    // Create user with nurse role
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: dto.phone,
      dni: cleanDni,
      role: UserRole.NURSE,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      professionalDisclaimerAccepted: true,
      professionalDisclaimerAcceptedAt: new Date(),
    });

    // Determine verification status based on selfie
    // If selfie provided, mark as pending verification (admin will review)
    // If no selfie, mark as requiring selfie
    const verificationStatus = dto.selfieUrl ? 'pending' : 'selfie_required';

    // Create nurse profile with CEP data
    const nurseProfile = await this.nursesService.create(user['_id'].toString(), {
      cepNumber: cleanCep,
      specialties: dto.specialties || [],
      cepVerified: true, // Photo was verified with CEP
      officialCepPhotoUrl: dto.cepPhotoUrl,
      cepRegisteredName: dto.fullNameFromCep,
      selfieUrl: dto.selfieUrl,
      verificationStatus,
    });

    const nurseProfileId = (nurseProfile as any)._id;

    // Update user with nurseProfileId and avatar (use CEP photo as initial avatar)
    await this.usersService.update(user['_id'].toString(), {
      nurseProfileId,
      avatar: dto.cepPhotoUrl, // Use official CEP photo as avatar
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

    this.logger.log(`Nurse registered: ${user.email} with CEP: ${cleanCep}, Status: ${verificationStatus}`);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        role: user.role,
        avatar: dto.cepPhotoUrl,
      },
      nurseId: nurseProfileId.toString(),
      verificationStatus,
    };
  }

  /**
   * Parse a full name (usually "LASTNAME LASTNAME FIRSTNAME MIDDLENAME")
   * into firstName and lastName
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    if (parts.length === 2) {
      // Could be "LASTNAME FIRSTNAME" or "FIRSTNAME LASTNAME"
      // In Peru, CEP usually has "LASTNAME FIRSTNAME" format
      return { firstName: parts[1], lastName: parts[0] };
    }

    // For 3+ parts, assume first 2 are last names, rest are first names
    // e.g., "GARCIA LOPEZ MARIA ELENA" -> firstName: "MARIA ELENA", lastName: "GARCIA LOPEZ"
    const lastName = parts.slice(0, 2).join(' ');
    const firstName = parts.slice(2).join(' ');

    return { firstName, lastName };
  }
}
