import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import pink from 'material-ui/colors/pink';
import blue from 'material-ui/colors/blue';
import red from 'material-ui/colors/red';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import 'react-flex/index.css';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons';
import 'material-design-icons/iconfont/material-icons.css';
import 'material-icons/css/material-icons.css';
import '@material/typography/dist/mdc.typography.css';
import { LoginForm, PrivateRoute, PrivateAdminRoute, Auth } from './Auth';
import App from './App';
import Dashboard from './components/Dashboard';
import Debug from './components/Debug';
import Users from './users/Users';
import Games from './games/Games';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import Events from './Events';
import axios from 'axios';
require('./webrtc-adapter');

injectTapEventPlugin();

// Axios configuration
let host = window.location.hostname;
let port = +window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
if (process.env.NODE_ENV === 'development') {
  port = 8001;
}
axios.defaults.baseURL = 'http://' + host + ':' + port;

// Auth configuration
Auth.loginUrl = '/api/login';
Auth.logoutUrl = '/api/logout';
Auth.onLogin = (user: any, token: string) => {
  axios.defaults.headers.common['Authorization'] = token;
  Events.connect(token);
};
Auth.onLogout = () => {
  Events.disconnect();
  // TODO: disconnect events server and all peer connections
};

// MUI theme configuration
const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
    error: red,
  },
});

// Route configuration
ReactDOM.render(
  <Router>
    <MuiThemeProvider theme={theme}>
      <div className="container">
        <PrivateRoute
          component={() => (
            <App>
              <Switch>
                <PrivateAdminRoute path="/manage/users" component={Users} />
                <PrivateAdminRoute path="/manage/games" component={Games} />
                <PrivateAdminRoute path="/debug" component={Debug} />
                <PrivateRoute exact={true} path="/" component={Dashboard} />
                <Redirect to="/" />
              </Switch>
            </App>
          )}
        />
        <Route path="/login" component={LoginForm} />
      </div>
    </MuiThemeProvider>
  </Router>,
  document.getElementById('root') as HTMLElement
);

registerServiceWorker();