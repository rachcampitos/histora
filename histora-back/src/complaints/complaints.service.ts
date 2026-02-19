import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Complaint, ComplaintDocument, ComplaintStatus } from './complaints.schema';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    @InjectModel(Complaint.name)
    private complaintModel: Model<ComplaintDocument>,
  ) {}

  async create(
    userId: string,
    userRole: string,
    dto: CreateComplaintDto,
  ): Promise<Complaint> {
    const claimNumber = await this.generateClaimNumber();

    const complaint = new this.complaintModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      userRole,
      claimNumber,
      relatedServiceId: dto.relatedServiceId
        ? new Types.ObjectId(dto.relatedServiceId)
        : undefined,
      status: ComplaintStatus.PENDING,
    });

    const saved = await complaint.save();
    this.logger.log(`Complaint ${claimNumber} created by user ${userId}`);
    return saved;
  }

  async findByUser(userId: string): Promise<Complaint[]> {
    return this.complaintModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<Complaint[]> {
    return this.complaintModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async respond(
    complaintId: string,
    dto: RespondComplaintDto,
  ): Promise<Complaint> {
    const complaint = await this.complaintModel.findById(complaintId);
    if (!complaint) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    complaint.response = dto.response;
    complaint.respondedAt = new Date();
    complaint.status = ComplaintStatus.RESOLVED;

    const saved = await complaint.save();
    this.logger.log(`Complaint ${complaint.claimNumber} responded`);
    return saved;
  }

  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.complaintModel.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `LR-${year}-${sequence}`;
  }
}
