import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  console.log("Email config:", {
    user: process.env.EMAIL_USERNAME,
    passLength: process.env.EMAIL_PASSWORD?.length,
    passPreview: process.env.EMAIL_PASSWORD?.substring(0, 4) + "...",
  });

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
    console.log("SMTP connection verified successfully");
  } catch (verifyError) {
    console.error("SMTP verification failed:", verifyError.message);
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
  console.log("Email sent successfully:", info.messageId);
};
