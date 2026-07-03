import { Client, ERLCEvents } from '../client/client.js';
import { Collection } from '../index.js';
import { KillLog } from '../structures/killlog.js';
import { type RawKillLog, type RawServerData } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating KillLog structures.
 * @public
 */
export class KillLogManager {
    /**
     * Collection cache of logged kills, keyed by a composite `Killer:Killed:Timestamp` key.
     */
    public cache = new Collection<string, KillLog>();

    /**
     * Creates an instance of KillLogManager.
     * @param client - The erlcjs client.
     * @param maxCacheSize - The maximum number of kill logs to hold in cache.
     */
    constructor(private readonly client: Client, private readonly maxCacheSize?: number) {}

    /**
     * Fetches all kill logs from the game server.
     * Updates the kill log cache.
     * @returns A promise resolving to a Collection of KillLogs.
     */
    public async fetchAll(): Promise<Collection<string, KillLog>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?KillLogs=true',
        );
        const rawKillLogs: RawKillLog[] = rawServer.KillLogs ?? [];

        return this.updateCache(rawKillLogs);
    }

    /**
     * Re-synchronizes the cache with the raw kill logs.
     * Emits a kill event for new logs.
     * @param rawCommands - Raw kill logs payload.
     * @returns The updated KillLog cache Collection.
     */
    public updateCache(rawCommands: RawKillLog[]) {
        for (const rawData of rawCommands) {
            const key = `${rawData.Killer}:${rawData.Killed}:${rawData.Timestamp}`;
            const cachedPlayer = this.cache.get(key);

            if (!cachedPlayer) {
                const newKill = new KillLog(this.client, rawData);
                this.cache.set(key, newKill);
                this.client.emit(ERLCEvents.kill, newKill);
            }
        }

        if (this.maxCacheSize && this.maxCacheSize > 0) {
            while (this.cache.size > this.maxCacheSize) {
                const oldestKey = this.cache.keys().next().value;
                if (oldestKey === undefined) break;
                this.cache.delete(oldestKey);
            }
        }

        return this.cache;
    }
}
