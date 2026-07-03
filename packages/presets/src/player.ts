import { Player } from "@erlcjs/core";

export function welcomePlayer(message?: string) {
    return (player: Player) => {
        player.message(message ?? `Welcome to ${player.client.server.cache?.name}!`);
    }
}