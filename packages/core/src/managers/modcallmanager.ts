import { Client, ERLCEvents } from '../client/client.js';
import { Collection } from '../index.js';
import { ModCall } from '../structures/modcall.js';
import { type RawModCall, type RawServerData } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating ModCall structures.
 * @public
 */
export class ModCallManager {
    /**
     * Collection cache of logged moderator calls, keyed by a composite `Caller:Timestamp` key.
     */
    public cache = new Collection<string, ModCall>();

    /**
     * Creates an instance of ModCallManager.
     * @param client - The erlcjs client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all moderator calls from the game server.
     * Updates the moderator call cache.
     * @returns A promise resolving to a Collection of ModCalls.
     */
    public async fetchAll(): Promise<Collection<string, ModCall>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?ModCalls=true',
        );
        const rawModCalls: RawModCall[] = rawServer.ModCalls ?? [];

        return this.updateCache(rawModCalls);
    }

    /**
     * Re-synchronizes the cache with the raw moderator calls.
     * Emits a modCall event for new calls.
     * @param rawCommands - Raw moderator calls payload.
     * @returns The updated ModCall cache Collection.
     */
    public updateCache(rawCommands: RawModCall[]) {
        for (const rawData of rawCommands) {
            const key = `${rawData.Caller}:${rawData.Timestamp}`;
            const cachedPlayer = this.cache.get(key);

            if (!cachedPlayer) {
                const newCall = new ModCall(this.client, rawData);
                this.cache.set(key, newCall);
                this.client.emit(ERLCEvents.modCall, newCall);
            }
        }

        return this.cache;
    }
}
