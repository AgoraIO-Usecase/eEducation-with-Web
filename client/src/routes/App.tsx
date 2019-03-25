import React from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';

import Adapter from '../modules/Adapter';
import LoginPage from './Login';
import DeviceTestPage from './DeviceTest';
import ClassroomPage from './Class';

function App() {
  const engine = new Adapter({
    appId: process.env.REACT_APP_AGORA_APPID
  });

  return (
    <Router>
      <div className="full">
        <Route
          exact
          path="/"
          render={props => <LoginPage {...props} engine={engine} />}
        />
        <Route
          path="/device_test"
          render={props => <DeviceTestPage {...props} engine={engine} />}
        />
        <Route
          path="/classroom"
          render={props => <ClassroomPage {...props} engine={engine} />}
        />
      </div>
    </Router>
  );
}

export default App;
