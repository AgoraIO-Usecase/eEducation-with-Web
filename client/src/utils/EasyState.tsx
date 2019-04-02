import React, { createContext, useContext, useReducer } from "react";

type State = {
  [key: string]: any
}

type Payload = {
  action: string;
  [props: string]: any
}

type Action<T extends State > = (state: T, payload: Payload) => T

export function EasyState<T extends State>(config: {
  state: T, 
  actions: {
    [action: string]: Action<T>
  }
}) {
  const {state, actions} = config;
  // map actions to reducer
  const actionNames = Object.keys(actions);
  const reducer = (rState: T, rPayload: Payload): T => {
    if(actionNames.indexOf(rPayload.action) !== -1) {
      return actions[rPayload.action](rState, rPayload);
    } else {
      return rState
    }
  };

  // declare context for state and dispatcher
  const stateContext = createContext(state)
  const dispatcherContext = createContext(
    (() => 0) as React.Dispatch<Payload>
  );

  // declare component Provider
  const Provider: React.ComponentType = ({children}) => {
    const [pState, pDispatch] = useReducer(reducer, state)
    const StateProvider = stateContext.Provider;
    const DispatchProvider = dispatcherContext.Provider;

    return (
      <DispatchProvider value={pDispatch}>
        <StateProvider value={pState}>
          {children}
        </StateProvider>
      </DispatchProvider>
    )
  }

  // return `dispatch` method
  const getDispatcher = () => {
    return useContext(dispatcherContext);
  };

  // return state
  const getState = () => {
    return useContext(stateContext)
  };

  return {
    Provider, getState, getDispatcher
  }
}

export default EasyState;