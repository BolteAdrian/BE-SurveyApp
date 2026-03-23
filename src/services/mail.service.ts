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
      from: '"Test Admin" <admin@surveyapp.com>',
      to,
      subject: `Invitație: ${surveyTitle}`,
      html: `
        <div style="font-family: monospace; background: #111; color: #eee; padding: 20px;">
          <h2>Salut!</h2>
          <p>Te invităm la sondajul: <b>${surveyTitle}</b></p>
          <a href="${inviteUrl}" style="color: #e9c46a;">Click aici pentru completare</a>
          
          <img src="${pixelUrl}" width="1" height="1" style="display:none !important;" alt="" />
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(
        "Email trimis la Ethereal! Vezi mesajul aici: %s",
        nodemailer.getTestMessageUrl(info),
      );
      return { success: true };
    } catch (error) {
      console.error("Eroare la trimitere:", error);
      return { success: false };
    }
  },
};
