/**
 * Error thrown when an invalid ER:LC Server API Key is provided.
 * @public
 */
export class InvalidServerKeyError extends Error {
    constructor(message: string = 'Invalid Server API Key.') {
        super(message);
        this.name = 'InvalidServerKeyError';
    }
}

/**
 * Error thrown when an invalid ER:LC Global API Key is provided.
 * @public
 */
export class InvalidGlobalKeyError extends Error {
    constructor(message: string = 'Invalid Global API Key.') {
        super(message);
        this.name = 'InvalidGlobalKeyError';
    }
}

/**
 * Error thrown when a custom in-game command is invalid.
 * @public
 */
export class CustomCommandError extends Error {
    constructor(message: string = 'Invalid Custom In-Game Command.') {
        super(message);
        this.name = 'CustomCommandError';
    }
}

/**
 * Error thrown when a timeout occurs.
 * @public
 */
export class TimeoutError extends Error {
    constructor(message: string = 'Timeout.') {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Error thrown when the ER:LC API returns an error.
 * @public
 */
export class ERLCAPIError extends Error {
    constructor(message: string = 'ER:LC API Error.') {
        super(message);
        this.name = 'ERLCAPIError';
    }
}

/**
 * Error thrown when the ER:LC Private Server is offline.
 * @public
 */
export class ServerOfflineError extends Error {
    constructor(message: string = 'Server Offline.') {
        super(message);
        this.name = 'ServerOfflineError';
    }
}