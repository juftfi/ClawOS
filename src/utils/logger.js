const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const COLORS = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m'
};

class Logger {
    constructor() {
        this.level = this.getLogLevel();
    }

    getLogLevel() {
        const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const color = COLORS[level];
        const reset = COLORS.RESET;

        let formattedMessage = `${color}[${timestamp}] [${level}]${reset} ${message}`;

        if (Object.keys(meta).length > 0) {
            formattedMessage += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return formattedMessage;
    }

    log(level, message, meta = {}) {
        if (LOG_LEVELS[level] >= this.level) {
            const formattedMessage = this.formatMessage(level, message, meta);

            if (level === 'ERROR') {
                console.error(formattedMessage);
            } else if (level === 'WARN') {
                console.warn(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
        }
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    error(message, meta = {}) {
        // Handle Error objects
        if (message instanceof Error) {
            meta = { ...meta, stack: message.stack };
            message = message.message;
        }

        this.log('ERROR', message, meta);
    }

    // Blockchain-specific logging
    transaction(txHash, status, meta = {}) {
        this.info(`Transaction ${status}: ${txHash}`, meta);
    }

    contract(action, address, meta = {}) {
        this.info(`Contract ${action}: ${address}`, meta);
    }

    web3(message, meta = {}) {
        this.debug(`[Web3] ${message}`, meta);
    }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
