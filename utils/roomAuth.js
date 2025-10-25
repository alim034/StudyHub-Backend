export const isMember = (room, userId) =>
  room.members.map((id) => id.toString()).includes(userId.toString());

export const isAdmin = (room, userId) =>
  room.admin.toString() === userId.toString();