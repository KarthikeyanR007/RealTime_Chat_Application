// /**
//  * @format
//  */

// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';

// AppRegistry.registerComponent(appName, () => App);


import React from 'react';
import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import App from './App'; // Replace with your main App component
import {name as appName} from './app.json';
import store from './redux/store'; // Import your Redux store configuration

const ReduxApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () => ReduxApp);