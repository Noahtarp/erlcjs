import { Vehicle, ERLCEvents } from '@erlcjs/core';
import { type Livery } from './types/index.js';

export function banVehicles(vehicles: string[], action: (vehicle: Vehicle) => void, allowlist: number[]): (vehicle: Vehicle) => void {
    return (vehicle: Vehicle) => {
        if (vehicles.includes(vehicle.name) && !allowlist.includes(vehicle.ownerId)) {
            action(vehicle)
        }
    }
}

export function banLiveries(liveries: (Livery | string)[], action: (vehicle: Vehicle) => void, allowlist: number[]) {
    return (vehicle: Vehicle) => {
        if (!vehicle.texture) return;
        for (const livery of liveries) {
            if (typeof livery === 'string') {
                if (livery === vehicle.texture && !allowlist.includes(vehicle.ownerId)) {
                    action(vehicle);
                }
            } else if (livery.livery === vehicle.texture) {
                if (livery.vehicle === vehicle.texture || !livery.vehicle) {
                    action(vehicle);
                }
            }
        }
    }
}

export class VehiclePunishments {
    public static warnThenKick(delay: number = 10, warning: boolean = true, warningMessage?: string ): (vehicle: Vehicle) => void {
        return (vehicle: Vehicle) => {
            vehicle.owner.message('The vehicle you are using is restricted. Please change it.');
            setTimeout(async () => {
                await vehicle.client.waitFor(ERLCEvents.poll, 5000);
                if (
                    vehicle.client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                    vehicle.client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
                )
                    return;
                if (warning) {
                    vehicle.owner.message(`Change the vehicle in ${delay} seconds or you will be kicked.`);
                    setTimeout(async () => {
                        await vehicle.client.waitFor(ERLCEvents.poll, 5000);
                        if (
                            vehicle.client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                            vehicle.client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
                        )
                            return;
                        if (vehicle.owner.permission === 'Normal') vehicle.owner.kick('Failure to change from a banned vehicle.')
                    }, delay)
                } else if (vehicle.owner.permission === 'Normal') {
                    vehicle.owner.kick('Failure to change from a banned livery.')
                }
            }, delay)
        }
    }
}

export class LiveryPunishments {
    public static warnThenKick(delay: number = 10, warning: boolean = true): (vehicle: Vehicle) => void {
        return (vehicle: Vehicle) => {
            vehicle.owner.message('The livery you are using is restricted. Please change it.');
            setTimeout(async () => {
                await vehicle.client.waitFor(ERLCEvents.poll, 5000);
                if (
                    vehicle.client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                    vehicle.client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
                )
                    return;
                if (warning) {
                    vehicle.owner.message(`Change the livery in ${delay} seconds or you will be kicked.`);
                    setTimeout(async () => {
                        await vehicle.client.waitFor(ERLCEvents.poll, 5000);
                        if (
                            vehicle.client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                            vehicle.client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
                        )
                            return;
                        if (vehicle.owner.permission === 'Normal') vehicle.owner.kick('Failure to change from a banned livery.')
                    }, delay)
                } else if (vehicle.owner.permission === 'Normal') {
                    vehicle.owner.kick('Failure to change from a banned livery.')
                }
            }, delay)
        }
    }
}