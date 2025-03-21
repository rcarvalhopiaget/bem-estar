/**
 * Cloud Functions para o sistema Bem-Estar
 * Implementação de funções para envio de emails e gerenciamento de configurações
 */

import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";

// Inicializa o Firebase Admin
admin.initializeApp();

// Configuração do Firestore
const db = admin.firestore();

// Obtém a senha do email das configurações
const emailPassword = functions.config().email?.password;

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jpiaget.develop@gmail.com",
    // Usa a senha configurada via firebase functions:config:set
    pass: emailPassword,
  },
});

/**
 * Função para enviar email
 */
export const sendEmail = onCall({ maxInstances: 10 }, async (request) => {
  try {
    const data = request.data;
    
    if (!data.to || !data.subject) {
      throw new Error("Email e assunto são obrigatórios");
    }

    const mailOptions = {
      from: "Sistema Bem-Estar <jpiaget.develop@gmail.com>",
      to: data.to,
      subject: data.subject,
      text: data.text || "",
      html: data.html || "",
      attachments: data.attachments || [],
    };

    logger.info("Enviando email para:", data.to);
    await transporter.sendMail(mailOptions);
    logger.info("Email enviado com sucesso para:", data.to);

    return { success: true, message: "Email enviado com sucesso" };
  } catch (error) {
    logger.error("Erro ao enviar email:", error);
    throw new Error(`Erro ao enviar email: ${error}`);
  }
});

/**
 * Função para salvar a configuração de envio de relatório
 */
export const saveReportConfig = onCall({ maxInstances: 10 }, async (request) => {
  try {
    const { email, horario, ativo } = request.data;
    
    if (!email) {
      throw new Error("Email é obrigatório");
    }

    // Salva a configuração no Firestore
    await db.collection("configuracoes").doc("relatorio").set({
      email,
      horario: horario || "18:00",
      ativo: ativo || false,
      ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Configuração de relatório salva com sucesso:", { email, horario, ativo });
    return { success: true, message: "Configuração salva com sucesso" };
  } catch (error) {
    logger.error("Erro ao salvar configuração de relatório:", error);
    throw new Error(`Erro ao salvar configuração: ${error}`);
  }
});

/**
 * Função para obter a configuração de envio de relatório
 */
export const getReportConfig = onCall({ maxInstances: 10 }, async () => {
  try {
    const configDoc = await db.collection("configuracoes").doc("relatorio").get();
    
    if (!configDoc.exists) {
      return {
        email: "",
        horario: "18:00",
        ativo: false,
      };
    }

    const data = configDoc.data();
    return {
      email: data?.email || "",
      horario: data?.horario || "18:00",
      ativo: data?.ativo || false,
    };
  } catch (error) {
    logger.error("Erro ao obter configuração de relatório:", error);
    throw new Error(`Erro ao obter configuração: ${error}`);
  }
});

/**
 * Função agendada para enviar relatório diário
 * Será implementada em uma versão futura
 */
// export const enviarRelatorioDiario = onSchedule("every day 18:00", async () => {
//   // Implementação do envio automático de relatório diário
// });
