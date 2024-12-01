import { Client, Collection, Events, Interaction, MessageFlags } from 'discord.js';

class ExtendedClient extends Client {
  public commands: Collection<string, any> = new Collection();
  public coolDowns: Collection<string, Collection<string, number>> = new Collection();
}

export default {
  name: Events.InteractionCreate,
  async execute(client: ExtendedClient, interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands?.get(interaction.commandName);
    console.log([...client.commands.keys()]);

    if (!command) {
      console.error(`No  command matching ${interaction.commandName} was found`);
    }
    client.coolDowns = new Collection();
    const { coolDowns } = client;

    if (!coolDowns.has(command.data.name)) {
      coolDowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timeStamps = coolDowns.get(command.data.name);
    const defaultCoolDownDuration = 3;
    const coolDownAmount = (command.coolDown ?? defaultCoolDownDuration) * 1000;

    if (timeStamps?.has(interaction.user.id)) {
      const expirationTime = (timeStamps.get(interaction.user.id) ?? 0) + coolDownAmount;

      if (now < expirationTime) {
        const expiredTimeStamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Please wait, you are on a cool down for \`${command.data.name}\`. You can use it again <t:${expiredTimeStamp}:R>`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    timeStamps?.set(interaction.user.id, now);
    setTimeout(() => timeStamps?.delete(interaction.user.id), coolDownAmount);
    try {
      await command.execute(interaction);
    } catch (error) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing the command',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing the command ',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
