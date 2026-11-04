export function getCompactAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();

  // If birth date is invalid or in the future, return "0D"
  if (isNaN(birth.getTime()) || birth > today) {
    return "0D";
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  // Adjust months and years when days are negative
  if (days < 0) {
    months--;
    // Get days in previous month of 'today'
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust years and months if months negative
  if (months < 0) {
    years--;
    months += 12;
  }

  // If year is non-negative but months or days negative (rare edge cases), fix:
  if (years < 0) {
    return "0D";
  }

  // Return compact format prioritizing years, then months, then days
  if (years > 0) {
    return `${years}Y`;
  } else if (months > 0) {
    return `${months}M`;
  } else {
    return `${days}D`;
  }
}
