import { config } from 'dotenv';
config();

import fs from 'node:fs';
import path from 'node:path';

import { Client, Collection, GatewayIntentBits } from 'discord.js';

class ExtendedClient extends Client {
  public commands: Collection<string, any> = new Collection();
}

const client = new ExtendedClient({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default || require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] //// The command at ${filePath} is missing a required a "data" or "execute"  property`);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath).default || require(filePath);
  if (event.once) {
    client.once(event.name, (...args: any[]) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args: any[]) => event.execute(client, ...args));
  }
}

const token = process.env.DISCORD_TOKEN!;
client.login(token);
