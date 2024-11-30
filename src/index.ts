import { config } from 'dotenv';
config();

import fs from 'node:fs';
import path from 'node:path';

import { Client, Collection, Events, GatewayIntentBits, Interaction } from 'discord.js';

class ExtendedClient extends Client {
  private cmd = 0;
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
    const command = require(filePath).default;
    if (command && 'data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required a "data" or "execute"  property`);
    }
  }
}

client.once(Events.ClientReady, (readyClient: Client<true>) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing the command',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing the command',
        ephemeral: true,
      });
    }
  }
});

const token = process.env.DISCORD_TOKEN;
client.login(token);
