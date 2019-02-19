export enum VideoProfiles {
  LOW = "120p",
  STANDARD = "480p_2",
  HIGH = "720p_3"
}

export enum Mode {
  LIVE = "live",
  RTC = "rtc"
}

export enum Codec {
  VP8 = "vp8",
  H264 = "h264"
}

export enum ClientRole {
  AUDIENCE = 0,
  STUDENT = 1,
  TEACHER = 2
}

export enum StreamControlAction {
  MUTE_VIDEO = 0,
  UNMUTE_VIDEO = 1,
  MUTE_AUDIO = 2,
  UNMUTE_AUDIO = 3
}

export interface AdapterState {
  appId: string;
  videoProfile?: VideoProfiles;
  mode?: Mode;
  codec?: Codec;
  channel?: string;
  shareId?: number;
  cameraId?: string;
  microphoneId?: string;
  uid?: number;
  name?: string;
  role?: ClientRole;
  [propName: string]: any;
  // tbc
}
