import { Client, ERLCEvents } from '../client/client.js';
import { EmergencyCall } from '../structures/emergencycall.js';
import {
    type RawEmergencyCall,
    type RawServerData,
    type RawWebhookEmergencyCall,
} from '../types/index.js';
import { convertToPascalCase } from '../util/index.js';
import { Collection } from '../util/collection.js';

/**
 * Manager responsible for fetching, caching, and updating active EmergencyCall structures.
 * @public
 */
export class EmergencyCallManager {
    /**
     * Collection cache of active emergency calls, keyed by call number.
     */
    public cache = new Collection<number, EmergencyCall>();

    /**
     * Creates an instance of EmergencyCallManager.
     * @param client - The erlcjs client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all active emergency calls from the game server.
     * Updates the emergency call cache.
     * @returns A promise resolving to a Collection of active EmergencyCalls.
     */
    public async fetchAll(): Promise<Collection<number, EmergencyCall>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?EmergencyCalls=true',
        );
        const rawEmergencyCalls: RawEmergencyCall[] = rawServer.EmergencyCalls ?? [];

        return this.updateCache(rawEmergencyCalls);
    }

    /**
     * Re-synchronizes the cache with the raw emergency calls payload.
     * Emits emergencyCallAdd, emergencyCallRemove, and emergencyCallUpdate events.
     * @param rawCalls - Raw active emergency calls payload.
     * @returns The updated EmergencyCall cache Collection.
     */
    public updateCache(rawCalls: RawEmergencyCall[]) {
        const activeCalls = new Set<number>();

        for (const rawData of rawCalls) {
            const callNum = rawData.CallNumber;
            activeCalls.add(callNum);
            const cachedCall = this.cache.get(callNum);

            if (cachedCall) {
                const oldCall = new EmergencyCall(this.client, cachedCall.toJSON());
                cachedCall._patch(rawData);
                this.client.emit(ERLCEvents.emergencyCallUpdate, oldCall, cachedCall);
            } else {
                const newCall = new EmergencyCall(this.client, rawData);
                this.cache.set(newCall.callNumber, newCall);
                this.client.emit(ERLCEvents.emergencyCallAdd, newCall);
            }
        }

        for (const cachedCall of this.cache.keys()) {
            if (!activeCalls.has(cachedCall)) {
                this.client.emit(ERLCEvents.emergencyCallRemove, this.cache.get(cachedCall)!);
                this.cache.delete(cachedCall);
            }
        }

        return this.cache;
    }

    /**
     * Adds a call to the emergency call cache with data from the webhook.
     * Emits emergencyCallAdd events.
     * @param callData - The raw emergency call payload from the webhook.
     */
    public addCall(callData: RawWebhookEmergencyCall) {
        const callNum = callData.callNumber;
        const cachedCall = this.cache.get(callNum);

        const pascalCallData = convertToPascalCase(callData) as RawEmergencyCall;

        if (cachedCall) {
            // Polling found first ignore.
            return;
        } else {
            const newCall = new EmergencyCall(this.client, pascalCallData);
            this.cache.set(newCall.callNumber, newCall);
            this.client.emit(ERLCEvents.emergencyCallAdd, newCall);
        }
    }

    /**
     * Removes a call from the emergency call cache with data from the webhook.
     * Emits emergencyCallRemove events.
     * @param callData - The raw emergency call payload from the webhook.
     */
    public removeCall(callData: RawWebhookEmergencyCall) {
        const callNum = callData.callNumber;
        const exists = this.cache.has(callNum);
        if (!exists) return;
        this.client.emit(ERLCEvents.emergencyCallRemove, this.cache.get(callNum)!);
        this.cache.delete(callNum);
    }
}
