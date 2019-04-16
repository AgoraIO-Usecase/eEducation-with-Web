import { useState, useEffect } from "react";

import { createLogger } from "../../utils";

const useStreamLog = createLogger("[UseStreamHook]", "#fff", "#1890ff", true);

const useMediaStream = (client: any, filter?: (streamId: number) => boolean): any[] => {
  const [streamList, setStreamList] = useState<any[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    // add when subscribed
    const addRemote = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      const id = stream.getId();
      useStreamLog(`=>>> incoming remote stream ${id} =>>>`);
      setStreamList(streamList => {
        streamList.push(stream);
        return streamList;
      });
      setCount(count => count + 1);
    };
    // remove stream
    const removeRemote = (evt: any) => {
      const { stream } = evt;
      if (stream) {
        const id = stream.getId();
        useStreamLog(`=>>> remove remote stream ${id} =>>>`);
        const index = streamList.findIndex(item => item.getId() === id);
        if (index !== -1) {
          setStreamList(streamList => {
            streamList.splice(index, 1);
            return streamList;
          });
          setCount(count => count - 1);
        }
      }
    };
    // subscribe when added
    const doSub = (evt: any) => {
      if (!mounted) {
        return;
      }
      if (filter) {
        if (filter(evt.stream.getId())) {
          client.subscribe(evt.stream);
        }
      } else {
        client.subscribe(evt.stream);
      }
    };
    // add when published
    const addLocal = (evt: any) => {
      if (!mounted) {
        return;
      }
      const { stream } = evt;
      const id = stream.getId();
      useStreamLog(`=>>> incoming local stream ${id} =>>>`);
      const tempList = [...streamList];
      tempList.push(stream);
      setStreamList(streamList => {
        streamList.push(stream);
        return streamList;
      });
      setCount(count => count + 1);
    };
    if (client) {
      client.on("stream-published", addLocal);
      client.on("stream-added", doSub);
      client.on("stream-subscribed", addRemote);
      client.on("peer-leave", removeRemote);
      client.on("stream-removed", removeRemote);
    }

    return () => {
      mounted = false;
      if (client) {
        client.gatewayClient.removeEventListener("stream-published", addLocal);
        client.gatewayClient.removeEventListener("stream-added", doSub);
        client.gatewayClient.removeEventListener("stream-subscribed", addRemote);
        client.gatewayClient.removeEventListener("peer-leave", removeRemote);
        client.gatewayClient.removeEventListener("stream-removed", removeRemote);
      }

    };
  }, [0]);

  return [streamList, count];
};

export default useMediaStream;
