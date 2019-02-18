enum VideoProfiles {
  LOW = "120p",
  STANDARD = "480p_2",
  HIGH = "720p_3"
}

enum Mode {
  LIVE = "live",
  RTC = "rtc"
}

enum Codec {
  VP8 = "vp8",
  H264 = "h264"
}

enum ClientRole {
  AUDIENCE = 0,
  STUDENT = 1,
  TEACHER = 2,
}

interface MediaDevice {
  label: string;
  deviceId: string;
}

/** typical type */

interface UserInfo {
  uid: string | number,
  name: string,
  role: ClientRole,
}

interface AdapterConfig {
  videoProfile?: VideoProfiles,
  mode?: Mode,
  codec?: code,
  appId?: string,
  channel?: string,
  shareId?: number,
  cameraId?: string,
  microphoneId?: string,
  // tbc
}

enum StreamControlAction {
  MUTE_VIDEO = 0,
  UNMUTE_VIDEO = 1,
  MUTE_AUDIO = 2,
  UNMUTE_AUDIO = 3,
}
