import { HttpException, HttpStatus } from '@nestjs/common';

interface SendGridError {
  response?: {
    body?: {
      errors?: Array<{
        message: string;
        field?: string;
      }>;
    };
  };
}

export class EmailException extends HttpException {
  constructor(message: string, originalError?: SendGridError) {
    const errorMessage =
      originalError?.response?.body?.errors?.[0]?.message || message;
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Error enviando email: ${errorMessage}`,
        error: 'Email Error',
        details: originalError?.response?.body?.errors || null,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
