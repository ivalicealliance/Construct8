function priorityFrom(status) {
  switch (status) {
    case 'online':
      return 2;
    case 'idle':
      return 1;
    case 'dnd':
      return 0;
    case 'offline':
      return -1;
    default:
      return -2;
  }
}

function membersFrom(guild) {
  return guild.members.cache
    .filter(guildMember => guildMember.roles.highest.position > 0)
    .map((guildMember) => {
      const name = guildMember.nickname || guildMember.displayName;
      return {
        name,
        position: guildMember.roles.highest.position,
        avatar: guildMember.user.avatarURL,
        presence: guildMember.presence,
        joinedTimestamp: guildMember.joinedTimestamp,
      };
    })
    .sort((lhs, rhs) => {
      const positionDescending = rhs.position - lhs.position;
      const lhsPriority = priorityFrom(lhs.presence.status);
      const rhsPriority = priorityFrom(rhs.presence.status);
      const onlineDescending = rhsPriority - lhsPriority;
      const timestampAscending = lhs.joinedTimestamp - rhs.joinedTimestamp;
      return positionDescending || onlineDescending || timestampAscending;
    });
}

function rolesFrom(guild) {
  return guild.roles.cache
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

exports.jsonFrom = function jsonFrom(guild) {
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
};
