import { useState, useEffect } from 'react';

const noop = () => {};

interface MediaDeviceInfo {
  label: string;
  deviceId: string;
}

const useMicrophones = (client: any): MediaDeviceInfo[] => {
  const [microphoneList, setMicrophoneList] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    const onChange = () => {
      client.getRecordingDevices((microphones: MediaDeviceInfo[]) => {
        if(mounted) {
          setMicrophoneList(microphones)
        }
      }, noop);
    };

    client.on('recordingDeviceChanged', onChange);
    onChange();

    return () => {
      mounted = false;
      client.gatewayClient.removeEventListener('recordingDeviceChanged', onChange);
    };
  }, []);

  return microphoneList;
}

export default useMicrophones;