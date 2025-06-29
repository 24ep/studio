import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const dataModels = await prisma.dataModel.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(dataModels);
  } catch (error) {
    console.error('Error fetching data models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { name, modelType, description, schema, isActive } = body;
    if (!name || !modelType) {
      return NextResponse.json(
        { error: 'Name and modelType are required' },
        { status: 400 }
      );
    }
    const newDataModel = await prisma.dataModel.create({
      data: {
        name,
        modelType,
        description,
        schema,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json(newDataModel, { status: 201 });
  } catch (error) {
    console.error('Error creating data model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 