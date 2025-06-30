import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
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

    // Update the data model in database
    const updatedDataModel = await prisma.dataModel.update({
      where: { id: params.id },
      data: {
        name,
        modelType,
        description,
        schema,
        isActive: isActive ?? true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedDataModel);
  } catch (error) {
    console.error('Error updating data model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the data model from database
    await prisma.dataModel.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Data model deleted successfully' });
  } catch (error) {
    console.error('Error deleting data model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 