import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({ where: { id: dto.event_id } });
        if (!event) throw new NotFoundException('Event not found');

        const bookedCount = await tx.booking.count({
          where: { eventId: dto.event_id },
        });
        if (bookedCount >= event.totalSeats) {
          throw new ConflictException('No seats available');
        }

        const booking = await tx.booking.create({
          data: {
            eventId: dto.event_id,
            userId: dto.user_id,
          },
        });

        return booking;
      });
    } catch (err) {
      throw err;
    }
  }
}
