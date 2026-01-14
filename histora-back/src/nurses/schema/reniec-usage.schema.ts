import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ReniecUsage extends Document {
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ default: 0 })
  queryCount: number;

  @Prop({ default: 100 })
  queryLimit: number;

  @Prop({ type: [{ dni: String, timestamp: Date, success: Boolean }], default: [] })
  queries: Array<{
    dni: string;
    timestamp: Date;
    success: boolean;
  }>;
}

export const ReniecUsageSchema = SchemaFactory.createForClass(ReniecUsage);

// Compound index for year-month lookup
ReniecUsageSchema.index({ year: 1, month: 1 }, { unique: true });
