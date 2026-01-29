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
import {
  getTokenExpiration,
  generateSessionInfo,
  SessionInfo,
} from './config/session.config';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
  };
  session?: SessionInfo;
}

export interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean; // Indicates if user needs to complete registration
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Legacy token expiry durations (kept for backwards compatibility)
  // Now using role-based configuration from session.config.ts
  private readonly SHORT_REFRESH_TOKEN_DAYS = 1;
  private readonly LONG_REFRESH_TOKEN_DAYS = 30;
  private readonly SHORT_ACCESS_TOKEN_EXPIRY = '1h';
  private readonly LONG_ACCESS_TOKEN_EXPIRY = '7d';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private nursesService: NursesService,
    private cepValidationService: CepValidationService,
    private reniecValidationService: ReniecValidationService,
    private accountLockoutService: AccountLockoutService,
    private emailProvider: EmailProvider,
    private notificationsService: NotificationsService,
  ) {}

  private readonly RESET_TOKEN_EXPIRY_HOURS = 24;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 5;

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    expiryDays: number | boolean = this.SHORT_REFRESH_TOKEN_DAYS,
  ): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date();

    // Handle backwards compatibility: if boolean is passed, convert to days
    let days: number;
    if (typeof expiryDays === 'boolean') {
      days = expiryDays ? this.LONG_REFRESH_TOKEN_DAYS : this.SHORT_REFRESH_TOKEN_DAYS;
    } else {
      days = expiryDays;
    }

    expiresAt.setDate(expiresAt.getDate() + days);

    await this.usersService.update(userId, {
      refreshToken: hashedToken,
      refreshTokenExpires: expiresAt,
    });
  }

  // Note: Legacy doctor/clinic registration removed - Histora Care only supports patient and nurse registration

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

    // Get role-based token expiration
    const tokenExpiration = getTokenExpiration(UserRole.PATIENT, false);

    // Generate JWT token with role-based expiration
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
    };

    // Generate and save refresh token with role-based expiration
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(
      user['_id'].toString(),
      refreshToken,
      tokenExpiration.refreshTokenDays,
    );

    // Generate session info for frontend
    const sessionInfo = generateSessionInfo(UserRole.PATIENT, false);

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
      access_token: this.jwtService.sign(payload, { expiresIn: tokenExpiration.accessTokenExpiry as any }),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      session: sessionInfo,
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

    // Get role-based token expiration
    const tokenExpiration = getTokenExpiration(UserRole.NURSE, false);

    // Generate JWT token with role-based expiration
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      nurseId: nurseProfileId.toString(),
    };

    // Generate and save refresh token with role-based expiration
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(
      user['_id'].toString(),
      refreshToken,
      tokenExpiration.refreshTokenDays,
    );

    // Generate session info for frontend
    const sessionInfo = generateSessionInfo(UserRole.NURSE, false);

    this.logger.log(`Nurse registered: ${user.email} with CEP: ${registerDto.cepNumber}`);

    // Notify admins about new nurse registration (async, don't block)
    this.notificationsService.notifyAdminNewNurseRegistered({
      id: user['_id'].toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cepNumber: registerDto.cepNumber,
    }).catch(err => {
      this.logger.error(`Failed to notify admins about new nurse: ${err.message}`);
    });

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: tokenExpiration.accessTokenExpiry as any }),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      session: sessionInfo,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const email = loginDto.email.toLowerCase();

    // Check if account is locked due to too many failed attempts
    const lockStatus = await this.accountLockoutService.isLocked(email);
    if (lockStatus.isLocked) {
      const minutes = Math.ceil(lockStatus.remainingTime / 60);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutes} minuto${minutes !== 1 ? 's' : ''}.`,
      );
    }

    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      // Record failed attempt even for non-existent users (prevents user enumeration)
      await this.accountLockoutService.recordFailedAttempt(email);
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
      const result = await this.accountLockoutService.recordFailedAttempt(email);
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
    await this.accountLockoutService.recordSuccessfulLogin(email);

    // Update last login
    await this.usersService.updateLastLogin(user['_id'].toString());

    const rememberMe = loginDto.rememberMe || false;

    // Get nurseId if user is a nurse
    let nurseId: string | undefined;
    if (user.role === UserRole.NURSE && user.nurseProfileId) {
      nurseId = user.nurseProfileId.toString();
    }

    // Get role-based token expiration
    const tokenExpiration = getTokenExpiration(user.role, rememberMe);

    // Generate JWT token with role-based expiry
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      nurseId,
    };

    // Generate and save refresh token with role-based expiry
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(
      user['_id'].toString(),
      refreshToken,
      tokenExpiration.refreshTokenDays,
    );

    // Generate session info for frontend
    const sessionInfo = generateSessionInfo(user.role, rememberMe);

    this.logger.log(
      `Login successful for ${user.email} (${user.role}), ` +
      `access token expires in ${tokenExpiration.accessTokenExpiry}, ` +
      `refresh token expires in ${tokenExpiration.refreshTokenDays} days`,
    );

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: tokenExpiration.accessTokenExpiry as any }),
      refresh_token: refreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      session: sessionInfo,
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

    // Get role-based token expiration (default to no rememberMe for refresh)
    const tokenExpiration = getTokenExpiration(user.role, false);

    // Get nurseId if user is a nurse
    let nurseId: string | undefined;
    if (user.role === UserRole.NURSE && user.nurseProfileId) {
      nurseId = user.nurseProfileId.toString();
    }

    // Generate new tokens with role-based expiration
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      nurseId,
    };

    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(
      user['_id'].toString(),
      newRefreshToken,
      tokenExpiration.refreshTokenDays,
    );

    // Generate session info for frontend
    const sessionInfo = generateSessionInfo(user.role, false);

    this.logger.log(
      `Token refreshed for ${user.email} (${user.role}), ` +
      `new access token expires in ${tokenExpiration.accessTokenExpiry}`,
    );

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: tokenExpiration.accessTokenExpiry as any }),
      refresh_token: newRefreshToken,
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      session: sessionInfo,
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

  async forgotPassword(email: string, platform?: 'histora-front' | 'histora-care'): Promise<{ message: string }> {
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

    // Build reset link based on platform
    let resetLink: string;
    let appName: string;

    if (platform === 'histora-care') {
      // Histora Care (NurseLite) uses regular routing
      const careUrl = this.configService.get<string>('CARE_FRONTEND_URL', 'https://care.historahealth.com');
      resetLink = `${careUrl}/auth/reset-password?token=${resetToken}`;
      appName = 'NurseLite';
    } else {
      // Histora Front uses hash routing
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
      resetLink = `${frontendUrl}/#/authentication/reset-password?token=${resetToken}`;
      appName = 'Histora';
    }

    // Send email
    const emailHtml = this.emailProvider.getPasswordResetTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      resetLink,
      expiresIn: '24 horas',
    });

    await this.emailProvider.send({
      to: email,
      subject: `Recuperar Contraseña - ${appName}`,
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

  // ============= OTP-based Password Recovery =============

  private generateOtp(): string {
    // Generate a 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestPasswordResetOtp(email: string, platform?: 'histora-front' | 'histora-care'): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('No existe una cuenta con este correo electrónico');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Set expiry time (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Save OTP to database (stored as plain text since it's short-lived)
    await this.usersService.setPasswordResetOtp(email, otp, expiresAt);

    // Determine app name based on platform
    const appName = platform === 'histora-care' ? 'NurseLite' : 'Histora';

    // Send email with OTP
    const emailHtml = this.getOtpEmailTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      otp,
      expiresIn: `${this.OTP_EXPIRY_MINUTES} minutos`,
      appName,
    });

    await this.emailProvider.send({
      to: email,
      subject: `Código de Verificación - ${appName}`,
      html: emailHtml,
    });

    this.logger.log(`Password reset OTP sent to ${email}`);

    return {
      message: 'Se ha enviado un código de verificación a tu correo electrónico',
    };
  }

  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
    const user = await this.usersService.findByPasswordResetOtp(email, otp);

    if (!user) {
      // Increment failed attempts
      const attempts = await this.usersService.incrementOtpAttempts(email);

      if (attempts >= this.MAX_OTP_ATTEMPTS) {
        // Clear OTP after too many attempts
        const userToBlock = await this.usersService.findByEmail(email);
        if (userToBlock) {
          await this.usersService.clearPasswordResetOtp(userToBlock['_id'].toString());
        }
        throw new UnauthorizedException('Demasiados intentos fallidos. Solicita un nuevo código.');
      }

      throw new UnauthorizedException(`Código inválido o expirado. ${this.MAX_OTP_ATTEMPTS - attempts} intentos restantes.`);
    }

    return {
      valid: true,
      message: 'Código verificado correctamente',
    };
  }

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetOtp(email, otp);

    if (!user) {
      throw new UnauthorizedException('Código inválido o expirado');
    }

    // Update password
    await this.usersService.updatePassword(user['_id'].toString(), newPassword);

    // Clear OTP
    await this.usersService.clearPasswordResetOtp(user['_id'].toString());

    this.logger.log(`Password reset via OTP for ${email}`);

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente',
    };
  }

  private getOtpEmailTemplate(data: { userName: string; otp: string; expiresIn: string; appName: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #6366f1; font-size: 28px; font-weight: 700;">${data.appName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Código de Verificación</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Hola ${data.userName},
              </p>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:
              </p>
              <!-- OTP Code Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <span style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #6366f1; font-family: 'Courier New', monospace;">${data.otp}</span>
              </div>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Este código expirará en <strong>${data.expiresIn}</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.5;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${data.appName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
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
        avatar: user.avatar,
      },
    };
  }

  /**
   * Complete registration for new Google users who need to select their role
   * Histora Care only supports patient and nurse registration
   */
  async completeGoogleRegistration(
    userId: string,
    userType: 'patient' | 'nurse',
    nurseData?: {
      cepNumber: string;
      specialties?: string[];
      location?: { coordinates: number[]; city: string; district: string; address?: string };
      serviceRadius?: number;
    },
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

    // Validate professional disclaimer for nurses
    if (userType === 'nurse' && !termsData?.professionalDisclaimerAccepted) {
      throw new UnauthorizedException('Debe aceptar la exención de responsabilidad profesional');
    }

    if (userType === 'nurse') {
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

      // Create nurse profile with location
      const nurseCreateData: {
        cepNumber: string;
        specialties: string[];
        location?: {
          type: string;
          coordinates: number[];
          city: string;
          district: string;
          address?: string;
        };
        serviceRadius?: number;
      } = {
        cepNumber: nurseData.cepNumber,
        specialties: nurseData.specialties || [],
      };

      // Add location if provided
      if (nurseData.location) {
        nurseCreateData.location = {
          type: 'Point',
          coordinates: nurseData.location.coordinates,
          city: nurseData.location.city,
          district: nurseData.location.district,
          address: nurseData.location.address,
        };
        nurseCreateData.serviceRadius = nurseData.serviceRadius || 10;
      }

      const nurse = await this.nursesService.create(userId, nurseCreateData);

      // Generate new token with updated role
      const payload: JwtPayload = {
        sub: userId,
        email: user.email,
        role: UserRole.NURSE,
      };

      const refreshToken = this.generateRefreshToken();
      await this.saveRefreshToken(userId, refreshToken);

      this.logger.log(`Google user ${user.email} completed registration as nurse`);

      // Notify admins about new nurse registration
      await this.notificationsService.notifyAdminNewNurseRegistered({
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        cepNumber: nurseData.cepNumber,
      });

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

    // Create nurse profile with CEP data and location
    const nurseProfile = await this.nursesService.create(user['_id'].toString(), {
      cepNumber: cleanCep,
      specialties: dto.specialties || [],
      cepVerified: true, // Photo was verified with CEP
      officialCepPhotoUrl: dto.cepPhotoUrl,
      cepRegisteredName: dto.fullNameFromCep,
      selfieUrl: dto.selfieUrl,
      verificationStatus,
      // Location data (required)
      location: {
        type: 'Point',
        coordinates: dto.location.coordinates,
        city: dto.location.city,
        district: dto.location.district,
        address: dto.location.address,
      },
      serviceRadius: dto.serviceRadius,
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

    // Notify admins about new nurse registration (async, don't block)
    this.notificationsService.notifyAdminNewNurseRegistered({
      id: user['_id'].toString(),
      email: user.email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      cepNumber: cleanCep,
    }).catch(err => {
      this.logger.error(`Failed to notify admins about new nurse: ${err.message}`);
    });

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
