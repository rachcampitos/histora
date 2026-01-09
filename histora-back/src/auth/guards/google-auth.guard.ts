import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('GoogleAuthGuard.canActivate() called');
    try {
      const activate = super.canActivate(context);
      this.logger.log('super.canActivate called, waiting for result...');
      const result = (await activate) as boolean;
      this.logger.log(`canActivate result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error('Google Auth Guard error:', error);
      throw error;
    }
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser | false, info: unknown): TUser {
    this.logger.log(`handleRequest called - err: ${err}, user: ${!!user}, info: ${JSON.stringify(info)}`);
    if (err) {
      this.logger.error('Google Auth handleRequest error:', err);
      throw err;
    }
    // If user is false/null (e.g., user cancelled OAuth flow), throw error
    if (!user) {
      this.logger.warn('Google Auth cancelled or failed - no user returned');
      throw new UnauthorizedException('Google authentication cancelled or failed');
    }
    return user as TUser;
  }
}
