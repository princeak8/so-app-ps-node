import winston from 'winston';
import path from 'path';

const logDirectory = path.resolve(__dirname, 'logs');

// Create the log directory if it doesn't exist
if (!require('fs').existsSync(logDirectory)) {
  require('fs').mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, 'error.log');

const logger = winston.createLogger({
  level: 'error',
//   format: winston.format.json(),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFile, level: 'error' }),
  ],
});

export default logger;