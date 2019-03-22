/// <reference path="./types/proto.d.ts" />

import AgoraRtmSDK, { AgoraRtmChannel } from "agora-node-rtm";
import ChannelCache from "./inMemoryCache";

class Sentry {
  public uid: string;
  private appId: string;
  private rtmController: AgoraRtmSDK;
  private channelList: Map<string, AgoraRtmChannel>;
  public channelCacheClient: ChannelCache;
  constructor(appId: string, uid = "agora-sentry") {
    this.uid = uid;
    this.appId = appId;
    this.channelList = new Map();
    this.rtmController = new AgoraRtmSDK();
    this.channelCacheClient = new ChannelCache();
  }

  public async init() {
    await this.login();
    const channelsInMemory = await this.channelCacheClient.getChannels();
    for (const channel of channelsInMemory) {
      const channelAttr = await this.channelCacheClient.getAllChannelAttr(
        channel
      );
      try {
        await this.registerChannel(channel, channelAttr);
      } catch (err) {
        console.log("Failed to register channel:", channel);
      }
    }
  }

  /** Sentry will login to AgoraRTM */
  private login = async () => {
    // subscribe session events
    this.rtmController.on("Logout", () => {
      console.log("Sentry offline");
    });
    this.rtmController.on("MessageReceivedFromPeer", (peerId, message) => {
      console.log("->>> incoming message ->>>");
      console.log(peerId, message);
      this.onMessage(peerId, message);
    });
    // do login
    await this.rtmController.login(this.appId, this.uid);
  };

  /** Sentry will join and listen to target channel */
  private join = (channel: string): Promise<AgoraRtmChannel> => {
    return new Promise(async (resolve, reject) => {
      const channelInstance = this.rtmController.createChannel(channel);
      // subscribe channel events
      channelInstance.on("LeaveChannel", (ecode: string) => {
        console.log(ecode);
      });
      channelInstance.on("GetMembers", async (members: [], ecode: number) => {
        if (ecode) {
          reject(ecode)
        }
        console.log("Members in channel:", channel, members);
        if (members.length <= 1) {
          await this.unregisterChannel(channel);
        } else {
          await this.channelCacheClient.addChannelMember(channel, members);
        }
        resolve(channelInstance)
      });
      channelInstance.on(
        "MemberJoined",
        async (peerId: string, channel: string) => {
          await this.channelCacheClient.addChannelMember(channel, peerId);
        }
      );
      channelInstance.on(
        "MemberLeft",
        async (peerId: string, channel: string) => {
          console.log("User", peerId, "left channel", channel);
          try {
            await this.channelCacheClient.removeChannelMember(channel, peerId);
            await this.channelCacheClient.clearUserAttr(peerId);
          } catch (err) {
            console.log("Failed to clear user", peerId, "in channel", channel);
            console.log(err);
          }
  
          // check if we should unregister this channel
          const members = await this.channelCacheClient.getChannelMembers(
            channel
          );
          if (members.length === 0) {
            await this.unregisterChannel(channel);
          } else {
            for (const member of members) {
              const response: RoomControlResponse.MemberLeft = {
                name: "MemberLeft",
                args: {
                  uid: peerId
                }
              };
              this.sendMessage(member, JSON.stringify(response));
            }
          }
        }
      );
      try {
        console.log('Sentry try to join channel', channel);
        await channelInstance.join();
        channelInstance.getMembers();
      } catch (err) {
        console.log('Sentry joinned channel', channel);
        reject(err)
      }
    })
  };

  /** Sentry register Channel in ChannelList */
  private async registerChannel(
    channelName: string,
    channelAttr?: RoomControl.ChannelAttr
  ) {
    console.log("try to register channel", channelName);
    const channelController = await this.join(channelName);
    if (channelAttr) {
      await this.channelCacheClient.setChannelAttr(channelName, channelAttr);
    }
    this.channelList.set(channelName, channelController);
    await this.channelCacheClient.addChannel(channelName);
  }

  private async unregisterChannel(channelName: string) {
    const channelController = this.channelList.get(channelName);
    if (channelController) {
      channelController.leave();
      this.channelList.delete(channelName);
    }
    try {
      await this.channelCacheClient.clearChannelAttr(channelName);
      await this.channelCacheClient.removeChannel(channelName);
    } catch (err) {
      console.log("Failed to clear channel", channelName);
      console.log(err);
    }
  }

  // ---------------- internal handlers ----------------
  // Handlers for request from client

  /** Sentry send response to client by AgoraRTM p2p message */
  private sendMessage(peerId: string, message: string) {
    this.rtmController.sendMessageToPeer(peerId, message);
  }

  /** Sentry get request from client by AgoraRTM p2p message */
  private onMessage(peerId: string, message: string) {
    // handle command
    try {
      const command: RoomControlRequest.Request = JSON.parse(message);
      switch (command.name) {
        case "Join":
          this.handleJoin(peerId, command as RoomControlRequest.Join);
          break;
        case "Chat":
          this.handleChat(peerId, command as RoomControlRequest.Chat);
          break;
        case "Mute":
          this.handleMute(peerId, command as RoomControlRequest.Mute);
          break;
        case "Unmute":
          this.handleUnmute(peerId, command as RoomControlRequest.Unmute);
          break;
        case "Ring":
          this.handleRing(peerId, command as RoomControlRequest.Ring);
          break;
        case "CustomRequest":
          this.handleCustomRequest(
            peerId,
            command as RoomControlRequest.CustomRequest
          );
          break;
        case "UpdateUserAttr":
          this.handleUpdateUserAttr(
            peerId,
            command as RoomControlRequest.UpdateUserAttr
          );
          break;
        case "UpdateChannelAttr":
          this.handleUpdateChannelAttr(
            peerId,
            command as RoomControlRequest.UpdateChannelAttr
          );
          break;
        default:
          this.handleError(peerId, "Undefined Request");
          break;
      }
    } catch (err) {
      this.handleError(peerId, "Invalid Request Format");
    }
  }

  private async handleJoin(fromId: string, request: RoomControlRequest.Join) {
    const { channel, userAttr, channelAttr } = request.args;
    console.log("->>> incoming join command ->>>");
    console.log(channel, userAttr, channelAttr);
    // if channel not exsits, create it
    if (!this.channelList.has(channel)) {
      try {
        await this.registerChannel(channel, channelAttr);
      } catch (err) {
        const response: RoomControlResponse.JoinFailure = {
          name: "JoinFailure",
          args: {
            info: `Failed to register channel: ${channel}`
          }
        };
        this.sendMessage(fromId, JSON.stringify(response));
        return;
      }
    }
    console.log('channel', channel ,'already register');
    const members = await this.channelCacheClient.getChannelMembers(channel);
    if (!members.includes(fromId)) {
      const response: RoomControlResponse.JoinFailure = {
        name: "JoinFailure",
        args: {
          info: `Not in RTM channel`
        }
      };
      this.sendMessage(fromId, JSON.stringify(response));
    } else {
      await this.channelCacheClient.setUserAttr(fromId, {
        ...userAttr,
        channel: channel
      });
      if (channelAttr) {
        await this.channelCacheClient.setChannelAttr(fromId, channelAttr);
      }

      let users = [];
      for (const member of members) {
        const attribute = await this.channelCacheClient.getAllUserAttr(member);
        users.push({ ...attribute, uid: member });
        if (member !== fromId) {
          const response: RoomControlResponse.MemberJoined = {
            name: "MemberJoined",
            args: {
              uid: fromId,
              ...userAttr
            }
          };
          this.sendMessage(member, JSON.stringify(response));
        }
      }

      const channelStatus = await this.channelCacheClient.getAllChannelAttr(
        channel
      );

      const response: RoomControlResponse.JoinSucess = {
        name: "JoinSucess",
        args: {
          channelAttr: channelStatus,
          members: users
        }
      };

      this.sendMessage(fromId, JSON.stringify(response));
    }
  }

  private async handleChat(fromId: string, request: RoomControlRequest.Chat) {
    const {message} = request.args
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming chat command ->>>");
    console.log(channel, fromId, message);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.ChannelMessage = {
      name: "ChannelMessage",
      args: {
        uid: fromId,
        message
      }
    };
    for (const member of members) {
      this.sendMessage(member, JSON.stringify(response));
    }
  }

  private async handleMute(fromId: string, request: RoomControlRequest.Mute) {
    const { type, target } = request.args;
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming mute command ->>>");
    console.log(channel, fromId, type, target);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.Muted = {
      name: "Muted",
      args: {
        type: type,
        uid: fromId
      }
    };
    if (target instanceof Array) {
      for (let item of target) {
        if (members.includes(item)) {
          this.sendMessage(item, JSON.stringify(response));
        }
      }
    } else {
      if (members.includes(target)) {
        this.sendMessage(target, JSON.stringify(response));
      }
    }
  }

  private async handleUnmute(
    fromId: string,
    request: RoomControlRequest.Unmute
  ) {
    const { type, target } = request.args;
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming unmute command ->>>");
    console.log(channel, fromId, type, target);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.Unmuted = {
      name: "Unmuted",
      args: {
        type: type,
        uid: fromId
      }
    };
    if (target instanceof Array) {
      for (let item of target) {
        if (members.includes(item)) {
          this.sendMessage(item, JSON.stringify(response));
        }
      }
    } else {
      if (members.includes(target)) {
        this.sendMessage(target, JSON.stringify(response));
      }
    }
  }

  private async handleRing(fromId: string, request: RoomControlRequest.Ring) {
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming ring command ->>>");
    console.log(channel, fromId);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.Ringing = {
      name: "Ringing",
      args: {
        uid: fromId
      }
    };
    for (const member of members) {
      this.sendMessage(member, JSON.stringify(response));
    }
  }

  private async handleCustomRequest(
    fromId: string,
    request: RoomControlRequest.CustomRequest
  ) {
    const { type, uid } = request.args;
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming customrequest command ->>>");
    console.log(channel, fromId, type, uid);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.CustomRequest = {
      name: "CustomRequest",
      args: {
        type,
        uid: fromId
      }
    };
    if (members.includes(uid)) {
      this.sendMessage(uid, JSON.stringify(response));
    }
  }

  private async handleUpdateUserAttr(
    fromId: string,
    request: RoomControlRequest.UpdateUserAttr
  ) {
    const { uid, userAttr } = request.args;
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming updateuserattr command ->>>");
    console.log(channel, fromId, uid, userAttr);

    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.UserAttrUpdated = {
      name: "UserAttrUpdated",
      args: {
        userAttr: userAttr,
        target: uid,
        uid: fromId
      }
    };
    if (members.includes(uid)) {
      await this.channelCacheClient.setUserAttr(uid, userAttr);
      for (const member of members) {
        this.sendMessage(member, JSON.stringify(response));
      }
    }
  }

  private async handleUpdateChannelAttr(
    fromId: string,
    request: RoomControlRequest.UpdateChannelAttr
  ) {
    const { channelAttr } = request.args;
    const [channel] = await this.channelCacheClient.getUserAttr(fromId, [
      "channel"
    ]);
    console.log("->>> incoming updatechannelattr command ->>>");
    console.log(channel, fromId, channelAttr);
    if (!channelAttr) {
      return;
    }
    const members = await this.channelCacheClient.getChannelMembers(channel);
    const response: RoomControlResponse.ChannelAttrUpdated = {
      name: "ChannelAttrUpdated",
      args: {
        channelAttr,
        uid: fromId
      }
    };
    await this.channelCacheClient.setChannelAttr(channel, channelAttr);
    for (const member of members) {
      this.sendMessage(member, JSON.stringify(response));
    }
  }

  private handleError(toId: string, errInfo: string) {
    const exception: RoomControlResponse.ThrowError = {
      name: "Error",
      args: {
        info: errInfo
      }
    };
    this.sendMessage(toId, JSON.stringify(exception));
  }
}

export default Sentry;
