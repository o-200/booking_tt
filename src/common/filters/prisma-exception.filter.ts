import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const e = exception as any;

    const code =
      e?.code ??
      e?.originalError?.code ??
      (typeof e?.message === 'string' && e.message.includes('P2002') ? 'P2002' : undefined) ??
      (e?.constructor?.name === 'PrismaClientKnownRequestError' ? e?.code : undefined);

    if (code === 'P2002') {
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource unique error',
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
