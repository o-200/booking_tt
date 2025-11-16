import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findTop10(kind: string) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (kind) {
      case 'day': {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 1);

        break;
      }
      case 'week': {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;

        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 7);

        break;
      }
      case 'month': {
        const year = now.getFullYear();
        const month = now.getMonth();

        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 1);

        break;
      }
    }

    return await this.prisma.booking.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            totalSeats: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async create(dto: CreateBookingDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: dto.event_id },
        });
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
