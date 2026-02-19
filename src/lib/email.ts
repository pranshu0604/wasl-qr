import nodemailer from "nodemailer";
import { generateQRCodeDataURL } from "./qr";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

  const base64Data = qrDataUrl.split(",")[1];

  await transporter.sendMail({
    from: `"Exclusive Event" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${firstName}, your event pass is ready`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Pass</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">

          <!-- Top brand bar -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;color:#e4a44e;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">
                Exclusive Event
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:linear-gradient(160deg,#1c1c1c 0%,#141414 100%);border-radius:20px;overflow:hidden;border:1px solid #2a2a2a;">

              <!-- Header gradient band -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#e4a44e 0%,#c8832a 50%,#e4a44e 100%);padding:36px 40px;text-align:center;">
                    <h1 style="margin:0 0 6px;color:#0f0f0f;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                      Registration Confirmed
                    </h1>
                    <p style="margin:0;color:rgba(0,0,0,0.6);font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">
                      Your Event Pass is Ready
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px 0;">
                    <p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">
                      Welcome,
                    </p>
                    <h2 style="margin:0 0 16px;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">
                      ${firstName} ${lastName}
                    </h2>
                    <p style="margin:0;color:#7a7a7a;font-size:15px;line-height:1.7;">
                      Your exclusive event pass has been generated. Show this QR code at the entrance for instant check-in.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px;">
                    <div style="height:1px;background:linear-gradient(to right,transparent,#2e2e2e,transparent);"></div>
                  </td>
                </tr>
              </table>

              <!-- QR Code section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 40px 36px;">

                    <!-- QR card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(228,164,78,0.3),0 20px 60px rgba(0,0,0,0.5);">
                      <tr>
                        <td style="padding:28px 28px 16px;text-align:center;">
                          <img src="cid:qrcode" alt="Event QR Code" width="220" height="220" style="display:block;border-radius:8px;" />
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#fafafa;padding:14px 28px;text-align:center;border-top:1px solid #f0f0f0;">
                          <p style="margin:0;color:#999999;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                            Scan to Check In
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Gold badge -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                      <tr>
                        <td style="background:rgba(228,164,78,0.1);border:1px solid rgba(228,164,78,0.3);border-radius:100px;padding:8px 20px;">
                          <p style="margin:0;color:#e4a44e;font-size:12px;font-weight:600;letter-spacing:0.5px;">
                            Valid Entry Pass
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Warning box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 40px 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(228,164,78,0.06);border:1px solid rgba(228,164,78,0.2);border-radius:12px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 4px;color:#e4a44e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                            Important Notice
                          </p>
                          <p style="margin:0;color:#7a7a7a;font-size:13px;line-height:1.7;">
                            This QR code is <strong style="color:#ffffff;">unique to you</strong> and valid for one entry only. Do not share it with others. Screenshot or save this email for easy access at the venue.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <p style="margin:0 0 6px;color:#3a3a3a;font-size:12px;">
                We look forward to seeing you at the event.
              </p>
              <p style="margin:0;color:#2a2a2a;font-size:11px;">
                This is an automated message — please do not reply.
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
        content: Buffer.from(base64Data, "base64"),
        cid: "qrcode",
      },
    ],
  });
}
