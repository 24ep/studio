import { NextResponse } from 'next/server';
import { z } from 'zod';

type PrismaLikeError = {
  code?: string;
  meta?: {
    target?: string[];
    field_name?: string;
  };
};

function isPrismaLikeError(error: unknown): error is PrismaLikeError {
  return Boolean(error && typeof error === 'object' && 'code' in error);
}

export function applicantEvaluationErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.errors },
      { status: 400 }
    );
  }

  if (!isPrismaLikeError(error)) {
    return null;
  }

  if (error.code === 'P2002') {
    const target = error.meta?.target || [];
    if (target.includes('traitId') || target.includes('evaluationId')) {
      return NextResponse.json(
        { error: 'Failed to update evaluation', message: 'Duplicate personality trait scores detected. Please ensure each trait is only scored once.' },
        { status: 400 }
      );
    }
    if (target.includes('skillId')) {
      return NextResponse.json(
        { error: 'Failed to update evaluation', message: 'Duplicate expertise skill scores detected. Please ensure each skill is only scored once.' },
        { status: 400 }
      );
    }
  }

  if (error.code === 'P2003') {
    const field = error.meta?.field_name || 'unknown';
    if (field.includes('traitId') || field.includes('personality')) {
      return NextResponse.json(
        { error: 'Failed to update personality traits', message: 'One or more personality traits are invalid or no longer exist' },
        { status: 400 }
      );
    }
    if (field.includes('skillId') || field.includes('expertise')) {
      return NextResponse.json(
        { error: 'Failed to update expertise skills', message: 'One or more expertise skills are invalid or no longer exist' },
        { status: 400 }
      );
    }
  }

  return null;
}
