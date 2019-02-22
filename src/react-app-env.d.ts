/// <reference types="react-scripts" />

declare module 'agora-rtc-sdk' {
  const AgoraRTC: any;
  export default AgoraRTC;
}

declare module 'agora-stream-player' {
  const StreamPlayer: any;
  export default StreamPlayer;
}

declare enum ClientRole {
  AUDIENCE = 0,
  STUDENT = 1,
  TEACHER = 2
}
