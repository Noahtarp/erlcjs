import { Vehicle, Vehicles } from "@erlcjs/core"

interface Punishments {
    kick: "kick",
    load: "load"
}

interface Livery {
    livery: string,
    vehicle: Vehicles,
}