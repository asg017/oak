const winston = require("winston");
const { timeFormat } = require("d3-time-format");

const logDate = timeFormat("%Y-%m-%d %H-%M-%S.%L");
const createLogger = config => {
  const { label = "UNNAMED" } = config;
  return winston.createLogger({
    level: "debug",
    format: winston.format.combine(
      winston.format.label({ label }),
      winston.format.prettyPrint(),
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        ({ level, message, label, timestamp }) =>
          `[${logDate(new Date(timestamp))}] [${label}] ${level} : ${message}`
      )
    ),
    transports: [new winston.transports.Console()]
  });
};
module.exports = { createLogger };
