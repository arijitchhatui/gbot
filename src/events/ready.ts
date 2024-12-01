import { Client, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client): void {
		if(client.user){
			console.log(`Logged in as ${client.user?.tag}`);
		} else {
			console.log(`Client user is not defined!`)
		}
  },
};
