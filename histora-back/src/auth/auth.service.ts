import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterPatientDto } from './dto/register.dto';
import { UserRole } from '../users/schema/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    clinicId?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
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

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId?.toString(),
      },
    };
  }

  async registerPatient(registerDto: RegisterPatientDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
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

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await this.usersService.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user['_id'].toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId?.toString(),
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (user && (await this.usersService.comparePasswords(password, user.password))) {
      const { password: _, ...result } = user.toObject();
      return result;
    }

    return null;
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }
}
