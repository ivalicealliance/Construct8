# Construct8

Construct8 is an HTTP function that logs into Discord, reads the first guild available to the bot, and returns a JSON snapshot of the server structure for external consumption.

The response includes:

- Guild metadata
- Visible roles with members
- Members who have at least one non-default role

It is intended for frontend or static-site use and includes basic CORS handling plus a short in-memory cache.

## What It Does

When the exported `getMembers` handler receives a request, it:

1. Applies CORS headers using configured environment variables.
2. Returns a cached response if it is less than 5 seconds old.
3. Otherwise logs into Discord with the bot token.
4. Reads the first guild from the bot's cache.
5. Builds and returns a JSON snapshot of roles and members.

## Installation

```bash
npm install
```

## Environment Variables

Set these variables in the environment where the function runs:

- `TOKEN`: Discord bot token used to log in.
- `ORIGIN`: Allowed CORS origin returned in `Access-Control-Allow-Origin`.
- `URL`: Value used in the bot presence activity URL.

## HTTP Handler

The function exports:

```js
exports.getMembers = (req, res) => { ... }
```

Behavior:

- `OPTIONS` requests return `204`.
- `GET` requests return the cached or freshly generated guild snapshot.

## Response Shape

The handler returns formatted JSON like:

```json
{
  "meta": {
    "name": "Example Guild",
    "membercount": 12,
    "rolecount": 4,
    "lastModified": 1710000000000
  },
  "members": [
    {
      "name": "Example Member",
      "position": 10,
      "avatar": "https://cdn.discordapp.com/...",
      "presence": {
        "status": "online"
      },
      "joinedTimestamp": 1700000000000
    }
  ],
  "roles": [
    {
      "name": "Admin",
      "position": 10
    }
  ]
}
```

## Sorting Rules

Members are sorted by:

1. Highest role position, descending
2. Presence priority, descending: `online`, `idle`, `dnd`, `offline`
3. Join timestamp, ascending

Roles are sorted by position, descending.

## Filtering Rules

- Members are included only if their highest role position is greater than `0`.
- Roles are included only if their position is greater than `0`.
- Roles with no members are excluded.

## Notes

- The implementation reads the first guild available to the bot client cache. If the bot belongs to multiple guilds, no explicit guild selection is performed.
- Responses are cached in memory for 5 seconds.

## License

See [LICENSE](LICENSE).
