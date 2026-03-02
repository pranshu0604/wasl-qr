import ExcelJS from "exceljs";
import { getGraphToken } from "./graph-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  designation: string | null;
  qrToken: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

type AttendeeCreate = Omit<Attendee, "id" | "qrToken" | "checkedIn" | "checkedInAt" | "createdAt" | "updatedAt"> & {
  checkedIn?: boolean;
  checkedInAt?: Date | null;
};

export interface FindManyOptions {
  search?: string;
  filter?: "all" | "checked-in" | "not-checked-in";
  skip?: number;
  take?: number;
  orderBy?: "createdAt" | "firstName";
  orderDir?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Column mapping — maps Attendee fields to Excel column letters
// ---------------------------------------------------------------------------

const COLUMNS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "company",
  "designation",
  "qrToken",
  "checkedIn",
  "checkedInAt",
  "source",
  "createdAt",
  "updatedAt",
] as const;

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------

// Cache the resolved site ID to avoid re-resolving on every call
let cachedSiteId: string | null = null;

async function getSiteId(): Promise<string> {
  if (cachedSiteId) return cachedSiteId;

  const siteHost = process.env.SHAREPOINT_SITE_HOST!;
  const sitePath = process.env.SHAREPOINT_SITE_PATH!;
  const token = await getGraphToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteHost}:${sitePath}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Site lookup failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedSiteId = data.id;
  return cachedSiteId!;
}

function getEncodedFilePath(): string {
  const filePath = process.env.SHAREPOINT_FILE_PATH!;
  return filePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

async function downloadExcel(): Promise<ArrayBuffer> {
  const siteId = await getSiteId();
  const token = await getGraphToken();
  const encodedFile = getEncodedFilePath();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${encodedFile}:/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Download failed: ${res.status} ${text}`);
  }
  return res.arrayBuffer();
}

async function uploadExcel(data: ArrayBuffer): Promise<void> {
  const siteId = await getSiteId();
  const token = await getGraphToken();
  const encodedFile = getEncodedFilePath();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${encodedFile}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      body: new Uint8Array(data),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Excel ↔ Attendee parsing
// ---------------------------------------------------------------------------

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

// Maps various header names to our internal field names
const HEADER_ALIASES: Record<string, keyof Attendee> = {
  id: "id",
  firstname: "firstName",
  "first name": "firstName",
  "first_name": "firstName",
  lastname: "lastName",
  "last name": "lastName",
  "last_name": "lastName",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  "mobile number": "phone",
  company: "company",
  organization: "company",
  org: "company",
  designation: "designation",
  title: "designation",
  role: "designation",
  "job title": "designation",
  qrtoken: "qrToken",
  qr_token: "qrToken",
  checkedin: "checkedIn",
  "checked in": "checkedIn",
  checked_in: "checkedIn",
  checkedinat: "checkedInAt",
  "checked in at": "checkedInAt",
  source: "source",
  createdat: "createdAt",
  "created at": "createdAt",
  updatedat: "updatedAt",
  "updated at": "updatedAt",
};

type ColumnMap = Map<keyof Attendee, number>; // field → column index (1-based)

function buildColumnMap(headerRow: ExcelJS.Row): ColumnMap {
  const map: ColumnMap = new Map();
  headerRow.eachCell((cell, colNum) => {
    const raw = String(cell.value ?? "").trim().toLowerCase();
    const field = HEADER_ALIASES[raw];
    if (field) map.set(field, colNum);
  });
  return map;
}

function rowToAttendee(row: ExcelJS.Row, colMap: ColumnMap): Attendee | null {
  const get = (field: keyof Attendee): string => {
    const col = colMap.get(field);
    return col ? (row.getCell(col).text?.trim() || "") : "";
  };

  // Need at least an email to be a valid row
  const email = get("email").toLowerCase();
  if (!email) return null;

  const now = new Date();
  return {
    id: get("id") || crypto.randomUUID(),
    firstName: get("firstName"),
    lastName: get("lastName"),
    email,
    phone: get("phone") || null,
    company: get("company") || null,
    designation: get("designation") || null,
    qrToken: get("qrToken") || crypto.randomUUID(),
    checkedIn: get("checkedIn").toLowerCase() === "true",
    checkedInAt: parseDate(colMap.has("checkedInAt") ? row.getCell(colMap.get("checkedInAt")!).value : null),
    source: get("source") || "import",
    createdAt: parseDate(colMap.has("createdAt") ? row.getCell(colMap.get("createdAt")!).value : null) || now,
    updatedAt: parseDate(colMap.has("updatedAt") ? row.getCell(colMap.get("updatedAt")!).value : null) || now,
  };
}

function attendeeToRow(a: Attendee): (string | boolean | Date | null)[] {
  return [
    a.id,
    a.firstName,
    a.lastName,
    a.email,
    a.phone ?? "",
    a.company ?? "",
    a.designation ?? "",
    a.qrToken,
    String(a.checkedIn),
    a.checkedInAt ? a.checkedInAt.toISOString() : "",
    a.source,
    a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
  ];
}

// ---------------------------------------------------------------------------
// ExcelStore — in-memory cache + read/write to SharePoint
// ---------------------------------------------------------------------------

class ExcelStore {
  private cache: Map<string, Attendee> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email → id
  private qrIndex: Map<string, string> = new Map(); // qrToken → id
  private lastLoad = 0;
  private ttl = 10_000; // 10 seconds — shorter for event-time concurrency
  private loading: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private checkinLocks: Set<string> = new Set(); // prevent double check-in races

  // ---- Cache management ----

  private rebuildIndexes() {
    this.emailIndex.clear();
    this.qrIndex.clear();
    for (const a of this.cache.values()) {
      if (a.email) this.emailIndex.set(a.email.toLowerCase(), a.id);
      if (a.qrToken) this.qrIndex.set(a.qrToken, a.id);
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (Date.now() - this.lastLoad < this.ttl && this.cache.size > 0) return;
    if (this.loading) return this.loading;

    this.loading = this.loadFromExcel();
    try {
      await this.loading;
    } finally {
      this.loading = null;
    }
  }

  private async loadFromExcel(): Promise<void> {
    const buf = await downloadExcel();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("No worksheet found in Excel file");

    // Build column map from header row
    const headerRow = sheet.getRow(1);
    const colMap = buildColumnMap(headerRow);

    this.cache.clear();
    let needsRewrite = false;

    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header
      const a = rowToAttendee(row, colMap);
      if (a) {
        // If we generated an id or qrToken, the file needs rewriting
        if (!colMap.has("id") || !colMap.has("qrToken")) needsRewrite = true;
        this.cache.set(a.id, a);
      }
    });
    this.rebuildIndexes();
    this.lastLoad = Date.now();

    // If the Excel file had a different schema, rewrite it with our full schema
    if (needsRewrite && this.cache.size > 0) {
      await this.saveToExcel();
    }
  }

  private async saveToExcel(): Promise<void> {
    // Queue writes so they run sequentially — no skipped saves
    this.writeQueue = this.writeQueue.then(() => this.doSave()).catch((err) => {
      console.error("Excel save failed:", err);
    });
    return this.writeQueue;
  }

  private async doSave(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendees");

    // Header row
    sheet.addRow(COLUMNS.map((c) => c));

    // Data rows sorted by createdAt desc
    const sorted = [...this.cache.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    for (const a of sorted) {
      sheet.addRow(attendeeToRow(a));
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    await uploadExcel(arrayBuffer);
    this.lastLoad = Date.now();
  }

  // ---- Public API ----

  async findById(id: string): Promise<Attendee | null> {
    await this.ensureLoaded();
    return this.cache.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Attendee | null> {
    await this.ensureLoaded();
    const id = this.emailIndex.get(email.toLowerCase());
    return id ? this.cache.get(id) ?? null : null;
  }

  async findByQrToken(token: string): Promise<Attendee | null> {
    await this.ensureLoaded();
    const id = this.qrIndex.get(token);
    return id ? this.cache.get(id) ?? null : null;
  }

  async findMany(opts: FindManyOptions = {}): Promise<Attendee[]> {
    await this.ensureLoaded();
    let results = [...this.cache.values()];

    // Filter by checkedIn status
    if (opts.filter === "checked-in") {
      results = results.filter((a) => a.checkedIn);
    } else if (opts.filter === "not-checked-in") {
      results = results.filter((a) => !a.checkedIn);
    }

    // Search
    if (opts.search) {
      const q = opts.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.firstName.toLowerCase().includes(q) ||
          a.lastName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.phone && a.phone.includes(q)) ||
          (a.company && a.company.toLowerCase().includes(q))
      );
    }

    // Sort
    const dir = opts.orderDir === "asc" ? 1 : -1;
    if (opts.orderBy === "firstName") {
      results.sort((a, b) => dir * a.firstName.localeCompare(b.firstName));
    } else {
      // default: createdAt desc
      results.sort((a, b) => -1 * (a.createdAt.getTime() - b.createdAt.getTime()));
    }

    // Pagination
    const skip = opts.skip ?? 0;
    const take = opts.take ?? results.length;
    return results.slice(skip, skip + take);
  }

  async count(filter?: "all" | "checked-in" | "not-checked-in"): Promise<number> {
    await this.ensureLoaded();
    if (!filter || filter === "all") return this.cache.size;
    if (filter === "checked-in") {
      let c = 0;
      for (const a of this.cache.values()) if (a.checkedIn) c++;
      return c;
    }
    let c = 0;
    for (const a of this.cache.values()) if (!a.checkedIn) c++;
    return c;
  }

  async create(data: AttendeeCreate): Promise<Attendee> {
    await this.ensureLoaded();

    // Check email uniqueness
    if (this.emailIndex.has(data.email.toLowerCase())) {
      throw new Error("EMAIL_EXISTS");
    }

    const now = new Date();
    const attendee: Attendee = {
      id: crypto.randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone ?? null,
      company: data.company ?? null,
      designation: data.designation ?? null,
      qrToken: crypto.randomUUID(),
      checkedIn: data.checkedIn ?? false,
      checkedInAt: data.checkedInAt ?? null,
      source: data.source,
      createdAt: now,
      updatedAt: now,
    };

    this.cache.set(attendee.id, attendee);
    this.emailIndex.set(attendee.email, attendee.id);
    this.qrIndex.set(attendee.qrToken, attendee.id);

    await this.saveToExcel();
    return attendee;
  }

  async update(
    id: string,
    data: Partial<Pick<Attendee, "checkedIn" | "checkedInAt" | "firstName" | "lastName" | "email" | "phone" | "company" | "designation">>
  ): Promise<Attendee | null> {
    await this.ensureLoaded();
    const existing = this.cache.get(id);
    if (!existing) return null;

    const updated: Attendee = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    // Update indexes if email changed
    if (data.email && data.email !== existing.email) {
      this.emailIndex.delete(existing.email);
      this.emailIndex.set(data.email.toLowerCase(), id);
    }

    this.cache.set(id, updated);
    await this.saveToExcel();
    return updated;
  }

  async checkin(qrToken: string): Promise<{ attendee: Attendee; alreadyCheckedIn: boolean }> {
    await this.ensureLoaded();
    const id = this.qrIndex.get(qrToken);
    if (!id) throw new Error("NOT_FOUND");

    const attendee = this.cache.get(id);
    if (!attendee) throw new Error("NOT_FOUND");

    if (attendee.checkedIn) {
      return { attendee, alreadyCheckedIn: true };
    }

    // Prevent race: if another request is already checking in this token, treat as duplicate
    if (this.checkinLocks.has(qrToken)) {
      return { attendee, alreadyCheckedIn: true };
    }

    this.checkinLocks.add(qrToken);
    try {
      // Re-check after acquiring lock (another request may have completed)
      if (attendee.checkedIn) {
        return { attendee, alreadyCheckedIn: true };
      }

      const updated: Attendee = {
        ...attendee,
        checkedIn: true,
        checkedInAt: new Date(),
        updatedAt: new Date(),
      };
      this.cache.set(id, updated);
      await this.saveToExcel();
      return { attendee: updated, alreadyCheckedIn: false };
    } finally {
      this.checkinLocks.delete(qrToken);
    }
  }

  async upsert(
    email: string,
    createData: AttendeeCreate,
    updateData: Partial<Pick<Attendee, "checkedIn" | "checkedInAt">>
  ): Promise<{ attendee: Attendee; isNew: boolean }> {
    await this.ensureLoaded();
    const existingId = this.emailIndex.get(email.toLowerCase());

    if (existingId) {
      const updated = await this.update(existingId, updateData);
      return { attendee: updated!, isNew: false };
    }

    const created = await this.create(createData);
    return { attendee: created, isNew: true };
  }
}

// ---------------------------------------------------------------------------
// Singleton — survives hot-reload in dev
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as { excelStore: ExcelStore | undefined };
export const db = globalForDb.excelStore ?? new ExcelStore();
if (process.env.NODE_ENV !== "production") globalForDb.excelStore = db;
