import { Player } from "@erlcjs/core";

/**
 * Welcomes the player on join.
 * @param message - Optional custom message to send to player.
 * @example
 * ```typescript
 * client.on(ERLCEvents.playerJoin, welcomePlayer())
 * ```
 * @returns Callback function to pass into client event.
 */
export function welcomePlayer(message?: string) {
    return (player: Player) => {
        player.message(message ?? `Welcome to ${player.client.server.cache?.name}!`);
    }
}