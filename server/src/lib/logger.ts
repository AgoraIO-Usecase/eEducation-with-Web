import { createLogger, format, transports } from "winston";
import chalk from "chalk";

const { combine, colorize, label, printf, splat, timestamp } = format;

const createLoggerWithLabel = (loggerLabel: string) =>
  createLogger({
    level: process.env.LOG_LEVEL || "info",
    transports: [new transports.Console({})],
    format: combine(
      timestamp(),
      splat(),
      colorize(),
      label({ label: loggerLabel }),
      printf(
        info =>
          `${info.timestamp} ${chalk.cyan(info.label)} ${info.level}: ${
            info.message
          }`
      )
    )
  });

export const sentry = createLoggerWithLabel("[Sentry:]");
export const inMemoryCache = createLoggerWithLabel("[InMemoryCache:]");
export const gateway = createLoggerWithLabel("[Gateway:]");
export default createLoggerWithLabel;
