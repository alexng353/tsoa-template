import { pino } from "pino";
import PinoPretty from "pino-pretty";

function dateStamp(stamp?: number) {
  const dateObject = stamp ? new Date(stamp) : new Date();
  return dateObject
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Vancouver",
    })
    .replaceAll("/", "-");
}

const stream = PinoPretty({
  customPrettifiers: {
    time: () => {
      return dateStamp();
    },
  },
  colorize: true,
  singleLine: true,
  colorizeObjects: true,
});

export const logger = pino(
  {
    level: "info",
  },
  stream,
);
