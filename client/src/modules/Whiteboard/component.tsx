import { RoomWhiteboard } from "white-react-sdk";
import "white-web-sdk/style/index.css";
import { Spin, Pagination } from "antd";
import StreamPlayer from "agora-stream-player";

import Toolbar from "./Toolbar";
import WhiteboardAPI from "./whiteboard.api";
import React, { useMemo, FunctionComponent, useState, Fragment, useEffect } from "react";

interface WhiteboardComponentProps {
  floatButtonGroup?: Element[];
  startScreenShare: () => Promise<any>;
  stopScreenShare: () => any;
  role: ClientRole;
  shareStream?: any;
  // channel: string;
  uuid: string;
  roomToken: string
}

const WhiteboardComponent: FunctionComponent<
  WhiteboardComponentProps
> = props => {
  const [room, setRoom] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const displayStream = useMemo(() => {
    if (props.shareStream) {
      return props.shareStream
    } else if (stream) {
      return stream
    } else {
      return null
    }
  }, [props.shareStream, stream])

  useEffect(() => {
    subscribeWhiteboardEvents();
    if (props.uuid && props.roomToken) {
      WhiteboardAPI.join(props.uuid, props.roomToken)
    }
    // initWhiteboard(props.channel, props.uuid);

    return () => {
      WhiteboardAPI.removeAllListeners();
    }
  }, [props.uuid, props.roomToken])

  const setMemberState = (action: any) => {
    if (!room) {
      return;
    }
    room.setMemberState(action);
  };

  const onAddPage = () => {
    if (!room) {
      return;
    }
    const newPageIndex = totalPage + 1;
    const newTotalPage = totalPage + 1;
    setCurrentPage(newPageIndex);
    setTotalPage(newTotalPage);
    room.insertNewPage(newPageIndex - 1);
    room.setGlobalState({
      currentSceneIndex: newPageIndex - 1
    });
  };

  const onChangePage = (index: number) => {
    if (!room) {
      return;
    }
    setCurrentPage(index);
    room.setGlobalState({
      currentSceneIndex: index - 1
    });
  };

  const handleShareScreen = () => {
    if (stream) {
      props.stopScreenShare();
      setStream(null)
    } else {
      props.startScreenShare().then((stream: any) => {
        stream.on("stopScreenSharing", () => setStream(null));
        setStream(stream);
      });
    }
  };

  // const initWhiteboard = async (channel: string, uuid: string) => {
  //   // initialize whiteboard
  //   let response: any;
  //   let roomToken: any;
  //   let room: any;
  //   try {
  //     if (uuid) {
  //       response = await WhiteboardAPI.initialize(channel, { uuid });
  //       ({ roomToken } = response);
  //       room = { uuid };
  //     } else {
  //       response = await WhiteboardAPI.initialize(channel);
  //       ({ roomToken, room } = response);
  //     }
  //     await WhiteboardAPI.join(room.uuid, roomToken)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  const subscribeWhiteboardEvents = () => {
    WhiteboardAPI.on("whiteStateChanged", (args: any) => {
      const { readyState, room } = args;
      setRoom(room)
    });
    WhiteboardAPI.on("roomStateChanged", (modifyState: any) => {
      if (modifyState.globalState) {
        // globalState changed
        let newGlobalState = modifyState.globalState;
        let currentSceneIndex = newGlobalState.currentSceneIndex;
        if (currentSceneIndex + 1 > totalPage) {
          setCurrentPage(currentSceneIndex + 1)
          setTotalPage(currentSceneIndex + 1)
        } else {
          setCurrentPage(currentSceneIndex + 1)
        }
      }
      if (modifyState.memberState) {
        // memberState changed
        // let newMemberState = modifyState.memberState;
        return;
      }
      if (modifyState.broadcastState) {
        // broadcastState changed
        // let broadcastState = modifyState.broadcastState;
        return;
      }
    });
  };

  return (
    <div className="board-container">
      {/* whiteboard  */}
      <div
        className="board"
        id="whiteboard"
        style={{ display: displayStream ? "none" : "block" }}
      >
        {/* intializing mask */}
        {!room ? (
          <div className="board-mask">
            <Spin />
          </div>
        ) : (
          <Fragment>
            <div
              style={{
                display: props.role === 0 ? "flex" : "none"
              }}
              className="board-mask"
            />
            <RoomWhiteboard
              room={room}
              style={{ width: "100%", height: "100vh" }}
            />
            <div className="pagination">
              <Pagination
                defaultCurrent={1}
                current={currentPage}
                total={totalPage}
                pageSize={1}
                onChange={onChangePage}
              />
            </div>
          </Fragment>
        )}
      </div>

      {/* shareboard */}
      {displayStream && <StreamPlayer fit="contain" stream={displayStream} video={true} audio={false} autoChange={false} className="board" id="shareboard" />}

      {/* toolbar */}
      {props.role !== 0  && (
        <Toolbar
          tools={{share: props.role === 2}}
          onChangeMemberState={setMemberState}
          readyState={ Boolean(room) }
          onAddPage={onAddPage}
          onSwitchScreenShare={handleShareScreen}
        />
      )}

      {/* additional float button */}
      <div className="float-button-group">{props.floatButtonGroup}</div>
    </div>
  );
};

export default WhiteboardComponent