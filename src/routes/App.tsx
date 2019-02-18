import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Adapter from '../modules/Adapter';
import { APP_ID } from "../agora.config";
import LoginPage from './Login';
import DeviceTestPage from './DeviceTest';


function App() {
  const engine = new Adapter();

  return (
    <Router>
      <div className="full">
        <Route exact path="/" render={() => <LoginPage engine={engine} />} />
        <Route
          path="/device_test"
          render={() => <DeviceTestPage engine={engine} />}
        />
      </div>
    </Router>
  );
}

export default App;
