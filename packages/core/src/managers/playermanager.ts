import { Client, ERLCEvents } from '../client/client.js';
import { Collection } from '../index.js';
import { Player } from '../structures/player.js';
import { type RawPlayerData, type RawServerData } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating Player structures.
 * @public
 */
export class PlayerManager {
    /**
     * Collection cache of online Players, keyed by their UserId.
     */
    public cache = new Collection<number, Player>();
    private nameToId = new Collection<string, number>();

    /**
     * Creates an instance of PlayerManager.
     * @param client - The ERLCApi client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all active players currently in the game server.
     * Updates the player cache.
     * @returns A promise resolving to a Collection of active Players.
     */
    public async fetchAll(): Promise<Collection<number, Player>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?Players=true',
        );
        const rawPlayers: RawPlayerData[] = rawServer.Players ?? [];

        return this.updateCache(rawPlayers);
    }

    /**
     * Re-synchronizes the cache with the raw player list from the API.
     * Emits playerJoin, playerLeave, and playerUpdate events.
     * @param rawPlayers - Raw player list payload.
     * @returns The updated Player cache Collection.
     */
    public updateCache(rawPlayers: RawPlayerData[]) {
        const activeIds = new Set<number>();
        const activeUsers = new Set<string>();

        for (const rawData of rawPlayers) {
            const userId = Number(rawData.Player.split(':')[1]);
            const username = rawData.Player.split(':')[0]!;
            activeIds.add(userId);
            activeUsers.add(username);
            this.nameToId.set(username, userId);
            const cachedPlayer = this.cache.get(userId);

            if (cachedPlayer) {
                const oldPlayer = new Player(this.client, cachedPlayer.toJSON());
                cachedPlayer._patch(rawData);
                this.client.emit(ERLCEvents.playerUpdate, oldPlayer, cachedPlayer);
            } else {
                const newPlayer = new Player(this.client, rawData);
                this.cache.set(newPlayer.id, newPlayer);
                this.client.emit(ERLCEvents.playerJoin, newPlayer);
            }
        }

        for (const cachedId of this.cache.keys()) {
            if (!activeIds.has(cachedId)) {
                this.client.emit(ERLCEvents.playerLeave, this.cache.get(cachedId)!);
                this.cache.delete(cachedId);
            }
        }

        for (const cachedUser of this.nameToId.keys()) {
            if (!activeUsers.has(cachedUser)) this.nameToId.delete(cachedUser);
        }

        return this.cache;
    }

    /**
     * Retrieves a player's UserId from their Roblox username.
     * Attempts to resolve from cache first, otherwise triggers a fresh fetch.
     * @param name - The Roblox username.
     * @returns The UserId if resolved, otherwise undefined.
     */
    public getIdFromName(name: string) {
        if (this.nameToId.has(name)) return this.nameToId.get(name);
        this.fetchAll().then(() => {
            return this.nameToId.get(name);
        });
    }

    /**
     * Unbans a player from their userId.
     * @param userId - The userId to unban.
     */
    public async unban(userId: number | string) {
        await this.client.commands.execute(`:unban ${userId}`);
    }

    /**
     * Unhelpers a player from their userId.
     * @param userId - The userId to unhelper.
     */
    public async unhelper(userId: number | string) {
        await this.client.commands.execute(`:unhelper ${userId}`);
    }

    /**
     * Unmods a player from their userId.
     * @param userId - The userId to unmod.
     */
    public async unmod(userId: number | string) {
        await this.client.commands.execute(`:unmod ${userId}`);
    }

    /**
     * Unadmins a player from their userId.
     * @param userId - The userId to unadmin.
     */
    public async unadmin(userId: number | string) {
        await this.client.commands.execute(`:unadmin ${userId}`);
    }

    /**
     * Gets a list of all players with a wanted level greater than 0.
     * @returns An array of Player instances with a wanted level greater than 0.
     */
    public get wanted() {
        return Array.from(this.cache.values()).filter(p => p.wantedLevel > 0);
    }

    /**
     * Gets a list of all players with a permission level other than 'Normal'.
     * @returns An array of Player instances with elevated permissions.
     */
    public get onlineStaff() {
        return Array.from(this.cache.values()).filter(p => p.permission !== 'Normal');
    }
}
