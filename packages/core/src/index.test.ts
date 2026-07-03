import { Client, ERLCEvents, PlayerPermission, Vehicles } from './index.js';

const client = new Client({
    polling: {
        enabled: true,
    },
    webhook: {
        enabled: true,
        port: 3000,
    },
    serverKey: process.env.API_KEY!,
    globalKey: process.env.GLOBAL_KEY!,
    globalAppId: process.env.APP_ID!,
});

console.log(client.authorizationLink);

client.on(ERLCEvents.vehicleAdd, (vehicle) => {
    if (vehicle.name === Vehicles.CHEVLON_COMMUTER_VAN_2006) {
        vehicle.owner.message('Restricted vehicle. Change.');
        setTimeout(() => {
            if (
                client.vehicles.cache.get(vehicle.plate)?.ownerId !== vehicle.ownerId &&
                client.vehicles.cache.get(vehicle.plate)?.name !== vehicle.name
            )
                return;
            vehicle.owner.message('Change the vehicle in 10 seconds or you will be kicked.');
        }, 10000);
    }
});

client.on(ERLCEvents.playerJoin, (player) => {
    console.log(player);
});

client.registerCommand({
    name: 'test',
    aliases: [ 'another' ],
    execute: ({ player, args }) => {
        console.log(`Player ${player.username} executed the test command with arguments: ${args.join(', ')}`);
        player.message(`Hello ${player.username}, you executed the test command with arguments: ${args.join(', ')}`);
    }
})

client.registerCommand({
    name: 'ismod',
    permission: [ PlayerPermission.Mod ],
    execute: ({ player, args }) => {
        player.message('You are a mod.')
    }
})

client.registerCommand({
    name: 'isowner',
    permission: [ PlayerPermission.Owner ],
    execute: ({ player, args }) => {
        player.message('You are the owner.')
    }
})