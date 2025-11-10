// src/bookings/bookings.service.spec.ts
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: { $transaction: jest.Mock };

  beforeAll(() => {
    if (!(Prisma as any).PrismaClientKnownRequestError) {
      (Prisma as any).PrismaClientKnownRequestError =
        class PrismaClientKnownRequestError extends Error {
          code: string;
          constructor(message: string, code?: string) {
            super(message);
            this.code = code ?? 'P2002';
          }
        };
    }
  });

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a booking when seats available', async () => {
    const dto = { event_id: 1, user_id: 42 };

    const mockEvent = { id: 1, name: 'E', totalSeats: 2 };
    const mockTx = {
      event: { findUnique: jest.fn().mockResolvedValue(mockEvent) },
      booking: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 10,
          eventId: 1,
          userId: 42,
          createdAt: new Date(),
        }),
      },
    };

    prisma.$transaction.mockImplementation((cb: any) => cb(mockTx));

    const res = await service.create(dto);

    expect(mockTx.event.findUnique).toHaveBeenCalledWith({
      where: { id: dto.event_id },
    });
    expect(mockTx.booking.count).toHaveBeenCalledWith({
      where: { eventId: dto.event_id },
    });
    expect(mockTx.booking.create).toHaveBeenCalledWith({
      data: { eventId: dto.event_id, userId: dto.user_id },
    });

    expect(res).toHaveProperty('id', 10);
    expect(res).toHaveProperty('userId', 42);
  });

  it('throws NotFoundException when event not found', async () => {
    const dto = { event_id: 999, user_id: 1 };

    const mockTx = {
      event: { findUnique: jest.fn().mockResolvedValue(null) },
      booking: { count: jest.fn(), create: jest.fn() },
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(mockTx));

    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockTx.event.findUnique).toHaveBeenCalledWith({
      where: { id: dto.event_id },
    });
    expect(mockTx.booking.count).not.toHaveBeenCalled();
  });

  it('throws ConflictException when no seats available', async () => {
    const dto = { event_id: 2, user_id: 2 };

    const mockEvent = { id: 2, name: 'Full', totalSeats: 1 };
    const mockTx = {
      event: { findUnique: jest.fn().mockResolvedValue(mockEvent) },
      booking: { count: jest.fn().mockResolvedValue(1), create: jest.fn() },
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(mockTx));

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(mockTx.booking.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when unique constraint (P2002) occurs', async () => {
    const dto = { event_id: 1, user_id: 42 };

    const err = Object.assign(new Error('unique constraint'), {
      code: 'P2002',
    });
    prisma.$transaction.mockRejectedValue(err);

    await expect(service.create(dto)).rejects.toBeInstanceOf(Error);
  });

  it('throws InternalServerErrorException on unknown error', async () => {
    const dto = { event_id: 1, user_id: 42 };
    prisma.$transaction.mockRejectedValue(new Error('boom'));

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      Error,
    );
  });
});
