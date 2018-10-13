const token = process.env.TOKEN;
const members = require('./members.js');
const Discord = require('discord.js');

/**
 * Responds to any HTTP request with members a Discord Guild.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.getMembers = (req, res) => {
  const client = new Discord.Client({ fetchAllMembers: true, sync: true });
  client.on('ready', () => {
    const guild = client.guilds.first();
    const json = members.jsonFrom(guild);
    res.status(200).send(json);
    client.destroy();
  });
  client.login(token);
};
