import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
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
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterPatientDto, RegisterNurseDto, CompleteGoogleRegistrationDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUser } from './strategies/google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly mobileScheme: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    this.mobileScheme = this.configService.get<string>('MOBILE_APP_SCHEME') || 'historacare';
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo médico/clínica' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register/patient')
  @ApiOperation({ summary: 'Registrar nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  registerPatient(@Body() registerDto: RegisterPatientDto): Promise<AuthResponse> {
    return this.authService.registerPatient(registerDto);
  }

  @Public()
  @Post('register/nurse')
  @ApiOperation({ summary: 'Registrar nueva enfermera (Histora Care)' })
  @ApiResponse({ status: 201, description: 'Enfermera registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o CEP ya registrado' })
  registerNurse(@Body() registerDto: RegisterNurseDto): Promise<AuthResponse> {
    return this.authService.registerNurse(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT token' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({ status: 200, description: 'Token refrescado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refresh(refreshTokenDto);
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

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Email de recuperación enviado' })
  @ApiResponse({ status: 404, description: 'Email no registrado' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
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
    try {
      // Parse state to determine platform (mobile or web)
      let platform = 'web';
      const stateParam = req.query.state as string;
      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          platform = state.platform || 'web';
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
        // Redirect to web frontend
        res.redirect(`${this.frontendUrl}/#/auth/google/callback?${params.toString()}`);
      }
    } catch {
      // Handle error based on platform
      const stateParam = req.query.state as string;
      let platform = 'web';
      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          platform = state.platform || 'web';
        } catch {
          // Invalid state
        }
      }

      if (platform === 'mobile') {
        res.redirect(`${this.mobileScheme}://oauth/callback?error=google_auth_failed`);
      } else {
        res.redirect(`${this.frontendUrl}/#/authentication/signin?error=google_auth_failed`);
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('google/complete-registration')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Completar registro de usuario de Google (seleccionar tipo)' })
  @ApiResponse({ status: 200, description: 'Registro completado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async completeGoogleRegistration(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CompleteGoogleRegistrationDto,
  ): Promise<AuthResponse> {
    return this.authService.completeGoogleRegistration(
      user.userId,
      dto.userType,
      dto.userType === 'doctor' ? { clinicName: dto.clinicName!, clinicPhone: dto.clinicPhone } : undefined,
      dto.userType === 'nurse' ? { cepNumber: dto.cepNumber!, specialties: dto.specialties } : undefined,
      { termsAccepted: dto.termsAccepted, professionalDisclaimerAccepted: dto.professionalDisclaimerAccepted },
    );
  }
}
