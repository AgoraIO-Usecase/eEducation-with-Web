/// <reference path="../../proto/proto.d.ts" />

import AgoraRtmSDK, { AgoraRtmChannel } from "agora-node-rtm";
import inMemoryCache from "./inMemoryCache";
import { sentry as log } from "../../lib/logger";

class Sentry {
  public uid: string;
  public online: boolean;
  private appId: string;
  private rtmController: AgoraRtmSDK;
  private channelList: Map<string, AgoraRtmChannel>;
  public cache: inMemoryCache;
  constructor(appId: string, uid = "agora-sentry") {
    this.uid = uid;
    this.appId = appId;
    this.channelList = new Map();
    this.rtmController = new AgoraRtmSDK();
    this.cache = new inMemoryCache();
    this.online = false;
  }

  public async init() {
    await this.login();
    // Recover registry for channel in memory cache
    const channelsInMemory = await this.cache.getChannels();
    for (const channel of channelsInMemory) {
      const channelAttr = await this.cache.getAllChannelAttr(channel);
      try {
        log.info(`Recovering registry for channel ${channel}`);
        await this.registerChannel(channel, channelAttr);
      } catch (err) {
        log.error(`Failed to Recover registry for channel ${channel}`);
      }
    }
  }

  /** Sentry will login to AgoraRTM */
  private login = async () => {
    // subscribe session events
    this.rtmController.on("Logout", () => {
      log.error("Sentry offline");
      this.online = false;
    });
    this.rtmController.on("MessageReceivedFromPeer", (peerId, message) => {
      log.info("->>> incoming message ->>>");
      log.info(peerId, message);
      // handle command message
      this.onMessage(peerId, message);
    });

    // do login
    await this.rtmController.login(this.appId, this.uid);
    this.online = true;
  };

  /** Sentry will join and listen to target channel */
  private join = (channel: string): Promise<AgoraRtmChannel> => {
    return new Promise(async (resolve, reject) => {
      const channelInstance = this.rtmController.createChannel(channel);
      // subscribe channel events
      channelInstance.on("LeaveChannel", (ecode: number) => {
        if (ecode) {
          log.error("Left channel unexpectedly", ecode);
        }
      });
      channelInstance.on("GetMembers", async (members: [], ecode: number) => {
        if (ecode) {
          reject(ecode);
        }
        log.info("Members in channel", channel, members);
        if (members.length <= 1) {
          await this.unregisterChannel(channel);
        } else {
          await this.cache.addChannelMember(channel, members);
        }
        resolve(channelInstance);
      });
      channelInstance.on(
        "MemberJoined",
        async (peerId: string, channel: string) => {
          await this.cache.addChannelMember(channel, peerId);
          log.info(`Member ${peerId} joined channel ${channel}`);
        }
      );
      channelInstance.on(
        "MemberLeft",
        async (peerId: string, channel: string) => {
          log.info(`Member ${peerId} left channel ${channel}`);
          try {
            await this.cache.removeChannelMember(channel, peerId);
            await this.cache.clearUserAttr(peerId);
          } catch (err) {
            log.warn(
              "Failed to clear user attribute for user",
              peerId,
              "in channel",
              channel,
              err
            );
          }
          // check if we should unregister this channel
          const members = await this.cache.getChannelMembers(channel);
          if (members.length <= 1) {
            log.info("No members left, try to unregister channel");
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

      // do join and fetch members
      try {
        log.info(`Entering channel ${channel}`);
        await channelInstance.join();
        channelInstance.getMembers();
      } catch (err) {
        log.info(`Failed to enter channel ${channel}`);
        reject(err);
      }
    });
  };

  /** Sentry register Channel in ChannelList */
  private async registerChannel(
    channelName: string,
    channelAttr?: RoomControl.ChannelAttr
  ) {
    log.info("Registering channel", channelName);
    const channelController = await this.join(channelName);
    if (channelAttr) {
      await this.cache.setChannelAttr(channelName, channelAttr);
    }
    this.channelList.set(channelName, channelController);
    await this.cache.addChannel(channelName);
    log.info(`Register channel ${channelName} successfully`);
  }

  private async unregisterChannel(channelName: string) {
    log.info("Unregistering channel", channelName);
    const channelController = this.channelList.get(channelName);
    if (channelController) {
      channelController.leave();
      this.channelList.delete(channelName);
    }
    try {
      await this.cache.clearChannelAttr(channelName);
      await this.cache.removeChannel(channelName);
      log.info(`Unregister channel ${channelName} and clear related attr`);
    } catch (err) {
      log.warn(
        "Failed to clear channel attribute for channel",
        channelName,
        err
      );
    }
  }

  // ---------------- internal handlers ----------------
  // Handlers for request from client

  /** Sentry send response to client by AgoraRTM p2p message */
  private sendMessage(peerId: string, message: string) {
    log.info(`Sending message to ${peerId}`, message);
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
    log.info("->>> incoming join command ->>>");
    log.info(channel, userAttr, channelAttr);
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

    log.info("channel", channel, "already registered");
    const members = await this.cache.getChannelMembers(channel);
    if (!members.includes(fromId)) {
      const response: RoomControlResponse.JoinFailure = {
        name: "JoinFailure",
        args: {
          info: `Not in RTM channel`
        }
      };
      this.sendMessage(fromId, JSON.stringify(response));
    } else {
      await this.cache.setUserAttr(fromId, {
        ...userAttr,
        channel: channel
      });
      if (channelAttr) {
        await this.cache.setChannelAttr(channel, channelAttr);
      }
      let users = [];
      for (const member of members) {
        const attribute = await this.cache.getAllUserAttr(member);
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

      const channelStatus = await this.cache.getAllChannelAttr(channel);

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
    const { message } = request.args;
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming chat command ->>>");
    log.info(channel, fromId, message);

    const members = await this.cache.getChannelMembers(channel);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming mute command ->>>");
    log.info(channel, fromId, type, target);

    const members = await this.cache.getChannelMembers(channel);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming unmute command ->>>");
    log.info(channel, fromId, type, target);

    const members = await this.cache.getChannelMembers(channel);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming ring command ->>>");
    log.info(channel, fromId);

    const members = await this.cache.getChannelMembers(channel);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming customrequest command ->>>");
    log.info(channel, fromId, type, uid);

    const members = await this.cache.getChannelMembers(channel);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming updateuserattr command ->>>");
    log.info(channel, fromId, uid, userAttr);

    const members = await this.cache.getChannelMembers(channel);
    const response: RoomControlResponse.UserAttrUpdated = {
      name: "UserAttrUpdated",
      args: {
        userAttr: userAttr,
        target: uid,
        uid: fromId
      }
    };
    if (members.includes(uid)) {
      await this.cache.setUserAttr(uid, userAttr);
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
    const [channel] = await this.cache.getUserAttr(fromId, ["channel"]);

    log.info("->>> incoming updatechannelattr command ->>>");
    log.info(channel, fromId, channelAttr);

    if (!channelAttr) {
      return;
    }

    const members = await this.cache.getChannelMembers(channel);
    const response: RoomControlResponse.ChannelAttrUpdated = {
      name: "ChannelAttrUpdated",
      args: {
        channelAttr,
        uid: fromId
      }
    };
    await this.cache.setChannelAttr(channel, channelAttr);
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
