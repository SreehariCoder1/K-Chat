export const sendEmail = async (options) => {
  const SCRIPT_URL =
    process.env.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxE_iAIWSOhcrfp7PcaRZfqmiewHZqvEf9GuQb6D4H21iPGaqciGak7cHvirXWWcibM/exec";

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  const rawText = await response.text();
  try {
    const data = JSON.parse(rawText);
    if (data.error) {
      throw new Error(data.error);
    }
  } catch (e) {
    if (!response.ok) {
      throw new Error(
        `Email sending failed with status ${response.status}: ${rawText}`,
        { cause: e },
      );
    }
  }
};
