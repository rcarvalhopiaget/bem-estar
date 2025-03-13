import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    // Configura o cookie de sessão
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao configurar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao configurar sessão' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Remove o cookie de sessão
    cookies().delete('session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao remover sessão' },
      { status: 500 }
    );
  }
} 