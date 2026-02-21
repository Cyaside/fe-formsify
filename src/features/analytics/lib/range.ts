export type RangeOption = {
  label: string;
  days: number;
  bucket: "day" | "week" | "month";
};

export const rangeOptions: RangeOption[] = [
  { label: "7 days", days: 7, bucket: "day" },
  { label: "30 days", days: 30, bucket: "day" },
  { label: "90 days", days: 90, bucket: "week" },
];

export const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const getRangeDates = (days: number) => {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: toDateInput(start), to: toDateInput(end) };
};
