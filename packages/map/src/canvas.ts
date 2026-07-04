import type { PlayerManager, Player, EmergencyCallManager, EmergencyCall } from "@erlcjs/core";
import { MapType } from "./enums";
import { fetchMap, fetchRobloxHeadshots } from "./util";
import sharp from "sharp";

const TEAM_COLORS: Record<string, string> = {
    'Police': '#1a5276',
    'Fire': '#c0392b',
    'DOT': '#de9e1d',
    'Sheriff': '#bbc37d',
};

function getTeamColor(team: string): string {
    return TEAM_COLORS[team] ?? '#95a5a6';
}

export interface MapOptions {
    size?: 48 | 50 | 60 | 75 | 100 | 110 | 150 | 180;
    players?: PlayerManager | Player[];
    emergencyCalls?: EmergencyCallManager | EmergencyCall[];
    map: MapType | string | Buffer | ArrayBuffer;
}

function createPlayerPinSVG(size: number, color: string): string {
    const pinSize = Math.round(size * 1.6);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinSize}" viewBox="0 0 24 24">
  <path fill="${color}" d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0" />
</svg>`;
}

function createEmergencyCallSVG(size: number, color: string): string {
    const mw = Math.round(size * 0.56);
    const rh = Math.round(size * 0.56);
    const th = Math.round(size * 0.44);
    const totalHeight = rh + th;
    const cx = mw / 2;
    
    return `<svg width="${mw}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${mw}" height="${rh}" fill="${color}" />
    <text x="${cx}" y="${Math.round(rh)}" text-anchor="middle" font-size="${Math.round(rh)}" font-weight="bold" fill="white" font-family="Arial, sans-serif">!</text>
    <polygon points="${cx},${totalHeight} ${mw},${rh} 0,${rh}" fill="${color}" />
</svg>`;
}

export async function drawMap(options: MapOptions) {
    const { players: playersInput, emergencyCalls: emergencyCallsInput, map, size: sizeOption } = options;
    const size = sizeOption ?? 60;

    let playersArr: Player[] | undefined;
    if (playersInput) {
        playersArr = Array.isArray(playersInput) ? playersInput : Array.from(playersInput.cache.values());
    }

    let emergencyCallsArr: EmergencyCall[] | undefined;
    if (emergencyCallsInput) {
        emergencyCallsArr = Array.isArray(emergencyCallsInput) ? emergencyCallsInput : Array.from(emergencyCallsInput.cache.values());
    }

    let mapBuffer;
    if (Object.values(MapType).includes(map as any)) {
        mapBuffer = await fetchMap(map as MapType);
    } else {
        mapBuffer = map;
    }

    const image = sharp(mapBuffer);
    const composites: any[] = [];

    if (playersArr && playersArr.length > 0) {
        const playerIds = playersArr.map(p => p.id);
        const playerHeadshots = await fetchRobloxHeadshots(playerIds, `${size}x${size}`);

        for (const player of playersArr) {
            if (!playerHeadshots.has(player.id)) continue;
            const color = getTeamColor(player.team);
            const pinSVG = createPlayerPinSVG(size, color);
            const pinSize = Math.round(size * 1.6);
            composites.push({
                input: Buffer.from(pinSVG),
                left: Math.round(player.location.x - pinSize / 2),
                top: Math.round(player.location.z - pinSize * 11 / 12),
            });
            const headshotRes = await fetch(playerHeadshots.get(player.id) as string);
            composites.push({
                input: await headshotRes.arrayBuffer(),
                left: Math.round(player.location.x - size / 2),
                top: Math.round(player.location.z - size / 2 - pinSize / 2),
            });
        }
    }

    if (emergencyCallsArr && emergencyCallsArr.length > 0) {
        const mw = Math.round(size * 0.56);
        const rh = Math.round(size * 0.56);
        const th = Math.round(size * 0.44);
        const totalHeight = rh + th;

        for (const call of emergencyCallsArr) {
            const color = getTeamColor(call.team);
            const emSVG = createEmergencyCallSVG(size, color);
            composites.push({
                input: Buffer.from(emSVG),
                left: Math.round(call.position![0]! - mw / 2),
                top: Math.round(call.position![1]! - totalHeight),
            });
        }
    }

    image.composite(composites);

    return await image.png().toBuffer();
}