import { PITResult } from '../types';

export const calculatePIT = (gross: number, rent: number): PITResult => {
  // Rent relief logic as provided: Min(20% of gross, 500k, or actual rent)
  const rentRelief = Math.min(gross * 0.2, 500000, rent);
  const taxable = Math.max(0, gross - rentRelief);

  let tax = 0;
  let remaining = taxable;

  // New Finance Act logic often has a consolidated relief, but we adhere to the logic provided in the prompt's snippet.
  
  // First 800k at 0%? The provided snippet implies:
  // if (remaining > 800000) { remaining -= 800000; ... }
  // This implies the first 800k is tax free/exempt in this specific logic context.

  if (remaining > 800000) {
    remaining -= 800000; // 0% Band

    // Next 2.2m @ 15%
    if (remaining > 2200000) {
      tax += 2200000 * 0.15;
      remaining -= 2200000;
    } else {
      tax += remaining * 0.15;
      remaining = 0;
    }

    // Next 9m @ 18%
    if (remaining > 9000000) {
      tax += 9000000 * 0.18;
      remaining -= 9000000;
    } else if (remaining > 0) {
      tax += remaining * 0.18;
      remaining = 0;
    }

    // Next 13m @ 21%
    if (remaining > 13000000) {
      tax += 13000000 * 0.21;
      remaining -= 13000000;
    } else if (remaining > 0) {
      tax += remaining * 0.21;
      remaining = 0;
    }

    // Next 25m @ 23%
    if (remaining > 25000000) {
      tax += 25000000 * 0.23;
      remaining -= 25000000;
    } else if (remaining > 0) {
      tax += remaining * 0.23;
      remaining = 0;
    }

    // Balance @ 25%
    if (remaining > 0) {
      tax += remaining * 0.25;
    }
  }

  return { taxable, tax, relief: rentRelief };
};

export const calculateVAT = (amount: number, inclusive: boolean): number => {
  // Nigeria VAT is 7.5%
  return inclusive ? amount - (amount / 1.075) : amount * 0.075;
};