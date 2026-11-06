import nodemailer from "nodemailer";
import type { EmailMessage } from "@/modules/quality/domain/nc-notification";

export type SendResult = { sent: true } | { sent: false; reason: string };

export interface Mailer {
  send(message: EmailMessage): Promise<SendResult>;
}

/**
 * SMTP mailer configured through SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * and optionally SMTP_SECURE ("true" for port 465). Never throws: failures are reported in the result.
 */
export class SmtpMailer implements Mailer {
  async send(message: EmailMessage): Promise<SendResult> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env;
    if (!SMTP_HOST || !SMTP_FROM) {
      return { sent: false, reason: "Envio de e-mail não configurado (SMTP_HOST/SMTP_FROM ausentes)." };
    }
    const port = parseInt(SMTP_PORT ?? "587", 10);
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      });
      await transporter.sendMail({
        from: SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: a.base64,
          encoding: "base64",
          cid: a.cid,
        })),
      });
      return { sent: true };
    } catch (error) {
      console.error("Falha ao enviar e-mail:", error);
      return { sent: false, reason: "Falha no servidor de e-mail." };
    }
  }
}

export const defaultMailer: Mailer = new SmtpMailer();
