const SYNC_LOOKBACK_DAYS = 7;

export function getSyncDateRange(now = new Date(), days = SYNC_LOOKBACK_DAYS) {
  const endDate = formatLocalDate(now);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - days + 1);
  return { startDate: formatLocalDate(start), endDate };
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
