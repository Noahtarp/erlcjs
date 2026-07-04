import type { PlayerManager, Player, EmergencyCallManager, EmergencyCall } from "@erlcjs/core";
import { MapType } from "./enums";
import { fetchMap, fetchRobloxHeadshots } from "./util";
import sharp from "sharp";

const TEAM_COLORS: Record<string, string> = {
    'Police': '#2563eb',
    'Fire': '#e11d2a',
    'DOT': '#f59e0b',
    'Sheriff': '#ca8a04',
};

function getTeamColor(team: string): string {
    return TEAM_COLORS[team] ?? '#64748b';
}

function shadeColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, Math.max(0, (num >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface MapOptions {
    size?: 48 | 50 | 60 | 75 | 100 | 110 | 150 | 180;
    players?: PlayerManager | Player[];
    emergencyCalls?: EmergencyCallManager | EmergencyCall[];
    map: MapType | string | Buffer | ArrayBuffer;
    showModCalls: boolean;
}

function createPlayerPinSVG(size: number, color: string): string {
    const pinSize = Math.round(size * 1.6);
    const light = shadeColor(color, 18);
    const dark = shadeColor(color, -22);
    const gradId = `pinGrad${Math.round(size)}${color.slice(1)}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pinSize}" height="${pinSize}" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${light}" />
      <stop offset="100%" stop-color="${dark}" />
    </linearGradient>
    <filter id="pinShadow" x="-40%" y="-20%" width="180%" height="160%">
      <feDropShadow dx="0" dy="0.6" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>
  <g filter="url(#pinShadow)">
    <path fill="url(#${gradId})" stroke="#ffffff" stroke-width="1" stroke-linejoin="round" d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0" />
    <circle cx="12" cy="9" r="6.1" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.85" />
  </g>
</svg>`;
}

function createModCallSVG(size: number, color: string): string {
    const modCallSize = Math.round(size * 0.6);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${modCallSize}" height="${modCallSize}" viewBox="0 0 56 56">
  <defs>
    <filter id="modShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>
  <g filter="url(#modShadow)">
    <circle cx="28" cy="28" r="26" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
    <path fill="#ffffff" d="M28 44.5c-1.243 0-1.922-.727-1.97-1.97L25.68 17.97c-.047-1.29.937-2.203 2.273-2.203c1.313 0 2.32.937 2.274 2.226l-.329 21.555c-.047 1.265-.75 1.969-1.921 1.969m0 4.5c-1.36 0-2.626-1.078-2.626-2.532s1.243-2.53 2.626-2.53c1.359 0 2.624 1.054 2.624 2.53c0 1.477-1.289 2.532-2.624 2.532" />
  </g>
</svg>`
}

function createHeadshotRingSVG(size: number, color: string): string {
    const ringSize = Math.round(size + 6);
    const r = ringSize / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}">
  <defs>
    <filter id="ringShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0.5" stdDeviation="0.9" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>
  <g filter="url(#ringShadow)">
    <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="#ffffff" stroke="${color}" stroke-width="3" />
  </g>
</svg>`;
}

function createEmergencyCallSVG(size: number, color: string): string {
    const d = Math.round(size * 0.62);
    const r = Math.round(d / 2);
    const tailH = Math.round(size * 0.28);
    const totalHeight = d + tailH;
    const dark = shadeColor(color, -22);

    return `<svg width="${d}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="emShadow" x="-40%" y="-20%" width="180%" height="160%">
      <feDropShadow dx="0" dy="0.6" stdDeviation="1" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>
  <g filter="url(#emShadow)">
    <polygon points="${r},${totalHeight} ${d - r * 0.28},${r * 1.55} ${r * 0.28},${r * 1.55}" fill="${dark}" />
    <circle cx="${r}" cy="${r}" r="${r - 1.2}" fill="${color}" stroke="#ffffff" stroke-width="2" />
    <text x="${r}" y="${Math.round(r * 1.32)}" text-anchor="middle" font-size="${Math.round(r * 1.15)}" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">!</text>
  </g>
</svg>`;
}

export async function drawMap(options: MapOptions) {
    const { players: playersInput, emergencyCalls: emergencyCallsInput, map, size: sizeOption, showModCalls: showModCallsInput } = options;
    const size = sizeOption ?? 60;
    const showModCalls = showModCallsInput ?? true;

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
                top: Math.round(player.location.z - pinSize * 23 / 24),
            });
            const ringSize = Math.round(size + 6);
            const ringSVG = createHeadshotRingSVG(size, color);
            composites.push({
                input: Buffer.from(ringSVG),
                left: Math.round(player.location.x - ringSize / 2),
                top: Math.round(player.location.z - ringSize / 2 - pinSize / 2),
            });
            const headshotRes = await fetch(playerHeadshots.get(player.id) as string);
            composites.push({
                input: await headshotRes.arrayBuffer(),
                left: Math.round(player.location.x - size / 2),
                top: Math.round(player.location.z - size / 2 - pinSize / 2),
            });
            if (showModCalls) {
                const filtered = player.client.modCalls.cache.filter(v => v.callerId === player.id && (v.moderatorId === null || v.moderatorId === undefined))
                if (filtered.size > 0) {
                    const modCallSVG = createModCallSVG(size, '#ffca2a');
                    const modCallSize = Math.round(size * 0.6);
                    composites.push({
                        input: Buffer.from(modCallSVG),
                        left: Math.round(player.location.x + modCallSize / 4),
                        top: Math.round(player.location.z - size / 2 - pinSize / 2 - modCallSize / 4),
                    })
                }
            }
        }
    }

    if (emergencyCallsArr && emergencyCallsArr.length > 0) {
        const d = Math.round(size * 0.62);
        const tailH = Math.round(size * 0.28);
        const totalHeight = d + tailH;

        for (const call of emergencyCallsArr) {
            const color = getTeamColor(call.team);
            const emSVG = createEmergencyCallSVG(size, color);
            composites.push({
                input: Buffer.from(emSVG),
                left: Math.round(call.position![0]! - d / 2),
                top: Math.round(call.position![1]! - totalHeight),
            });
        }
    }

    image.composite(composites);

    return await image.png().toBuffer();
}