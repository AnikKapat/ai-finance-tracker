  "use server";

  import { Resend } from "resend";

  export async function sendEmail({ to, subject, react }) {
    const resend = new Resend(process.env.RESEND_API_KEY || "");

    try {
  console.log("Sending email to:", to);

  const data = await resend.emails.send({
    from: "Finance App <onboarding@resend.dev>",
    to,
    subject,
    react,
  });

  console.log("Resend response:", data);

  return { success: true, data };
} catch (error) {
  console.error("Failed to send email:", error);
  throw error;
}
  }
