/**
 * Error thrown when an invalid ER:LC Server API Key is provided.
 * @public
 */
export class InvalidServerKeyError extends Error {
    constructor(message: string = 'Invalid Server API Key. Get one at https://api.erlc.gg/server-owners') {
        super(message);
        this.name = 'InvalidServerKeyError';
    }
}

/**
 * Error thrown when an invalid ER:LC Global API Key is provided.
 * @public
 */
export class InvalidGlobalKeyError extends Error {
    constructor(message: string = 'Invalid Global API Key. Get one at https://api.erlc.gg/developers/applications') {
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

/**
 * Error thrown if the server key is banned from accessing the ER:LC API.
 * @public
 */
export class ServerBannedError extends Error {
    constructor(message: string = 'This server key is banned from accessing the ER:LC API.') {
        super(message);
        this.name = 'ServerBannedError';
    }
}

/**
 * Error thrown if the in-game command is invalid.
 * @public
 */
export class InvalidCommandError extends Error {
    constructor(message: string = 'The command provided was invalid.') {
        super(message);
        this.name = 'InvalidCommandError';
    }
}

/**
 * Error thrown if the request was unauthorized.
 * This is normally thrown when the IP was not whitelisted or the global app was not authorized for that server.
 * To authorize an IP go to https://api.erlc.gg/server-owners.
 * To create a global app for an authorization link go to https://api.erlc.gg/developers/applications.
 * To create an authorization link for your global app do `console.log(client.authorizationLink)`.
 * @public
 */
export class UnauthorizedError extends Error {
    constructor(message: string = 'You are not authorized to perform this action. Find out more at https://erlcjs.xyz/api/core/unauthorizederror/') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Error thrown when the command is restricted.
 * @public
 */
export class RestrictedCommandError extends Error {
    constructor(message: string = 'The command provided was restricted.') {
        super(message);
        this.name = 'RestrictedCommandError';
    }
}

/**
 * Error thrown when the message sent is prohibited.
 * @public
 */
export class ProhibitedMessageError extends Error {
    constructor(message: string = 'The message provided is prohibited.') {
        super(message);
        this.name = 'ProhibitedMessageError';
    }
}

/**
 * Error thrown when the resource being accessed is restricted.
 * @public
 */
export class RestrictedResourceError extends Error {
    constructor(message: string = 'The resource being accessed is restricted.') {
        super(message);
        this.name = 'RestrictedResourceError';
    }
}

/**
 * Error thrown when the server being accessed is out of date.
 */
export class OutOfDateServerError extends Error {
    constructor(message: string = 'The server being accessed is out of date. Try restarting it.') {
        super(message);
        this.name = 'OutOfDateServerError';
    }
}