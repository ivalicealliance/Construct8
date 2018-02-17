const fs = require('fs');

function membersFrom(guild) {
  return guild.members
    .filter(guildMember => guildMember.highestRole.calculatedPosition > 0)
    .map((guildMember) => {
      const name = guildMember.nickname || guildMember.displayName;
      return {
        name,
        position: guildMember.highestRole.calculatedPosition,
        avatar: guildMember.user.avatarURL,
        presence: guildMember.presence,
        joinedTimestamp: guildMember.joinedTimestamp,
      };
    })
    .sort((lhs, rhs) => {
      const positionDescending = rhs.position - lhs.position;
      const timestampAscending = lhs.joinedTimestamp - rhs.joinedTimestamp;
      return positionDescending || timestampAscending;
    });
}

function rolesFrom(guild) {
  return guild.roles
    .filter(role => role.position > 0)
    .sort((lhs, rhs) => rhs.position - lhs.position)
    .reduce((previous, current) => {
      const role = {
        name: current.name,
        position: current.position,
      };
      previous.push(role);
      return previous;
    }, []);
}

function jsonFrom(guild) {
  const members = membersFrom(guild);
  const roles = rolesFrom(guild);
  const meta = {
    name: guild.name,
    membercount: Object.keys(members).length,
    rolecount: Object.keys(roles).length,
    lastModified: Date.now(),
  };
  const memberList = {
    meta,
    members,
    roles,
  };
  return JSON.stringify(memberList, null, 2);
}

function writeMembers(json) {
  fs.writeFile('public/members.json', json, (err) => {
    if (err) throw err;
  });
}

exports.write = function write(guild) {
  writeMembers(jsonFrom(guild));
};
