import { Client } from '../client/client.js';

/**
 * Manager responsible for executing custom console commands in the ER:LC server.
 * @public
 */
export class CommandManager {
    /**
     * Creates an instance of CommandManager.
     * @param client - The erlcjs client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Executes a server command via the ER:LC API.
     * @param command - The full command string to execute (e.g. `:pm jamie hello`).
     * @returns A promise resolving to the API response string status.
     */
    public async execute(command: string): Promise<string> {
        const res: string = await this.client.rest.request('POST', '/v2/server/command', {
            command,
        });

        return res;
    }
}
