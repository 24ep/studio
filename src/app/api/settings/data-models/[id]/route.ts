import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock data models (same as in the main route)
const mockDataModels = [
  {
    id: '1',
    name: 'Candidate Profile',
    modelType: 'Candidate',
    description: 'Standard candidate data model with personal and professional information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        email: { type: 'string', format: 'email', required: true },
        phone: { type: 'string' },
        experience: { type: 'number' },
        skills: { type: 'array', items: { type: 'string' } }
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Job Position',
    modelType: 'Position',
    description: 'Job position data model with requirements and details',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', required: true },
        department: { type: 'string', required: true },
        description: { type: 'string' },
        requirements: { type: 'array', items: { type: 'string' } },
        salary: { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } } }
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'User Profile',
    modelType: 'User',
    description: 'User profile data model for system users',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        email: { type: 'string', format: 'email', required: true },
        role: { type: 'string', enum: ['Admin', 'Recruiter', 'Manager'] },
        permissions: { type: 'array', items: { type: 'string' } }
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

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

    // Find the data model to update
    const dataModelIndex = mockDataModels.findIndex(dm => dm.id === params.id);
    if (dataModelIndex === -1) {
      return NextResponse.json(
        { error: 'Data model not found' },
        { status: 404 }
      );
    }

    // Update the data model
    mockDataModels[dataModelIndex] = {
      ...mockDataModels[dataModelIndex],
      name,
      modelType,
      description,
      schema,
      isActive: isActive ?? true,
      updatedAt: new Date()
    };

    return NextResponse.json(mockDataModels[dataModelIndex]);
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

    // Find the data model to delete
    const dataModelIndex = mockDataModels.findIndex(dm => dm.id === params.id);
    if (dataModelIndex === -1) {
      return NextResponse.json(
        { error: 'Data model not found' },
        { status: 404 }
      );
    }

    // Remove the data model
    const deletedDataModel = mockDataModels.splice(dataModelIndex, 1)[0];

    return NextResponse.json({ message: 'Data model deleted successfully' });
  } catch (error) {
    console.error('Error deleting data model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 