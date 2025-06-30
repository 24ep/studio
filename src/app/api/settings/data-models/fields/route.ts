import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCandidateFields, getPositionFields, getUserFields } from '@/lib/dataModelUtils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('type');

    if (!modelType) {
      return NextResponse.json(
        { error: 'Model type is required' },
        { status: 400 }
      );
    }

    let fields;
    switch (modelType.toLowerCase()) {
      case 'candidate':
        fields = await getCandidateFields();
        break;
      case 'position':
        fields = await getPositionFields();
        break;
      case 'user':
        fields = await getUserFields();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid model type. Must be candidate, position, or user' },
          { status: 400 }
        );
    }

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching data model fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 