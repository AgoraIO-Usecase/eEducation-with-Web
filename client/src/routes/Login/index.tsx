import React, { useRef, MutableRefObject } from 'react';
import { Form, Input, Radio, Button, Spin, message } from 'antd';

import './index.scss';
import { session } from '../../utils'
import Adapter from '../../modules/Adapter';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default function(props: any) {
  const adapter: Adapter = props.adapter;
  const initEngine = props.initEngine;
  // ---------------- Hooks ----------------
  // Hooks used in this component
  const channelRef: MutableRefObject<any> = useRef(null);
  const nameRef: MutableRefObject<any> = useRef(null);
  const roleRef: MutableRefObject<any> = useRef(null);

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [channel, name, role] = [
      channelRef.current.state.value,
      nameRef.current.state.value,
      roleRef.current.state.value
    ];
    const uid = String(new Date().getTime()).slice(7);
    const config = {
      channel, name, role, uid, 
      streamId: Number.parseInt(uid, 10),
      shareId: 2
    }
    session.save('adapterConfig', config)
    initEngine(config).then(() => {
      // if teacher
      if(role === 2) {
        adapter.signal.request(JSON.stringify({
          name: 'UpdateChannelAttr',
          args: {
            channelAttr: {
              teacherId: uid,
              shareId: 2
            }
          }
        }))
      }

      if (role === 0) {
        props.history.push('/classroom');
      } else {
        props.history.push('/device_test');
      }

    })
  };

  return (
    <div className="wrapper" id="index">

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
                  defaultValue={adapter.config.channel}
                />
              </FormItem>
              <FormItem label="Your Name" colon={false}>
                <Input
                  ref={nameRef}
                  id="username"
                  defaultValue={adapter.config.name}
                />
              </FormItem>
              <FormItem>
                <RadioGroup
                  ref={roleRef}
                  id="role"
                  defaultValue={adapter.config.role}
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
