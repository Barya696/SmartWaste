// Utility functions for credit card handling
export const luhnCheck = (num: string): boolean => {
  const arr = (num + "")
    .split("")
    .reverse()
    .map((x) => parseInt(x));
  const lastDigit = arr.shift();
  let sum = arr.reduce(
    (acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val *= 2) > 9 ? val - 9 : val)),
    0
  );
  sum += lastDigit!;
  return sum % 10 === 0;
};

export const formatCreditCard = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  // Format with spaces every 4 digits
  let formatted = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += " ";
    }
    formatted += digits[i];
  }
  return formatted;
};

export const isValidCreditCard = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits);
};
