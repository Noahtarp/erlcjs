import { Client, ERLCEvents } from '../client/client.js';
import { Collection } from '../index.js';
import { Vehicle } from '../structures/vehicle.js';
import type { RawServerData, RawVehicle } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating Vehicle structures.
 * @public
 */
export class VehicleManager {
    /**
     * Collection cache of spawned vehicles in the server, keyed by their license plate.
     */
    public cache = new Collection<string, Vehicle>();

    /**
     * Creates an instance of VehicleManager.
     * @param client - The erlcjs client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all active vehicles currently spawned in the game server.
     * Updates the vehicle cache.
     * @returns A promise resolving to a Collection of active Vehicles.
     */
    public async fetchAll(): Promise<Collection<string, Vehicle>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?Vehicles=true',
        );
        const rawVehicles: RawVehicle[] = rawServer.Vehicles ?? [];

        return this.updateCache(rawVehicles);
    }

    /**
     * Re-synchronizes the cache with the raw vehicle list from the API.
     * Emits vehicleAdd, vehicleRemove, and vehicleUpdate events.
     * @param rawVehicles - Raw vehicle list payload.
     * @returns The updated Vehicle cache Collection.
     */
    public updateCache(rawVehicles: RawVehicle[]) {
        const activePlates = new Set<string>();

        for (const rawData of rawVehicles) {
            const plate = rawData.Plate;
            activePlates.add(plate);
            const cachedVehicle = this.cache.get(plate);

            if (cachedVehicle) {
                const oldVehicle = new Vehicle(this.client, cachedVehicle.toJSON());
                cachedVehicle._patch(rawData);
                if (oldVehicle.name === rawData.Name) {
                    this.client.emit(ERLCEvents.vehicleUpdate, oldVehicle, cachedVehicle);
                } else {
                    this.client.emit(ERLCEvents.vehicleRemove, oldVehicle);
                    this.client.emit(ERLCEvents.vehicleAdd, cachedVehicle);
                }
            } else {
                const newVehicle = new Vehicle(this.client, rawData);
                this.cache.set(newVehicle.plate, newVehicle);
                this.client.emit(ERLCEvents.vehicleAdd, newVehicle);
            }
        }

        for (const cachedPlate of this.cache.keys()) {
            if (!activePlates.has(cachedPlate)) {
                this.client.emit(ERLCEvents.vehicleRemove, this.cache.get(cachedPlate)!);
                this.cache.delete(cachedPlate);
            }
        }

        return this.cache;
    }
}
