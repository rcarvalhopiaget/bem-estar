import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { enviarRelatorioDiario } from '@/services/emailService';

/**
 * API para agendar o envio de relatórios diários
 * Esta API é chamada por um cron job para enviar relatórios diários
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataParam = searchParams.get('data');
    
    // Se não for fornecida uma data, usar a data atual
    const dataRelatorio = dataParam 
      ? new Date(dataParam) 
      : new Date();
    
    // Formatar a data para YYYY-MM-DD
    const dataFormatada = dataRelatorio.toISOString().split('T')[0];
    
    // Buscar todos os alunos
    const alunosRef = collection(db, 'alunos');
    const alunosSnapshot = await getDocs(alunosRef);
    const alunos = alunosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      nome: doc.data().nome || '',
      turma: doc.data().turma || ''
    }));
    
    // Buscar as refeições do dia
    const refeicoesRef = collection(db, 'refeicoes');
    const dataInicio = new Date(dataFormatada);
    const dataFim = new Date(dataFormatada);
    dataFim.setDate(dataFim.getDate() + 1);
    
    const refeicoesQuery = query(
      refeicoesRef,
      where('data', '>=', Timestamp.fromDate(dataInicio)),
      where('data', '<', Timestamp.fromDate(dataFim))
    );
    
    const refeicoesSnapshot = await getDocs(refeicoesQuery);
    const refeicoes = refeicoesSnapshot.docs.map(doc => ({
      id: doc.id,
      alunoId: doc.data().alunoId,
      data: doc.data().data.toDate()
    }));
    
    // Mapear os IDs dos alunos que comeram
    const alunosQueComeram = new Set(refeicoes.map(r => r.alunoId));
    
    // Separar alunos que comeram e não comeram
    const alunosComeram = alunos
      .filter(aluno => alunosQueComeram.has(aluno.id))
      .map(aluno => ({ nome: aluno.nome, turma: aluno.turma }));
    
    const alunosNaoComeram = alunos
      .filter(aluno => !alunosQueComeram.has(aluno.id))
      .map(aluno => ({ nome: aluno.nome, turma: aluno.turma }));
    
    // Preparar dados para o relatório
    const dadosRelatorio = {
      data: dataFormatada,
      totalAlunos: alunos.length,
      totalComeram: alunosComeram.length,
      totalNaoComeram: alunosNaoComeram.length,
      alunosComeram,
      alunosNaoComeram
    };
    
    // Enviar o relatório por email
    await enviarRelatorioDiario(dadosRelatorio);
    
    return NextResponse.json({
      success: true,
      message: 'Relatório enviado com sucesso',
      data: {
        dataRelatorio: dataFormatada,
        totalAlunos: alunos.length,
        totalComeram: alunosComeram.length,
        totalNaoComeram: alunosNaoComeram.length
      }
    });
  } catch (error: any) {
    console.error('Erro ao agendar relatório:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao agendar relatório: ${error.message}`,
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
