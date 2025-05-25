
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '../../../lib/prisma'; // Changed to relative path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const department = searchParams.get('department');

    const whereClause: any = {};
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (department) whereClause.department = { contains: department, mode: 'insensitive' };
    
    const positions = await prisma.position.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      }
    });
    
    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json({ message: "Error fetching positions", error: (error as Error).message }, { status: 500 });
  }
}

const createPositionSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional(),
  isOpen: z.boolean({ required_error: "isOpen status is required" }),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing JSON body for new position:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createPositionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const validatedData = validationResult.data;

  try {
    const newPosition = await prisma.position.create({
      data: {
        title: validatedData.title,
        department: validatedData.department,
        description: validatedData.description || '',
        isOpen: validatedData.isOpen,
      },
    });

    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
    return NextResponse.json({ message: "Error creating position", error: (error as Error).message }, { status: 500 });
  }
}
