const nodemailer = require("nodemailer");
const config = require("./config");
const { emailsSent } = require("./metrics");

function createNotifier() {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: config.smtpUser
      ? {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      : undefined
  });

  async function sendNewReleaseEmail(to, repository, tag) {
    await transporter.sendMail({
      from: config.smtpFrom,
      to,
      subject: `New release for ${repository}: ${tag}`,
      text: `Repository ${repository} has a new release: ${tag}`,
      html: `<p>Repository <b>${repository}</b> has a new release: <b>${tag}</b></p>`
    });
    emailsSent.inc();
  }

  return { sendNewReleaseEmail };
}

module.exports = { createNotifier };
