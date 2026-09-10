import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { createContactMessage } from "@workspace/db";

const router: IRouter = Router();

function createMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
  });
}

router.post("/contact", async (req, res, next) => {
  const { nom, email, sujet, message } = req.body ?? {};

  if ([nom, email, sujet, message].some((value) => typeof value !== "string" || value.trim().length === 0)) {
    res.status(400).json({ error: "Tous les champs sont obligatoires." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: "Indiquez une adresse e-mail valide." });
    return;
  }

  try {
    const contact = { name: nom.trim(), email: email.trim(), subject: sujet.trim(), message: message.trim() };
    await createContactMessage(contact);
    const mailer = createMailer();
    const recipient = process.env.CONTACT_EMAIL ?? process.env.SMTP_USER;
    if (!mailer || !recipient) {
      res.status(503).json({ error: "Le service e-mail n'est pas encore configuré. Le message a été conservé dans l'espace d'administration." });
      return;
    }
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: recipient,
      replyTo: contact.email,
      subject: `[Portfolio] ${contact.subject}`,
      text: `Nom: ${contact.name}\nE-mail: ${contact.email}\n\n${contact.message}`,
      html: `<p><strong>Nom :</strong> ${contact.name}</p><p><strong>E-mail :</strong> ${contact.email}</p><p>${contact.message.replace(/\n/g, "<br>")}</p>`,
    });
    res.status(201).json({ status: "sent" });
  } catch (error) {
    next(error);
  }
});

export default router;