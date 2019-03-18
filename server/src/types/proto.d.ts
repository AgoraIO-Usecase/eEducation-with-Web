declare namespace RoomControlProto {
  // Request
  export interface Request {
    name: string;
    args?: {
      [props: string]: any;
    };
  }

  export interface Join extends Request {
    name: "Join";
    args: {
      channel: string;
    };
  }

  export interface Leave extends Request {
    name: "Leave";
  }

  export interface StartShare extends Request {
    name: "StartShare";
    args: {
      uid: string | number;
    };
  }

  export interface StopShare extends Request {
    name: "StopShare";
    args: {
      uid: string | number;
    };
  }

  export interface Chat extends Request {
    name: "Chat";
    args: {
      message: string;
    };
  }

  export interface Mute extends Request {
    name: "Mute";
    args: {
      type: "video" | "audio" | "chat";
      target: string | string[];
    };
  }

  export interface UnMute extends Request {
    name: "UnMute";
    args: {
      type: "video" | "audio" | "chat";
      target: string | string[];
    };
  }

  export interface Ring extends Request {
    name: "Ring";
  }

  export interface Promote extends Request {
    name: "Promote";
    args: {
      uid: string;
    };
  }

  export interface Demote extends Request {
    name: "Demote";
    args: {
      uid: string;
    };
  }

  export interface ChangeRole extends Request {
    name: "Request";
    args: {
      type: "promote" | "demote";
    };
  }

  // Result
  export interface Response {
    name: string;
    args?: {
      [props: string]: any;
    };
  }

  export interface ThrowError extends Response {
    name: "Error";
    args: {
      info: string;
    };
  }

  // Others
  export enum Role {
    Audience = 0,
    Student,
    Teacher
  }

  export interface UserAttr {
    role: Role;
    name: string;
    streamId: number;
    channel: string;
    [props: string]: string|number;
  }

  export interface ChannelAttr {
    isSharing: number;
    isRecording: number;
    shareId: number;
    whiteboardId: string;
    teacherId: string;
  }
}
