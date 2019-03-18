import React, { useState, useRef, MutableRefObject } from 'react';
import { Form, Input, Radio, Button, Spin, message } from 'antd';

import Adapter from '../../modules/Adapter';
import './index.scss';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const LoadingMask = (
  <div className="mask">
    <Spin size="large" />
  </div>
);

export default function(props: { engine: Adapter; [propName: string]: any }) {
  const engine = props.engine;

  // ---------------- Hooks ----------------
  // Hooks used in this component

  const channelRef: MutableRefObject<any> = useRef(null);
  const nameRef: MutableRefObject<any> = useRef(null);
  const roleRef: MutableRefObject<any> = useRef(null);

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const handleSubmit = (e: any) => {
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

    props.history.push('/device_test');
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
