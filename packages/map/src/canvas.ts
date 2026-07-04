import type { PlayerManager, Player } from "@erlcjs/core";
import { MapType } from "./enums";
import { fetchMap, fetchRobloxHeadshots } from "./util";
import sharp from "sharp";

export interface MapOptions {
    size?: 48 | 50 | 60 | 75 | 100 | 110 | 150 | 180;
}

export async function drawMap(players: PlayerManager | Player[], map: MapType | string | Buffer | ArrayBuffer, options: MapOptions = {}) {
    if (!Array.isArray(players)) players = Array.from(players.cache.values());
    if (!options.size) options.size = 60;
    const playerIds: number[] = []
    players.forEach(player => {
        playerIds.push(player.id);
    });
    
    let mapBuffer;
    if (Object.values(MapType).includes(map as any)) {
        mapBuffer = await fetchMap(map as MapType);
    } else {
        mapBuffer = map;
    }

    const image = sharp(mapBuffer);

    const playerHeadshots = players.length === 0 ? new Map() : await fetchRobloxHeadshots(playerIds, `${options.size}x${options.size}`);

    const composites = [];

    for (const player of players) {
        if (!playerHeadshots.has(player.id)) continue;
        const image = await fetch(playerHeadshots.get(player.id) as string);
        composites.push({
            input: await image.arrayBuffer(),
            left: Math.round(player.location.x - options.size/2),
            top: Math.round(player.location.z - options.size/2),
        })
    }

    image.composite(composites as any);

    return await image.png().toBuffer();
}