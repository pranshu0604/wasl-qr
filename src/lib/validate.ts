const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
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

  if (!phone || typeof phone !== "string") {
    return "Phone number is required.";
  }
  if (!isValidPhone(phone.trim())) {
    return "Please enter a valid phone number.";
  }

  if (body.company && typeof body.company === "string" && body.company.length > 200) {
    return "Company name is too long.";
  }

  if (body.designation && typeof body.designation === "string" && body.designation.length > 200) {
    return "Designation is too long.";
  }

  return null;
}
