const token = process.env.TOKEN;
const members = require('./members.js');
const Discord = require('discord.js');

let cachedResponse = null;

function setAccessControl(res) {
  res.set('Access-Control-Allow-Origin', process.env.ORIGIN);
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

function updateCacheAndSendResponse(res) {
  const client = new Discord.Client({ fetchAllMembers: true, sync: true });
  client.on('ready', () => {
    const guild = client.guilds.first();
    const json = members.jsonFrom(guild);
    cachedResponse = { lastModified: Date.now(), json };
    res.status(200).send(json);
    client.destroy();
  });
  client.login(token);
}

function cacheIsValid() {
  if (cachedResponse === null) {
    return false;
  }

  const expiration = cachedResponse.lastModified + 5000;
  return expiration >= Date.now();
}

/**
 * Responds to any HTTP request with members a Discord Guild.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.getMembers = (req, res) => {
  setAccessControl(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  }

  if (cacheIsValid()) {
    res.status(200).send(cachedResponse.json);
  } else {
    updateCacheAndSendResponse(res);
  }
};
