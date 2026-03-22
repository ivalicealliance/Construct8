const token = process.env.TOKEN;
const members = require('./members.js');
const {
  ActivityType,
  Client,
  GatewayIntentBits,
} = require('discord.js');

const CACHE_TTL_MS = 5000;

let cachedResponse = null;
let pendingResponse = null;

function setAccessControl(res) {
  res.set('Access-Control-Allow-Origin', process.env.ORIGIN);
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

function guildFrom(client) {
  if (client.guilds.cache.size !== 1) {
    throw new Error('Expected bot to have access to exactly one guild.');
  }

  return client.guilds.cache.first();
}

function fetchResponse() {
  if (!token) {
    return Promise.reject(new Error('TOKEN environment variable is required.'));
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ],
    presence: {
      activities: [{
        name: 'Constructing',
        type: ActivityType.Playing,
      }],
      status: 'online',
    },
  });

  return new Promise((resolve, reject) => {
    client.once('ready', async () => {
      try {
        const guild = guildFrom(client);
        await guild.roles.fetch();
        await guild.members.fetch({ withPresences: true });
        resolve({
          lastModified: Date.now(),
          json: members.jsonFrom(guild),
        });
      } catch (error) {
        reject(error);
      } finally {
        client.destroy();
      }
    });

    client.once('error', (error) => {
      client.destroy();
      reject(error);
    });

    client.login(token).catch((error) => {
      client.destroy();
      reject(error);
    });
  });
}

function sendInternalError(res, error) {
  console.error(error);
  return res.status(500).send('Unable to fetch guild members.');
}

function updateCacheAndSendResponse(res) {
  if (pendingResponse === null) {
    pendingResponse = fetchResponse()
      .then((response) => {
        cachedResponse = response;
        return response;
      })
      .finally(() => {
        pendingResponse = null;
      });
  }

  return pendingResponse
    .then(response => res.status(200).send(response.json))
    .catch(error => sendInternalError(res, error));
}

function cacheIsValid() {
  if (cachedResponse === null) {
    return false;
  }

  const expiration = cachedResponse.lastModified + CACHE_TTL_MS;
  return expiration >= Date.now();
}

/**
 * Responds to any HTTP request with members and roles in a Discord Guild.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.getMembers = (req, res) => {
  setAccessControl(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (cacheIsValid()) {
    return res.status(200).send(cachedResponse.json);
  } else {
    return updateCacheAndSendResponse(res);
  }
};
