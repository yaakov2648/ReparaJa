// Validação do NIF português: 9 dígitos + dígito de controlo (módulo 11).
// Só confirma o formato/checksum — não confirma que o NIF existe nem que
// pertence a quem o está a inserir.
export function isValidPortugueseNif(nif: string): boolean {
  const digits = nif.replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);
  const checksum = nums.slice(0, 8).reduce((sum, digit, i) => sum + digit * (9 - i), 0);
  const remainder = checksum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return checkDigit === nums[8];
}
