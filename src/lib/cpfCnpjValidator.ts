/**
 * Validates a Brazilian CPF number.
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

/**
 * Validates a Brazilian CNPJ number.
 */
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let remainder = sum % 11;
  if (remainder < 2) { if (parseInt(digits[12]) !== 0) return false; }
  else { if (parseInt(digits[12]) !== 11 - remainder) return false; }

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  remainder = sum % 11;
  if (remainder < 2) { if (parseInt(digits[13]) !== 0) return false; }
  else { if (parseInt(digits[13]) !== 11 - remainder) return false; }

  return true;
}

/**
 * Validates either CPF or CNPJ based on length.
 */
export function validateCPFOrCNPJ(value: string): { valid: boolean; type: "cpf" | "cnpj" | "unknown" } {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return { valid: validateCPF(value), type: "cpf" };
  if (digits.length === 14) return { valid: validateCNPJ(value), type: "cnpj" };
  return { valid: false, type: "unknown" };
}
