import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema()
export class Patient {
  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  birthDate?: string;

  @Prop()
  gender?: string;

  @Prop({ unique: true })
  email?: string;

  @Prop()
  phone?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
