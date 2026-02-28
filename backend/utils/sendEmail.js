import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify the connection first
  try {
    await transporter.verify();
  } catch (verifyError) {
    throw verifyError;
  }

  // Define the email options
  const mailOptions = {
    from: `K-Chat App <${process.env.EMAIL_USERNAME}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // Actually send the email
  const info = await transporter.sendMail(mailOptions);
};
