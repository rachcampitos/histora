import { Controller, Post, Body, Get, Patch, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthResponse } from './auth.service';
import { CookieService } from './services/cookie.service';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto, RegisterNurseDto, CompleteGoogleRegistrationDto, ValidateNurseCepDto, CompleteNurseRegistrationDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto, RequestPasswordOtpDto, VerifyPasswordOtpDto, ResetPasswordWithOtpDto } from './dto/reset-password.dto';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUser } from './strategies/google.strategy';
import { getTokenExpiration } from './config/session.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly mobileScheme: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    this.mobileScheme = this.configService.get<string>('MOBILE_APP_SCHEME') || 'historacare';
  }

  /**
   * Helper to set auth cookies and return response
   * Tokens are sent both in cookies (for web) and body (for mobile)
   */
  private setAuthCookiesAndRespond(
    res: Response,
    authResponse: AuthResponse,
    role: string,
    rememberMe = false,
  ): AuthResponse {
    const tokenExpiration = getTokenExpiration(role as any, rememberMe);
    const accessTokenMs = this.cookieService.parseExpiryToMs(tokenExpiration.accessTokenExpiry);

    this.cookieService.setAuthCookies(
      res,
      authResponse.access_token,
      authResponse.refresh_token,
      accessTokenMs,
      tokenExpiration.refreshTokenDays,
    );

    return authResponse;
  }

  // Note: Legacy doctor/clinic registration endpoint removed - Histora Care only supports patient and nurse registration

  @Public()
  @Post('register/patient')
  @ApiOperation({ summary: 'Registrar nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async registerPatient(
    @Body() registerDto: RegisterPatientDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.registerPatient(registerDto);
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role);
  }

  @Public()
  @Post('register/nurse')
  @ApiOperation({ summary: 'Registrar nueva enfermera (Histora Care) - Método tradicional' })
  @ApiResponse({ status: 201, description: 'Enfermera registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o CEP ya registrado' })
  async registerNurse(
    @Body() registerDto: RegisterNurseDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.registerNurse(registerDto);
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role);
  }

  // ============= SIMPLIFIED NURSE REGISTRATION (2-Step Flow) =============

  @Public()
  @Post('register/nurse/validate-cep')
  @ApiOperation({
    summary: 'Paso 1: Validar credenciales de enfermera con CEP',
    description: 'Valida DNI y CEP con el registro oficial del Colegio de Enfermeros del Perú. Retorna nombre y foto oficial para confirmación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validación exitosa, retorna datos del CEP',
    schema: {
      properties: {
        isValid: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            cepNumber: { type: 'string' },
            fullName: { type: 'string' },
            dni: { type: 'string' },
            photoUrl: { type: 'string' },
            isPhotoVerified: { type: 'boolean' },
          },
        },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'DNI o CEP inválido' })
  validateNurseCep(@Body() dto: ValidateNurseCepDto) {
    return this.authService.validateNurseCep(dto);
  }

  @Public()
  @Post('register/nurse/complete')
  @ApiOperation({
    summary: 'Paso 2: Completar registro de enfermera',
    description: 'Después de validar con CEP y confirmar identidad, completa el registro con email, contraseña y selfie opcional.',
  })
  @ApiResponse({ status: 201, description: 'Enfermera registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o no confirmó identidad' })
  @ApiResponse({ status: 409, description: 'Email, DNI o CEP ya registrado' })
  async completeNurseRegistration(
    @Body() dto: CompleteNurseRegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = await this.authService.completeNurseRegistration(dto);
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT token' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.login(loginDto);
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role, loginDto.rememberMe);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token refrescado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    // Try to get refresh token from cookie if not provided in body
    const refreshToken = refreshTokenDto.refresh_token || this.cookieService.getRefreshTokenFromCookies(req);
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const authResponse = await this.authService.refresh({ refresh_token: refreshToken });
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario actual' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar sesión (invalidar refresh token)' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear HttpOnly cookies
    this.cookieService.clearAuthCookies(res);
    return this.authService.logout(user.userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Email de recuperación enviado' })
  @ApiResponse({ status: 404, description: 'Email no registrado' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email, forgotPasswordDto.platform);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token (método link)' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  // ============= OTP-based Password Recovery =============

  @Public()
  @Post('password-reset/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar código OTP para recuperar contraseña' })
  @ApiResponse({ status: 200, description: 'Código OTP enviado al email' })
  @ApiResponse({ status: 404, description: 'Email no registrado' })
  requestPasswordOtp(@Body() dto: RequestPasswordOtpDto) {
    return this.authService.requestPasswordResetOtp(dto.email, dto.platform);
  }

  @Public()
  @Post('password-reset/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP' })
  @ApiResponse({ status: 200, description: 'Código verificado correctamente' })
  @ApiResponse({ status: 401, description: 'Código inválido o expirado' })
  verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('password-reset/reset-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con código OTP' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'Código inválido o expirado' })
  resetPasswordWithOtp(@Body() dto: ResetPasswordWithOtpDto) {
    return this.authService.resetPasswordWithOtp(dto.email, dto.otp, dto.newPassword);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar login con Google' })
  @ApiResponse({ status: 302, description: 'Redirige a Google para autenticación' })
  googleAuth() {
    console.log('Google Auth endpoint hit - should redirect to Google');
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ): Promise<void> {
    // Allowed frontend origins for security
    const allowedOrigins = [
      'https://app.historahealth.com',
      'https://care.historahealth.com',
      'http://localhost:4200',
      'http://localhost:8100',
    ];

    try {
      // Parse state to determine platform and redirectUri
      let platform = 'web';
      let redirectUri = '';
      const stateParam = req.query.state as string;
      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          platform = state.platform || 'web';
          redirectUri = state.redirectUri || '';
        } catch {
          // Invalid state, default to web
        }
      }

      const authResponse = await this.authService.googleLogin(req.user);

      // Build redirect URL params
      const params = new URLSearchParams({
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        user: JSON.stringify(authResponse.user),
        is_new_user: authResponse.isNewUser ? 'true' : 'false',
      });

      // Redirect based on platform
      if (platform === 'mobile') {
        // Redirect to mobile app using deep link
        res.redirect(`${this.mobileScheme}://oauth/callback?${params.toString()}`);
      } else {
        // For web: use redirectUri if provided and allowed, otherwise use default frontendUrl
        let targetUrl = this.frontendUrl;
        if (redirectUri) {
          try {
            const redirectUrl = new URL(redirectUri);
            const origin = redirectUrl.origin;
            if (allowedOrigins.includes(origin)) {
              // Use the provided redirect URI (callback path)
              res.redirect(`${redirectUri}?${params.toString()}`);
              return;
            }
          } catch {
            // Invalid URL, use default
          }
        }
        // Default: redirect to main frontend with hash routing
        res.redirect(`${targetUrl}/#/auth/google/callback?${params.toString()}`);
      }
    } catch {
      // Handle error based on platform
      const stateParam = req.query.state as string;
      let platform = 'web';
      let redirectUri = '';
      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          platform = state.platform || 'web';
          redirectUri = state.redirectUri || '';
        } catch {
          // Invalid state
        }
      }

      if (platform === 'mobile') {
        res.redirect(`${this.mobileScheme}://oauth/callback?error=google_auth_failed`);
      } else {
        // For web errors: try to redirect back to the original frontend
        if (redirectUri) {
          try {
            const redirectUrl = new URL(redirectUri);
            const origin = redirectUrl.origin;
            if (allowedOrigins.includes(origin)) {
              res.redirect(`${origin}/auth/login?error=google_auth_failed`);
              return;
            }
          } catch {
            // Invalid URL, use default
          }
        }
        res.redirect(`${this.frontendUrl}/#/authentication/signin?error=google_auth_failed`);
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('google/complete-registration')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Completar registro de usuario de Google (seleccionar tipo: patient o nurse)' })
  @ApiResponse({ status: 200, description: 'Registro completado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async completeGoogleRegistration(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CompleteGoogleRegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    // Only patient and nurse registration supported in Histora Care
    const userType = dto.userType === 'nurse' ? 'nurse' : 'patient';

    const authResponse = await this.authService.completeGoogleRegistration(
      user.userId,
      userType,
      userType === 'nurse'
        ? {
            cepNumber: dto.cepNumber!,
            specialties: dto.specialties,
            location: dto.location,
            serviceRadius: dto.serviceRadius,
          }
        : undefined,
      { termsAccepted: dto.termsAccepted, professionalDisclaimerAccepted: dto.professionalDisclaimerAccepted },
    );
    return this.setAuthCookiesAndRespond(res, authResponse, authResponse.user.role);
  }
}
