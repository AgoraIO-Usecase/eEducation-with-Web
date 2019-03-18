/// <reference path="./types/proto.d.ts" />

import { createInstance, RTMController } from "agora-node-rtm";
import Channel from "./inMemoryCache/channelCache";
import User from "./inMemoryCache/userCache";

class Sentry {
  public status: "offline" | "online";
  public uid: string;
  public appId: string;
  private rtmController: RTMController;
  private channelList: Map<string, Channel>;
  private userList: Map<string, User>;
  constructor(appId: string, uid = "agora-sentry") {
    this.status = "offline";
    this.uid = uid;
    this.appId = appId;
    this.channelList = new Map();
    this.userList = new Map();
    this.rtmController = createInstance();
  }

  /** Sentry will login to AgoraRTM */
  private login = () => {
    return new Promise((resolve, reject) => {
      if (this.status === "online") {
        reject("Already Logined");
      }
      this.rtmController.login(this.appId, this.uid);
      this.rtmController.onEvent("LoginSuccess", resolve);
      this.rtmController.onEvent("LoginFailure", reject);
      this.rtmController.onEvent("Logout", () => {
        this.status = "offline";
        (this.rtmController as any) = null;
        this.rtmController = createInstance();
      });
      this.rtmController.onEvent("MessageReceivedFromPeer", this.onMessage);
    });
  };

  // /** Sentry will join to target channel */
  // private join = (channel: string) => {
  //   return new Promise((resolve, reject) => {
  //     const channelController = this.rtmController.createChannel(channel);
  //     channelController.join();
  //     channelController.onEvent("JoinSuccess", resolve);
  //     // channelController.onEvent('JoinFailure', reject);
  //     channelController.onEvent("LeaveChannel", (ecode: string) => {
  //       // console.log(ecode)
  //     });
  //   });
  // };

  /** Sentry register User in UserList */
  public async registerUser(uid: string, userAttr: RoomControlProto.UserAttr) {
    const user = new User(uid);
    this.userList.set(uid, user);
    return await user.setAttr(userAttr);
  }

  /** Sentry register Channel in ChannelList */
  public async registerChannel(
    channelName: string,

  ) {
    const channel = new Channel(channelName);
    this.channelList.set(channelName, channel);
  }

  // ---------------- internal handlers ----------------
  // Handlers for request from client

  /** Sentry send response to client by AgoraRTM p2p message */
  private sendMessage(peerId: string, message: string) {
    if (this.status === "offline") {
      return false;
    }
    this.rtmController.sendMessageToPeer(peerId, message);
    return true;
  }

  /** Sentry get request from client by AgoraRTM p2p message */
  private onMessage(peerId: string, message: string) {
    // handle command
    let command: RoomControlProto.Request = {
      name: "",
      args: {}
    };

    try {
      command = JSON.parse(message);
    } catch (err) {
      this.handleError(peerId, "Invalid Request");
    }

    switch (command.name) {
      case "Join":
        this.handleJoin(peerId, command as RoomControlProto.Join);
      default:
        this.handleError(peerId, "Undefined Request");
    }
  }

  private handleJoin(fromId: string, request: RoomControlProto.Join) {}

  private handleError(toId: string, errInfo: string) {
    const exception: RoomControlProto.ThrowError = {
      name: "Error",
      args: {
        info: errInfo
      }
    };
    this.sendMessage(toId, JSON.stringify(exception));
  }
}

export default Sentry;
