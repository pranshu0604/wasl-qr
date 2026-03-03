/**
 * Bulk import attendees from an Excel file, register them in the system,
 * and send QR emails. Resumable — tracks status in a "ImportStatus" column
 * in the source Excel so re-runs skip already-completed rows.
 *
 * Usage:
 *   npx tsx scripts/import-excel.ts <path-to-excel>
 *   npx tsx scripts/import-excel.ts ref/Wasl_Employees_Suhoor_Gathering2026-03-02_07_31_43.xlsx
 *
 * Optional flags:
 *   --dry-run       Parse and validate only, no writes or emails
 *   --skip-email    Import to DB but don't send emails (marks as "imported", not "done")
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import ExcelJS from "exceljs";
import path from "path";

// ---------------------------------------------------------------------------
// We can't import from @/lib/* with tsx directly, so we inline the necessary
// functions that call the same APIs the app uses.
// ---------------------------------------------------------------------------

// ---- QR generation (same as src/lib/qr.ts) ----
import QRCode from "qrcode";

async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 2, width: 300 });
}

// ---- SendGrid email (same shape as src/lib/email.ts) ----
async function sendQREmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  qrToken: string;
}): Promise<void> {
  const { to, firstName, lastName, qrToken } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const scanUrl = `${appUrl}/api/verify/${qrToken}`;
  const qrDataUrl = await generateQRCodeDataURL(scanUrl);
  const base64Data = qrDataUrl.split(",")[1];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Event Pass</title></head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:48px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
<tr><td align="center" style="padding-bottom:32px;"><p style="margin:0;color:#e4a44e;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Wasl Suhoor Gathering</p></td></tr>
<tr><td style="background:linear-gradient(160deg,#1c1c1c 0%,#141414 100%);border-radius:20px;overflow:hidden;border:1px solid #2a2a2a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#e4a44e 0%,#c8832a 50%,#e4a44e 100%);padding:36px 40px;text-align:center;">
<h1 style="margin:0 0 6px;color:#0f0f0f;font-size:32px;font-weight:800;letter-spacing:-0.5px;">Registration Confirmed</h1>
<p style="margin:0;color:rgba(0,0,0,0.6);font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Your Event Pass is Ready</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 40px 0;">
<p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Welcome,</p>
<h2 style="margin:0 0 16px;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">${firstName} ${lastName}</h2>
<p style="margin:0;color:#7a7a7a;font-size:15px;line-height:1.7;">Your Suhoor Gathering pass has been generated. Show this QR code at the entrance for instant check-in.</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 40px;"><div style="height:1px;background:linear-gradient(to right,transparent,#2e2e2e,transparent);"></div></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 40px 36px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(228,164,78,0.3),0 20px 60px rgba(0,0,0,0.5);">
<tr><td style="padding:28px 28px 16px;text-align:center;"><img src="cid:qrcode" alt="Event QR Code" width="220" height="220" style="display:block;border-radius:8px;" /></td></tr>
<tr><td style="background:#fafafa;padding:14px 28px;text-align:center;border-top:1px solid #f0f0f0;"><p style="margin:0;color:#999999;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Scan to Check In</p></td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background:rgba(228,164,78,0.1);border:1px solid rgba(228,164,78,0.3);border-radius:100px;padding:8px 20px;">
<p style="margin:0;color:#e4a44e;font-size:12px;font-weight:600;letter-spacing:0.5px;">Valid Entry Pass</p>
</td></tr></table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(228,164,78,0.06);border:1px solid rgba(228,164,78,0.2);border-radius:12px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 4px;color:#e4a44e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Important Notice</p>
<p style="margin:0;color:#7a7a7a;font-size:13px;line-height:1.7;">This QR code is <strong style="color:#ffffff;">unique to you</strong> and valid for one entry only. Do not share it with others. Screenshot or save this email for easy access at the venue.</p>
</td></tr></table>
</td></tr></table>
</td></tr>
<tr><td style="padding:32px 0;text-align:center;">
<p style="margin:0 0 6px;color:#3a3a3a;font-size:12px;">We look forward to seeing you at the Suhoor Gathering.</p>
<p style="margin:0;color:#2a2a2a;font-size:11px;">This is an automated message — please do not reply.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDER_EMAIL, name: "Wasl Suhoor Gathering" },
      subject: `${firstName}, your Suhoor Gathering pass is ready`,
      content: [{ type: "text/html", value: html }],
      attachments: [{
        content: base64Data,
        filename: "qrcode.png",
        type: "image/png",
        disposition: "inline",
        content_id: "qrcode",
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid ${res.status}: ${text}`);
  }
}

// ---- Graph API helpers (same as src/lib/graph-auth.ts + db.ts) ----
async function getGraphToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  if (!res.ok) throw new Error(`Graph auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function getSiteId(): Promise<string> {
  const token = await getGraphToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_HOST!}:${process.env.SHAREPOINT_SITE_PATH!}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Site lookup failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

function getEncodedFilePath(): string {
  return process.env.SHAREPOINT_FILE_PATH!
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

async function downloadExcel(): Promise<Buffer> {
  const siteId = await getSiteId();
  const token = await getGraphToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${getEncodedFilePath()}:/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadExcel(data: Buffer): Promise<void> {
  const siteId = await getSiteId();
  const token = await getGraphToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${getEncodedFilePath()}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      body: data,
    }
  );
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

// ---- SharePoint DB: find by email, create attendee ----

const SP_COLUMNS = [
  "id", "firstName", "lastName", "email", "phone", "company",
  "designation", "qrToken", "checkedIn", "checkedInAt", "source",
  "createdAt", "updatedAt",
] as const;

const HEADER_ALIASES: Record<string, string> = {
  id: "id", firstname: "firstName", "first name": "firstName",
  lastname: "lastName", "last name": "lastName", email: "email",
  phone: "phone", "phone number": "phone", mobile: "phone",
  "mobile number": "phone", company: "company", designation: "designation",
  qrtoken: "qrToken", qr_token: "qrToken", checkedin: "checkedIn",
  "checked in": "checkedIn", checkedinat: "checkedInAt", source: "source",
  createdat: "createdAt", updatedat: "updatedAt",
};

interface SPAttendee {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; company: string; designation: string; qrToken: string;
  checkedIn: string; checkedInAt: string; source: string;
  createdAt: string; updatedAt: string;
}

async function loadSharePointAttendees(): Promise<Map<string, SPAttendee>> {
  const buf = await downloadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet in SharePoint file");

  const colMap = new Map<string, number>();
  ws.getRow(1).eachCell((cell, colNum) => {
    const raw = String(cell.value ?? "").trim().toLowerCase();
    const field = HEADER_ALIASES[raw];
    if (field) colMap.set(field, colNum);
  });

  const attendees = new Map<string, SPAttendee>();
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const get = (f: string) => {
      const c = colMap.get(f);
      return c ? (row.getCell(c).text?.trim() || "") : "";
    };
    const email = get("email").toLowerCase();
    if (!email) return;
    attendees.set(email, {
      id: get("id"), firstName: get("firstName"), lastName: get("lastName"),
      email, phone: get("phone"), company: get("company"),
      designation: get("designation"), qrToken: get("qrToken"),
      checkedIn: get("checkedIn"), checkedInAt: get("checkedInAt"),
      source: get("source"), createdAt: get("createdAt"), updatedAt: get("updatedAt"),
    });
  });
  return attendees;
}

function attendeeRow(a: SPAttendee): string[] {
  return SP_COLUMNS.map((c) => (a as Record<string, string>)[c] ?? "");
}

async function saveSharePointAttendees(attendees: Map<string, SPAttendee>): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Attendees");
  ws.addRow([...SP_COLUMNS]);
  const sorted = [...attendees.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const a of sorted) ws.addRow(attendeeRow(a));
  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  await uploadExcel(buf);
}

// ---------------------------------------------------------------------------
// Main import logic
// ---------------------------------------------------------------------------

const STATUS_COL_HEADER = "ImportStatus";

// Status values:
//   ""           = not processed yet
//   "imported"   = created in SharePoint DB (email not yet sent)
//   "done"       = created + email sent
//   "existing"   = was already in DB, email sent
//   "error:..."  = something failed

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const skipEmail = args.includes("--skip-email");

  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-excel.ts <path-to-excel> [--dry-run] [--skip-email]");
    process.exit(1);
  }

  // Validate env
  for (const key of ["SENDGRID_API_KEY", "SENDER_EMAIL", "NEXT_PUBLIC_APP_URL",
    "AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET",
    "SHAREPOINT_SITE_HOST", "SHAREPOINT_SITE_PATH", "SHAREPOINT_FILE_PATH"]) {
    if (!process.env[key]) {
      console.error(`Missing env var: ${key}`);
      process.exit(1);
    }
  }

  const absPath = path.resolve(filePath);
  console.log(`\nReading: ${absPath}`);
  if (dryRun) console.log("  (DRY RUN — no writes)");
  if (skipEmail) console.log("  (SKIP EMAIL — import only)");

  // 1. Read the source Excel
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(absPath);
  const ws = wb.worksheets[0];
  if (!ws) { console.error("No worksheet found"); process.exit(1); }

  // Find or create ImportStatus column
  let statusCol = 0;
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell, colNum) => {
    if (String(cell.value ?? "").trim() === STATUS_COL_HEADER) {
      statusCol = colNum;
    }
  });
  if (statusCol === 0) {
    statusCol = ws.columnCount + 1;
    headerRow.getCell(statusCol).value = STATUS_COL_HEADER;
  }

  // Find column indexes for fields we need
  const colIdx: Record<string, number> = {};
  headerRow.eachCell((cell, colNum) => {
    const raw = String(cell.value ?? "").trim().toLowerCase();
    if (raw === "full name") colIdx.fullName = colNum;
    if (raw === "email id" || raw === "email") colIdx.email = colNum;
    if (raw === "first name" || raw === "firstname") colIdx.firstName = colNum;
    if (raw === "last name" || raw === "lastname") colIdx.lastName = colNum;
  });

  if (!colIdx.email) {
    console.error("Could not find 'Email ID' or 'Email' column in the Excel file");
    process.exit(1);
  }
  if (!colIdx.fullName && !colIdx.firstName) {
    console.error("Could not find 'Full Name' or 'First Name' column in the Excel file");
    process.exit(1);
  }

  // 2. Load existing attendees from SharePoint
  console.log("\nLoading existing attendees from SharePoint...");
  const spAttendees = await loadSharePointAttendees();
  console.log(`  Found ${spAttendees.size} existing attendees\n`);

  // 3. Process each row
  const total = ws.rowCount - 1; // exclude header
  let imported = 0, emailed = 0, skippedDone = 0, skippedExisting = 0, errors = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const currentStatus = String(row.getCell(statusCol).value ?? "").trim();

    // Skip already-done rows
    if (currentStatus === "done" || currentStatus === "existing") {
      skippedDone++;
      continue;
    }

    const email = String(row.getCell(colIdx.email).value ?? "").trim().toLowerCase();
    if (!email) continue;

    // Parse name
    let firstName = "";
    let lastName = "";
    if (colIdx.fullName) {
      const parts = String(row.getCell(colIdx.fullName).value ?? "").trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      firstName = String(row.getCell(colIdx.firstName!).value ?? "").trim();
      lastName = colIdx.lastName ? String(row.getCell(colIdx.lastName).value ?? "").trim() : "";
    }

    if (!firstName) {
      console.log(`  [${r - 1}/${total}] SKIP ${email} — no name`);
      row.getCell(statusCol).value = "error:no_name";
      continue;
    }

    const label = `[${r - 1}/${total}] ${firstName} ${lastName} (${email})`;

    if (dryRun) {
      console.log(`  ${label} — would import`);
      continue;
    }

    // Check before try so it's accessible in catch for correct status tracking
    const existingInSP = spAttendees.get(email);

    try {
      // Step 1: Create in SharePoint DB (if not already there)
      let qrToken: string;

      if (existingInSP) {
        qrToken = existingInSP.qrToken;
        console.log(`  ${label} — already in DB`);

        // If previous run imported but didn't email, we still need to email
        if (currentStatus === "imported" && !skipEmail) {
          // fall through to email step
        } else if (skipEmail) {
          row.getCell(statusCol).value = "existing";
          skippedExisting++;
          continue;
        }
        // else: need to send email for existing attendee
      } else {
        // Create new attendee
        const now = new Date().toISOString();
        const newAttendee: SPAttendee = {
          id: crypto.randomUUID(),
          firstName,
          lastName,
          email,
          phone: "",
          company: "",
          designation: "",
          qrToken: crypto.randomUUID(),
          checkedIn: "false",
          checkedInAt: "",
          source: "import",
          createdAt: now,
          updatedAt: now,
        };
        spAttendees.set(email, newAttendee);
        qrToken = newAttendee.qrToken;
        imported++;
        console.log(`  ${label} — created in DB`);

        if (skipEmail) {
          row.getCell(statusCol).value = "imported";
          // Save progress every 10 imports
          if (imported % 10 === 0) {
            await wb.xlsx.writeFile(absPath);
            await saveSharePointAttendees(spAttendees);
            console.log(`    (saved progress: ${imported} imported so far)`);
          }
          continue;
        }

        // Save DB + mark as "imported" BEFORE sending email.
        // This guarantees the DB entry persists even if email fails or process crashes.
        row.getCell(statusCol).value = "imported";
        await saveSharePointAttendees(spAttendees);
        await wb.xlsx.writeFile(absPath);
        console.log(`    (DB saved — now sending email)`);
      }

      // Step 2: Send QR email
      await sendQREmail({ to: email, firstName, lastName, qrToken });
      emailed++;
      console.log(`  ${label} — email sent`);

      row.getCell(statusCol).value = existingInSP ? "existing" : "done";

      // Throttle: 200ms between emails to stay under SendGrid limits
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Save progress every 10 rows
      if ((imported + emailed) % 10 === 0) {
        await wb.xlsx.writeFile(absPath);
        await saveSharePointAttendees(spAttendees);
        console.log(`    (saved progress)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ${label} — ERROR: ${msg}`);

      // If the attendee was newly created in DB this run but email failed,
      // mark as "imported" so next run only sends the email (won't re-create).
      // We know it was created if it wasn't in SP before but is now in our map.
      const wasCreatedThisRun = !existingInSP && spAttendees.has(email);
      if (wasCreatedThisRun) {
        row.getCell(statusCol).value = "imported";
      } else {
        row.getCell(statusCol).value = `error:${msg.slice(0, 100)}`;
      }
      errors++;

      // Stop immediately on SendGrid rate limit (429) or auth errors (401/403)
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit");
      const isAuthError = msg.includes("401") || msg.includes("403");
      if (isRateLimit || isAuthError) {
        console.error(`\n  STOPPING: ${isRateLimit ? "Rate limit hit" : "Auth error"} — saving progress and exiting.`);
        console.error(`  Re-run the same command to resume from where we left off.\n`);
        await wb.xlsx.writeFile(absPath);
        await saveSharePointAttendees(spAttendees);
        console.log(`
========== IMPORT STOPPED (${isRateLimit ? "RATE LIMITED" : "AUTH ERROR"}) ==========
  Total rows:       ${total}
  Newly imported:   ${imported}
  Emails sent:      ${emailed}
  Already done:     ${skippedDone}
  Already in DB:    ${skippedExisting}
  Errors:           ${errors}
  Status:           Saved. Re-run to resume.
====================================================
`);
        process.exit(2);
      }
    }
  }

  // Final save
  if (!dryRun) {
    console.log("\nSaving final state...");
    await wb.xlsx.writeFile(absPath);
    await saveSharePointAttendees(spAttendees);
  }

  console.log(`
========== IMPORT COMPLETE ==========
  Total rows:       ${total}
  Newly imported:   ${imported}
  Emails sent:      ${emailed}
  Already done:     ${skippedDone}
  Already in DB:    ${skippedExisting}
  Errors:           ${errors}
=====================================
`);
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
