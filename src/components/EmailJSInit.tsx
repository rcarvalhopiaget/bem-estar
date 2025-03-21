'use client';

import { useEffect } from 'react';
import emailjs from '@emailjs/browser';

// EmailJS Public Key - Recomendado usar variáveis de ambiente
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_EMAILJS_TEMPLATE_ID';

export function EmailJSInit() {
  useEffect(() => {
    // Inicializar EmailJS
    if (typeof window !== 'undefined') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      console.log('EmailJS inicializado com a chave:', EMAILJS_PUBLIC_KEY);
    }
  }, []);

  return null;
}

// Função para enviar email usando EmailJS - APENAS PARA USO NO LADO DO CLIENTE
export const sendEmailWithEmailJS = async (to: string, subject: string, message: string) => {
  if (typeof window === 'undefined') {
    console.error('EmailJS só pode ser usado no lado do cliente');
    return { success: false, message: 'EmailJS só pode ser usado no lado do cliente' };
  }

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        subject: subject,
        message: message,
        from_name: 'Sistema Bem-Estar',
      }
    );
    
    console.log('Email enviado com sucesso via EmailJS:', response);
    return { success: true, message: 'Email enviado com sucesso' };
  } catch (error) {
    console.error('Erro ao enviar email via EmailJS:', error);
    return { success: false, message: 'Erro ao enviar email' };
  }
};
