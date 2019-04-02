import React, { useState, useRef, MutableRefObject } from 'react';
import { Form, Input, Radio, Button, Spin, message } from 'antd';

import Adapter from '../../modules/Adapter';
import RoomControlStore from "../../store/RoomControl";
import './index.scss';
import RoomControlClient from '../../modules/RoomControl';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const LoadingMask = (
  <div className="mask">
    <Spin size="large" />
  </div>
);

export default function(props: { engine: Adapter; roomClient: RoomControlClient; [propName: string]: any }) {
  const engine = props.engine;
  const roomClient = props.roomClient
  // ---------------- Hooks ----------------
  // Hooks used in this component

  const channelRef: MutableRefObject<any> = useRef(null);
  const nameRef: MutableRefObject<any> = useRef(null);
  const roleRef: MutableRefObject<any> = useRef(null);
  const dispatch = RoomControlStore.getDispatcher();

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [channel, name, role] = [
      channelRef.current.state.value,
      nameRef.current.state.value,
      roleRef.current.state.value
    ];
    const uid = Number(String(new Date().getTime()).slice(7));
    engine.setState({
      channel,
      name,
      role,
      uid
    });
    try {
      await roomClient.init(String(uid), channel);
      roomClient.on('MemberJoined', (member: any) => {
        dispatch({action: 'addMember', member});
      })
      roomClient.on('MemberLeft', (args: any) => {
        dispatch({action: 'removeMember', uid: args.uid});
      })
      roomClient.on('UserAttrUpdated', (args: any) => {
        dispatch({action: 'updateUserAttr', uid: args.target, userAttr: args.userAttr});
      })
      roomClient.on('ChannelAttrUpdated', (args: any) => {
        dispatch({action: 'updateChannelAttr', channelAttr: args.channelAttr});
      })
      roomClient.on('ChannelMessage', (args: any) => {
        dispatch({action: 'addChannelMessage', message: args.message, uid: args.uid})
      })
      const {channelAttr, members} = await roomClient.join(channel, {name, role, streamId: uid})
      dispatch({action: 'updateChannelAttr', channelAttr});
      dispatch({action: 'addMember', members});

      if (role === 0) {
        props.history.push('/classroom');
      } else {
        props.history.push('/device_test');
      }
    } catch (err) {
      message.error(`Failed to join ${err}`)
    }    
  };

  return (
    <div className="wrapper" id="index">
      {/* {isLoading ? LoadingMask : null} */}

      <main className="main">
        <section className="content">
          <header>
            <img src={require('../../assets/images/logo.png')} alt="" />
          </header>
          <main>
            <Form onSubmit={handleSubmit}>
              <FormItem label="Classroom Name" colon={false}>
                <Input
                  ref={channelRef}
                  id="channel"
                  defaultValue={engine.state.channel}
                />
              </FormItem>
              <FormItem label="Your Name" colon={false}>
                <Input
                  ref={nameRef}
                  id="username"
                  defaultValue={engine.state.name}
                />
              </FormItem>
              <FormItem>
                <RadioGroup
                  ref={roleRef}
                  id="role"
                  defaultValue={engine.state.role}
                >
                  <Radio value={2}>Teacher</Radio>
                  <Radio value={1}>Student</Radio>
                  <Radio value={0}>Audience</Radio>
                </RadioGroup>
              </FormItem>
              <FormItem>
                <Button
                  size="large"
                  id="joinBtn"
                  type="primary"
                  htmlType="submit"
                >
                  Join ->
                </Button>
              </FormItem>
            </Form>
          </main>
        </section>
        <section className="illustration" />
        <img
          className="bubble-1"
          src={require('../../assets/images/monster-blue.png')}
          alt=""
        />
        <img
          className="bubble-2"
          src={require('../../assets/images/monster-yellow.png')}
          alt=""
        />
      </main>
    </div>
  );
}
