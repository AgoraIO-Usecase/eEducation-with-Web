import { useState, useEffect } from 'react';
import { Map } from 'immutable';

const useMediaStream = (client: any): Map<number, any> => {
  const [streamList, setStreamList] = useState<Map<number, any>>(Map());

  useEffect(() => {
    let mounted = true;
    // add when subscribed
    const addRemote = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      setStreamList(streamList.set(stream.getId(), stream));
    };
    // subscribe when added
    const doSub = (evt: any) => {
      if (!mounted) {
        return;
      }
      client.subscribe(evt.stream);
    };
    // add when published
    const addLocal = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      setStreamList(streamList.set(stream.getId(), stream));
    };

    client.on('stream-published', addLocal);
    client.on('stream-added', doSub);
    client.on('stream-subscribed', addRemote);

    return () => {
      mounted = false;
      client.gatewayClient.removeEventListener('stream-published', addLocal);
      client.gatewayClient.removeEventListener('stream-added', doSub);
      client.gatewayClient.removeEventListener('stream-subscribed', addRemote);
    };
  }, []);

  return streamList;
};

export default useMediaStream;
