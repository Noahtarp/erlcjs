import { Vehicles } from "@erlcjs/core"

export interface Punishments {
    kick: "kick",
    load: "load"
}

export interface Livery {
    livery: string,
    vehicle: Vehicles,
}