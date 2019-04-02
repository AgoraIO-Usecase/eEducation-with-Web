declare namespace RoomControlRequest {
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
      userAttr: RoomControl.UserAttr;
      channelAttr?: RoomControl.ChannelAttr;
    };
  }

  // export interface Leave extends Request {
  //   name: "Leave";
  // }

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

  export interface Unmute extends Request {
    name: "Unmute";
    args: {
      type: "video" | "audio" | "chat";
      target: string | string[];
    };
  }

  export interface Ring extends Request {
    name: "Ring";
  }

  export interface CustomRequest extends Request {
    name: 'CustomRequest',
    args: {
      type: string;
      uid: string;
    }
  }

  export interface UpdateUserAttr extends Request {
    name: "UpdateUserAttr";
    args: {
      userAttr: Partial<RoomControl.UserAttr>;
      uid: string
    };
  }

  export interface UpdateChannelAttr extends Request {
    name: "UpdateChannelAttr";
    args: {
      channelAttr: Partial<RoomControl.ChannelAttr>;
    };
  }
}

declare namespace RoomControlResponse {
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

  export interface JoinSuccess extends Response {
    name: "JoinSuccess";
    args: {
      channelAttr: RoomControl.ChannelAttr;
      members: Array<RoomControl.UserAttr & { uid: string }>;
    };
  }

  export interface JoinFailure extends Response {
    name: "JoinFailure";
    args: {
      info: string;
    };
  }

  export interface MemberLeft extends Response {
    name: "MemberLeft";
    args: {
      uid: string;
    };
  }

  export interface MemberJoined extends Response {
    name: "MemberJoined";
    args: {
      uid: string;
    } & RoomControl.UserAttr;
  }

  export interface ChannelMessage extends Response {
    name: "ChannelMessage";
    args: {
      uid: string;
      message: string;
    };
  }

  export interface Muted extends Response {
    name: "Muted";
    args: {
      type: "video" | "audio" | "chat";
      uid: string;
    };
  }

  export interface Unmuted extends Response {
    name: "Unmuted";
    args: {
      type: "video" | "audio" | "chat";
      uid: string;
    };
  }

  export interface Ringing extends Response {
    name: "Ringing";
    args: {
      uid: string;
    };
  }

  export interface CustomRequest extends Response {
    name: 'CustomRequest',
    args: {
      type: string;
      uid: string;
    }
  }

  export interface UserAttrUpdated extends Response {
    name: "UserAttrUpdated";
    args: {
      userAttr: Partial<RoomControl.UserAttr>;
      target: string;
      uid: string
    };
  }

  export interface ChannelAttrUpdated extends Response {
    name: "ChannelAttrUpdated";
    args: {
      channelAttr: Partial<RoomControl.ChannelAttr>;
      uid: string;
    };
  }
}

declare namespace RoomControl {
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
    [props: string]: string | number;
  }

  export interface ChannelAttr {
    isSharing: number;
    isRecording: number;
    shareId: number;
    whiteboardId: string;
    teacherId: string;
    [props: string]: string | number;
  }
}
