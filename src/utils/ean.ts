export function generateEAN13(): string {
    const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
    
    // Calculate check digit
    const sum = digits.reduce((acc, digit, idx) => {
      return acc + digit * (idx % 2 === 0 ? 1 : 3);
    }, 0);
  
    const checkDigit = (10 - (sum % 10)) % 10;
  
    return digits.join("") + checkDigit.toString();
  }