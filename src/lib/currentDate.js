export const getDate = () => {
  // Create date object with current time
  const now = new Date();
  
  // Add IST offset (5 hours 30 minutes)
  const istOffset = 5.5 * 60 * 60 * 1000;  // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);

  // Extract UTC components (which now represent IST date/time)
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};