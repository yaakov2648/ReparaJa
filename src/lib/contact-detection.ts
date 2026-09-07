// Deteção de partilha de contacto externo, no backend — nunca só no
// frontend, senão bastava desativar o JavaScript para contornar. Corre em
// toda a mensagem enviada no chat antes de a guardar.
//
// Objetivo é impedir contorno claro da plataforma, não impedir conversa
// normal: por isso o limiar de dígitos é alto (9+, como um nº de telemóvel
// português) para não bloquear preços, medidas ou datas. Como limitação
// conhecida, isto também apanha coisas como NIF ou IBAN partilhados para
// efeitos de fatura — não há forma simples de distinguir isso de um
// telefone sem mais contexto; fica para uma iteração futura se se revelar
// incómodo em uso real.

export type ContactPatternType = "PHONE" | "EMAIL" | "URL" | "SOCIAL_APP" | "PHRASE";

const PATTERNS: { type: ContactPatternType; regex: RegExp }[] = [
  { type: "EMAIL", regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { type: "URL", regex: /\b(?:https?:\/\/|www\.)\S+/i },
  // sequência de 9+ dígitos, com no máximo um separador (espaço/ponto/hífen)
  // entre cada par — cobre "912 345 678", "912-345-678", "+351912345678"
  { type: "PHONE", regex: /\d(?:[\s.-]?\d){8,}/ },
  {
    type: "SOCIAL_APP",
    regex: /\b(whats\s?app|telegram|messenger|instagram|facebook|viber|signal|tiktok)\b/i,
  },
  {
    type: "PHRASE",
    regex:
      /\b(liga[- ]?me|ligue[- ]?me|manda(?:r)?\s+mensagem\s+para|contacta[- ]?me\s+(?:pelo|no|por)|fora\s+da\s+plataforma|o\s+meu\s+(?:tlm|telem[oó]vel|telefone|n[uú]mero)\s+[eé])\b/i,
  },
];

export type ContactDetectionResult =
  | { blocked: false }
  | { blocked: true; patternType: ContactPatternType };

export function detectExternalContact(text: string): ContactDetectionResult {
  for (const { type, regex } of PATTERNS) {
    if (regex.test(text)) {
      return { blocked: true, patternType: type };
    }
  }
  return { blocked: false };
}

export function contactBlockedMessage(patternType: ContactPatternType): string {
  switch (patternType) {
    case "PHONE":
      return "A tua mensagem parece conter um número de telefone. Por segurança de ambas as partes, toda a comunicação tem de ficar dentro do chat da ReparaJá.";
    case "EMAIL":
      return "A tua mensagem parece conter um email. Por segurança de ambas as partes, toda a comunicação tem de ficar dentro do chat da ReparaJá.";
    case "URL":
      return "A tua mensagem parece conter um link externo. Por segurança de ambas as partes, toda a comunicação tem de ficar dentro do chat da ReparaJá.";
    case "SOCIAL_APP":
      return "A tua mensagem parece referir uma app de mensagens externa. Combina tudo por aqui — fica registado e protege as duas partes.";
    case "PHRASE":
      return "A tua mensagem parece estar a propor continuar a conversa fora da plataforma. Combina tudo por aqui — fica registado e protege as duas partes.";
  }
}
