import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findtop10(@Query('kind') kind: 'day' | 'week' | 'month') {
    return await this.bookingsService.findTop10(kind);
  }

  @Post()
  async create(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.create(dto);
    return {
      id: booking.id,
      event_id: booking.eventId,
      user_id: booking.userId,
      created_at: booking.createdAt,
    };
  }
}
