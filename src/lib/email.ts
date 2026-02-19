import { Resend } from "resend";
import { generateQRCodeDataURL } from "./qr";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendQREmailParams {
  to: string;
  firstName: string;
  lastName: string;
  qrToken: string;
}

export async function sendQREmail({ to, firstName, lastName, qrToken }: SendQREmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const scanUrl = `${appUrl}/api/verify/${qrToken}`;
  const qrDataUrl = await generateQRCodeDataURL(scanUrl);

  // Extract base64 data from data URL
  const base64Data = qrDataUrl.split(",")[1];

  const { data, error } = await resend.emails.send({
    from: "Event Registration <onboarding@resend.dev>",
    to: [to],
    subject: "Your Event Pass — QR Code Enclosed",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',Times,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a1a;padding:40px 48px;text-align:center;">
              <h1 style="margin:0;color:#e4a44e;font-size:28px;font-weight:400;letter-spacing:3px;text-transform:uppercase;">
                Exclusive Event
              </h1>
              <div style="width:60px;height:1px;background-color:#e4a44e;margin:16px auto;"></div>
              <p style="margin:0;color:#b0b0b0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
                Your Personal Invitation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="margin:0 0 24px;color:#1a1a1a;font-size:18px;line-height:1.6;">
                Dear <strong>${firstName} ${lastName}</strong>,
              </p>
              <p style="margin:0 0 32px;color:#4f4f4f;font-size:16px;line-height:1.8;">
                Thank you for registering. Your exclusive event pass is ready. Please present the QR code below at the entrance for expedited check-in.
              </p>

              <!-- QR Code -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:32px;background-color:#fdf8ef;border:1px solid #f4dbb2;border-radius:4px;">
                    <img src="cid:qrcode" alt="Your QR Code" width="250" height="250" style="display:block;border:8px solid #ffffff;box-shadow:0 2px 12px rgba(0,0,0,0.06);" />
                    <p style="margin:20px 0 0;color:#888888;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                      Scan for entry
                    </p>
                  </td>
                </tr>
              </table>

              <div style="margin:32px 0;padding:24px;background-color:#f6f6f6;border-left:3px solid #e4a44e;border-radius:0 4px 4px 0;">
                <p style="margin:0;color:#4f4f4f;font-size:14px;line-height:1.6;">
                  <strong style="color:#1a1a1a;">Important:</strong> This QR code is unique to you. Please do not share it with others. Screenshot this email for easy access at the venue.
                </p>
              </div>

              <p style="margin:0;color:#888888;font-size:14px;line-height:1.6;text-align:center;">
                We look forward to welcoming you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a1a;padding:32px 48px;text-align:center;">
              <p style="margin:0;color:#888888;font-size:12px;line-height:1.6;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    attachments: [
      {
        filename: "qrcode.png",
        content: base64Data,
        contentType: "image/png",
      },
    ],
    headers: {
      "X-Entity-Ref-ID": qrToken,
    },
  });

  if (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
