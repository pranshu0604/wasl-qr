const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts international format: +<dialcode><digits>
// e.g. +919876543210, +971501234567, +12125550100
// Also accepts legacy loose formats for backwards compat
const PHONE_REGEX_INTL = /^\+\d{7,15}$/;
const PHONE_REGEX_LOOSE = /^[+]?[\d\s\-().]{7,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

export function isWaslEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith("@wasl.ae");
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return PHONE_REGEX_INTL.test(cleaned) || PHONE_REGEX_LOOSE.test(cleaned);
}

export function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, "") // strip angle brackets (XSS)
    .trim()
    .slice(0, 500); // cap length
}

export function validateRegistration(body: Record<string, unknown>): string | null {
  const { firstName, lastName, email, phone } = body;

  if (!firstName || typeof firstName !== "string" || firstName.trim().length < 1) {
    return "First name is required.";
  }
  if (firstName.trim().length > 100) {
    return "First name is too long.";
  }

  if (!lastName || typeof lastName !== "string" || lastName.trim().length < 1) {
    return "Last name is required.";
  }
  if (lastName.trim().length > 100) {
    return "Last name is too long.";
  }

  if (!email || typeof email !== "string") {
    return "Email is required.";
  }
  if (!isValidEmail(email.trim())) {
    return "Please enter a valid email address.";
  }
  if (!isWaslEmail(email.trim())) {
    return "Registration is restricted to @wasl.ae email addresses.";
  }

  if (phone && typeof phone === "string" && phone.trim().length > 0) {
    if (!isValidPhone(phone.trim())) {
      return "Please enter a valid phone number.";
    }
  }

  if (body.company && typeof body.company === "string" && body.company.length > 200) {
    return "Company name is too long.";
  }

  if (body.designation && typeof body.designation === "string" && body.designation.length > 200) {
    return "Designation is too long.";
  }

  return null;
}
