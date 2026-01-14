import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nurse } from './schema/nurse.schema';
import { User } from '../users/schema/user.schema';
import { CepValidationService } from './cep-validation.service';
import { VerificationStatus } from './schema/nurse-verification.schema';

interface RevalidationResult {
  nurseId: string;
  cepNumber: string;
  isValid: boolean;
  error?: string;
}

interface NurseDocument extends Nurse {
  _id: Types.ObjectId;
}

@Injectable()
export class CepRevalidationScheduler {
  private readonly logger = new Logger(CepRevalidationScheduler.name);

  constructor(
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cepValidationService: CepValidationService,
  ) {}

  /**
   * Monthly CEP re-validation job
   * Runs on the 1st of every month at 3:00 AM (server time)
   * Checks all verified nurses' CEP status with the official registry
   */
  @Cron('0 3 1 * *') // At 3:00 AM on the 1st of every month
  async handleMonthlyRevalidation(): Promise<void> {
    this.logger.log('Starting monthly CEP re-validation job...');

    try {
      // Get all verified nurses
      const verifiedNurses = await this.nurseModel
        .find({
          cepVerified: true,
          isActive: true,
        })
        .populate('userId', 'firstName lastName email dni')
        .exec();

      this.logger.log(`Found ${verifiedNurses.length} verified nurses to revalidate`);

      if (verifiedNurses.length === 0) {
        this.logger.log('No nurses to revalidate. Job completed.');
        return;
      }

      const results: RevalidationResult[] = [];
      const failedNurses: NurseDocument[] = [];

      // Process each nurse with a small delay to avoid overwhelming the CEP server
      for (const nurse of verifiedNurses) {
        try {
          const nurseDoc = nurse as NurseDocument;
          const result = await this.revalidateNurse(nurseDoc);
          results.push(result);

          if (!result.isValid) {
            failedNurses.push(nurseDoc);
          }

          // Add a small delay between requests (2 seconds)
          await this.delay(2000);
        } catch (error) {
          const nurseDoc = nurse as NurseDocument;
          this.logger.error(`Error revalidating nurse ${nurseDoc._id}: ${error}`);
          results.push({
            nurseId: nurseDoc._id.toString(),
            cepNumber: nurseDoc.cepNumber,
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log summary
      const validCount = results.filter((r) => r.isValid).length;
      const invalidCount = results.filter((r) => !r.isValid).length;

      this.logger.log(
        `Monthly CEP re-validation completed. Valid: ${validCount}, Invalid: ${invalidCount}`,
      );

      // Handle failed validations
      if (failedNurses.length > 0) {
        await this.handleFailedValidations(failedNurses);
      }
    } catch (error) {
      this.logger.error(`Monthly CEP re-validation job failed: ${error}`);
    }
  }

  /**
   * Re-validate a single nurse's CEP credentials
   */
  private async revalidateNurse(nurse: NurseDocument): Promise<RevalidationResult> {
    const user = nurse.userId as unknown as { dni?: string };
    const dni = user?.dni;

    if (!dni) {
      this.logger.warn(`Nurse ${nurse._id} has no DNI on record, skipping`);
      return {
        nurseId: nurse._id.toString(),
        cepNumber: nurse.cepNumber,
        isValid: true, // Don't invalidate if we can't check
        error: 'No DNI on record',
      };
    }

    this.logger.debug(`Revalidating CEP ${nurse.cepNumber} for nurse ${nurse._id}`);

    const validation = await this.cepValidationService.validateNurse({
      cepNumber: nurse.cepNumber,
      dni,
    });

    return {
      nurseId: nurse._id.toString(),
      cepNumber: nurse.cepNumber,
      isValid: validation.isValid,
      error: validation.error,
    };
  }

  /**
   * Handle nurses whose CEP validation failed
   * Marks them as needing re-verification
   */
  private async handleFailedValidations(nurses: NurseDocument[]): Promise<void> {
    this.logger.log(`Processing ${nurses.length} nurses with failed CEP validation`);

    for (const nurse of nurses) {
      try {
        // Update nurse verification status
        await this.nurseModel.findByIdAndUpdate(nurse._id, {
          cepVerified: false,
          verificationStatus: VerificationStatus.PENDING,
          $set: {
            'cepRevalidationFailed': true,
            'cepRevalidationFailedAt': new Date(),
          },
        });

        this.logger.log(`Marked nurse ${nurse._id} (CEP: ${nurse.cepNumber}) as needing re-verification`);

        // TODO: Send notification to nurse about re-verification needed
        // TODO: Send notification to admin about failed validations

      } catch (error) {
        this.logger.error(`Failed to update nurse ${nurse._id}: ${error}`);
      }
    }
  }

  /**
   * Manual trigger for CEP re-validation (for testing or admin use)
   */
  async triggerManualRevalidation(): Promise<{
    processed: number;
    valid: number;
    invalid: number;
    errors: string[];
  }> {
    this.logger.log('Manual CEP re-validation triggered');

    const verifiedNurses = await this.nurseModel
      .find({
        cepVerified: true,
        isActive: true,
      })
      .populate('userId', 'firstName lastName email dni')
      .exec();

    const results: RevalidationResult[] = [];
    const errors: string[] = [];

    for (const nurse of verifiedNurses) {
      try {
        const nurseDoc = nurse as NurseDocument;
        const result = await this.revalidateNurse(nurseDoc);
        results.push(result);

        if (!result.isValid && result.error) {
          errors.push(`CEP ${nurseDoc.cepNumber}: ${result.error}`);
        }

        await this.delay(2000);
      } catch (error) {
        const nurseDoc = nurse as NurseDocument;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`CEP ${nurseDoc.cepNumber}: ${errorMsg}`);
      }
    }

    return {
      processed: results.length,
      valid: results.filter((r) => r.isValid).length,
      invalid: results.filter((r) => !r.isValid).length,
      errors,
    };
  }

  /**
   * Re-validate a single nurse by ID (for admin use)
   */
  async revalidateSingleNurse(nurseId: string): Promise<RevalidationResult> {
    const nurse = await this.nurseModel
      .findById(nurseId)
      .populate('userId', 'firstName lastName email dni')
      .exec();

    if (!nurse) {
      throw new Error('Nurse not found');
    }

    return this.revalidateNurse(nurse as NurseDocument);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
