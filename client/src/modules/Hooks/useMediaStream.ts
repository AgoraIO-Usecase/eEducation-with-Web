import { useState, useEffect } from 'react';
import { Map } from 'immutable';

import {hooksLog} from '../../utils/logger';

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
      const id = stream.getId()
      hooksLog(`=>>> incoming remote stream ${id} =>>>`)
      setStreamList(streamList.set(id, stream));
    };
    // remove stream
    const removeRemote = (evt: any) => {
      const {stream} = evt;
      if (stream) {
        const id = stream.getId();
        hooksLog(`=>>> remove remote stream ${id} =>>>`)
        setStreamList(streamList.remove(id));
      }
    }
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
      const id = stream.getId();
      hooksLog(`=>>> incoming local stream ${id} =>>>`)
      setStreamList(streamList.set(id, stream));
    };

    client.on('stream-published', addLocal);
    client.on('stream-added', doSub);
    client.on('stream-subscribed', addRemote);
    client.on('peer-leave', removeRemote);
    client.on('stream-removed', removeRemote);

    return () => {
      mounted = false;
      client.gatewayClient.removeEventListener('stream-published', addLocal);
      client.gatewayClient.removeEventListener('stream-added', doSub);
      client.gatewayClient.removeEventListener('stream-subscribed', addRemote);
      client.gatewayClient.removeEventListener('peer-leave', removeRemote);
      client.gatewayClient.removeEventListener('stream-removed', removeRemote);
    };
  }, []);

  return streamList;
};

export default useMediaStream;
