import { config } from 'dotenv';
config();

import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

const commands: any[] = [];


const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default || require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`[WARNING] The command at ${filePath} is a missing "data" or "execute" property`);
    }
  }
}
console.log(`Loaded ${commands.length} commands:`, commands);

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId || !guildId) {
  throw new Error('Missing variables.....');
}

const rest = new REST().setToken(token);
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands`);
    const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log(`Successfully reloaded ${(data as any).length} application (/) commands`);
  } catch (error) {
    console.error(error);
  }
})();
