export enum VideoProfiles {
  LOW = '120p',
  STANDARD = '480p_2',
  HIGH = '720p_3'
}

export enum Mode {
  LIVE = 'live',
  RTC = 'rtc'
}

export enum Codec {
  VP8 = 'vp8',
  H264 = 'h264'
}

export enum ClientRole {
  AUDIENCE = 0,
  STUDENT = 1,
  TEACHER = 2
}

export interface RTCEngineConfig {
  channel: string;
  streamId: number
  role: ClientRole;

  // cameraId?: string;
  // microphoneId?: string;
  // videoProfile?: VideoProfiles;
  mode?: Mode;
  codec?: Codec;
  shareId?: number;

  [propName: string]: any;
}

export interface SignalConfig {
  channel: string;
  uid: string;
  streamId: number
  name: string;
  role: ClientRole;
}

export type AdapterConfig = SignalConfig & RTCEngineConfig

export interface UserAttr {
  role: ClientRole;
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
