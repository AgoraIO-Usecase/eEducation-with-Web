import { useState, useEffect } from 'react';

const noop = () => {};

interface MediaDeviceInfo {
  label: string;
  deviceId: string;
}

const useCameras = (client: any): MediaDeviceInfo[] => {
  const [cameraList, setCameraList] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    const onChange = () => {
      if (!client) {
        return;
      }
      client
        .getCameras()
        .then((cameras: MediaDeviceInfo[]) => {
          if (mounted) {
            setCameraList(cameras);
          }
        })
        .catch(noop);
    };
    
    client && client.on('cameraChanged', onChange);
    
    onChange();

    return () => {
      mounted = false;
      client && client.gatewayClient.removeEventListener('cameraChanged', onChange);
    };
  }, []);

  return cameraList;
};

export default useCameras;
