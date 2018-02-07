const Discord = require('discord.js');
const secret = require('./secret.json');
const members = require('./members.js');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 5000;
const client = new Discord.Client({ fetchAllMembers: true, sync: true });
const server = express();
const allowedOrigin = 'https://ivalicealliance.net';
const redirectPage = 'https://github.com/ivalicealliance/construct8';
const options = {
  dotfiles: 'ignore',
  extensions: ['json'],
  setHeaders(res) {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
  },
};

client.on('ready', () => {
  const guild = client.guilds.first();
  members.write(guild);
});

client.on('guildUpdate', (_, newGuild) => {
  members.write(newGuild);
});

client.on('guildMemberAdd', (member) => {
  members.write(member.guild);
});

client.on('guildMemberRemove', (member) => {
  members.write(member.guild);
});

client.login(process.env.TOKEN || secret.token);

server
  .use(express.static(path.join(__dirname, 'public'), options))
  .listen(PORT);

server.get('/', (req, res) => {
  res.redirect(redirectPage);
});
