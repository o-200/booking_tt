import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy {

  private logger = new Logger('DB');

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    this.$on('query', (event: Prisma.QueryEvent) => {
      this.logger.log(event.query + ` (${event.duration}ms)`)
    });
    await this.$connect();
    this.logger.log('Prisma database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database disconnected');
  }
}
