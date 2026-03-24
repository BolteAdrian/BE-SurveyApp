import config from "../config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

export const mailService = {
  sendInvitation: async (
    to: string,
    surveyTitle: string,
    inviteUrl: string,
  ) => {
    const url = new URL(inviteUrl);
    const rawToken = url.searchParams.get("t");

    const pixelUrl = `${config.backendURL}/t/open/${rawToken}.png`;

    const mailOptions = {
      from: config.mail.from,
      to,
      subject: `Invitație: ${surveyTitle}`,
      html: `
        <div style="font-family: sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="background: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
            <h2 style="color: #333;">Salut!</h2>
            <p style="font-size: 16px; color: #555;">Te invităm să participi la sondajul: <b style="color: #000;">${surveyTitle}</b></p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${inviteUrl}" style="background: #e9c46a; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Completează Sondajul
              </a>
            </div>
            <p style="font-size: 12px; color: #999;">Dacă butonul nu funcționează, accesează: ${inviteUrl}</p>
          </div>
          <img src="${pixelUrl}" width="1" height="1" style="display:none !important;" alt="" />
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email trimis cu succes către ${to} via Brevo!`);
      return { success: true };
    } catch (error) {
      console.error("❌ Eroare la trimitere email:", error);
      return { success: false };
    }
  },
};
