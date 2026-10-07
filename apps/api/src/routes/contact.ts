import { Router } from "express";
import { createContactMessage } from "@workspace/db";
import { createMailer, escapeHtml, getMailFrom } from "../lib/mailer.js";

const router = Router();

router.post("/contact", async (req: any, res: any, next: any) => {
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
    const sender = getMailFrom();
    if (!mailer || !recipient || !sender) {
      res.status(503).json({ error: "Le service e-mail n'est pas encore configuré. Le message a été conservé dans l'espace d'administration." });
      return;
    }
    await mailer.sendMail({
      from: sender,
      to: recipient,
      replyTo: contact.email,
      subject: `[Portfolio] ${contact.subject}`,
      text: `Nom: ${contact.name}\nE-mail: ${contact.email}\n\n${contact.message}`,
      html: `<p><strong>Nom :</strong> ${escapeHtml(contact.name)}</p><p><strong>E-mail :</strong> ${escapeHtml(contact.email)}</p><p>${escapeHtml(contact.message).replace(/\r?\n/g, "<br>")}</p>`,
    });
    res.status(201).json({ status: "sent" });
  } catch (error) {
    next(error);
  }
});

export default router;