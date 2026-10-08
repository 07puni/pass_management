import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const notificationEmailValue = process.env.NOTIFICATION_EMAIL;
const fromEmailValue = process.env.RESEND_FROM_EMAIL;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is not defined");
}

if (!notificationEmailValue) {
  throw new Error("NOTIFICATION_EMAIL is not defined");
}

if (!fromEmailValue) {
  throw new Error("RESEND_FROM_EMAIL is not defined");
}

const notificationEmail: string = notificationEmailValue;
const fromEmail: string = fromEmailValue;

const resend = new Resend(apiKey);

export async function sendExpiryReminder({
  name,
  vehicleNumber,
  phoneNumber,
  endDate,
}: {
  name: string | null;
  vehicleNumber: string | null;
  phoneNumber: string | null;
  endDate: Date | null;
}) {
  if (!endDate) {
    throw new Error(
      "End date is required for expiry reminder"
    );
  }

  const formattedDate = endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [notificationEmail],
    subject: `Pass Expiry Reminder - ${
      vehicleNumber || name || "Pass"
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Pass Expiry Reminder</h2>

        <p>
          The following pass will expire in 2 days:
        </p>

        <p>
          <strong>Pass Holder:</strong>
          ${name || "Not provided"}
        </p>

        <p>
          <strong>Vehicle Number:</strong>
          ${vehicleNumber || "Not provided"}
        </p>

        <p>
          <strong>Phone Number:</strong>
          ${phoneNumber || "Not provided"}
        </p>

        <p>
          <strong>Valid Until:</strong>
          ${formattedDate}
        </p>

        <p>
          Please take the necessary action.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(
      error.message || "Failed to send expiry reminder"
    );
  }

  return data;
}
