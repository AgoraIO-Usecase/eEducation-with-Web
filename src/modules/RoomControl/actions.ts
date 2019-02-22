/**
 * Defined ACTIONS sent to signaling server
 */

export const MUTEVIDEO = (uids: number[]) => ({
  action: 'MUTEVIDEO',
  target: uids
});
export const MUTEAUDIO = (uids: number[]) => ({
  action: 'MUTEAUDIO',
  target: uids
});

export const UNMUTEVIDEO = (uids: number[]) => ({
  action: 'UNMUTEVIDEO',
  target: uids
});
export const UNMUTEAUDIO = (uids: number[]) => ({
  action: 'UNMUTEAUDIO',
  target: uids
});

export const DISABLECHAT = (uids: number[]) => ({
  action: 'DISABLECHAT',
  target: uids
});

export const ENABLECHAT = (uids: number[]) => ({
  action: 'ENABLECHAT',
  target: uids
});

export const JOIN = (uid: number, role: ClientRole, name: string) => ({
  action: 'JOIN',
  target: uid,
  role: role,
  name: name
});

export const LEAVE = (uid: number) => ({
  action: 'LEAVE',
  target: uid
});

export const STARTSCREENSHARE = (uid: number, shareID: number) => ({
  action: 'STARTSCREENSHARE',
  target: uid,
  shareID: shareID
});

export const STOPSCREENSHARE = (uid: number, shareID: number) => ({
  action: 'STOPSCREENSHARE',
  target: uid,
  shareID: shareID
});

export const HANDUP = (uid: number) => ({
  action: 'HANDUP',
  target: uid
});

export const CHANGEROLE = (uid: number, role: ClientRole) => ({
  action: 'CHANGEROLE',
  target: uid,
  role: role
});

export const ADDPAGE = () => ({
  action: 'ADDPAGE'
});
