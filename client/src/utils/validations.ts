// Email validation
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Password strength
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 1)
    return { score: 20, label: "Weak", color: "bg-destructive" };
  if (score === 2)
    return { score: 40, label: "Fair", color: "bg-warning" };
  if (score === 3)
    return { score: 60, label: "Good", color: "bg-primary" };
  if (score === 4)
    return { score: 80, label: "Strong", color: "bg-success" };
  return { score: 100, label: "Very Strong", color: "bg-success" };
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
