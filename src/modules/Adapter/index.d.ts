interface MediaDevice {
  label: string;
  deviceId: string;
}

interface UserInfo {
  uid?: number,
  name?: string,
  role?: ClientRole,
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