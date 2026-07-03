import { CommandLog, PlayerPermission } from "@erlcjs/core";

export function banCommand(commands: string | string[], action: (log: CommandLog) => void, startsWith: boolean = true, allowlist?: (number | PlayerPermission)[]) {
    if (typeof commands === 'string') commands = [commands];
    return (log: CommandLog) => {
        if (allowlist) {
            for (const allow of allowlist) {
                if (typeof allow === 'string') {
                    if (log.player.permission === allow) return;
                } else {
                    if (log.playerId === allow) return;
                }
            }
        }

        for (const command of commands) {
            if (startsWith && log.command.startsWith(command.trim())) {
                action(log);
            } else if (!startsWith && log.command.trim() === command) {
                action(log);
            }
        }
    }
}

export class CommandPunishments {
    public static removePermissions(): (log: CommandLog) => void {
        return (log: CommandLog) => {
            if (log.player.permission === 'Server Administrator') log.player.unadmin();
            if (log.player.permission === 'Server Moderator') log.player.unmod();
        }
    }

    public static kick(): (log: CommandLog) => void {
        return (log: CommandLog) => {
            this.removePermissions()(log);
            log.player.kick();
        }
    }

    public static ban(): (log: CommandLog) => void {
        return (log: CommandLog) => {
            this.removePermissions()(log);
            log.player.ban();
        }
    }
}