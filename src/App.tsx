import * as React from 'react';
import { Flex, Item } from 'react-flex';
import { AppBar, Toolbar, IconButton, Icon, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, Snackbar } from 'material-ui';
import Hidden from 'material-ui/Hidden';
import { withRouter } from 'react-router-dom'
import axios from 'axios';
import { LogoutButton, Auth } from './Auth';
import Events from './Events';
import StoreManager from './data-views/StoreManager';
import UsersDataStore from './users/UsersDataStore';
import { EditProfileDialog } from './users/EditUserDialog';
import Chat from './components/Chat';
import User from './users/User';
import './App.css';

class App extends React.Component<{ history: any }> {

  state = {
    user: {
      admin: false
    },
    time: new Date(),
    menuOpen: false,
    snackbarOpen: false,
    snackbarMessage: ''
  };

  private clockInterval;

  constructor(props: any) {
    super(props);

    if (!StoreManager.exists('users')) {
      StoreManager.set('users', new UsersDataStore());
    }

    this.updateProfile = this.updateProfile.bind(this);
    this.handleRequestOpen = this.handleRequestOpen.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
    this.closeSnackbar = this.closeSnackbar.bind(this);
  }

  componentDidMount() {
    this.setState({ user: Auth.authenticatedUser });
    Auth.onAuthenticatedUserUpdated.subscribe((user: User) => {
      this.setState({ user: user });
    });
    this.clockInterval = setInterval(() => {
      this.setState({ time: new Date() });
    }, 999);
  }

  componentWillUnmount() {
    clearInterval(this.clockInterval);
  }

  handleRequestOpen() {
    this.setState({ menuOpen: true });
  }

  handleRequestClose() {
    this.setState({ menuOpen: false });
  }

  render() {
    return (
      <Flex column={true} alignItems="left" flex={1}>
        <AppBar position="static" style={{ background: 'none', boxShadow: 'none', marginLeft: 0, width: '100%' }}>
          <Toolbar>
            {this.state.user.admin && (
              <span>
                <IconButton onClick={this.handleRequestOpen}><Icon>menu</Icon></IconButton>
              </span>
            )}
            {this.state.user.admin && (
              <Drawer open={this.state.menuOpen} onRequestClose={this.handleRequestClose}>
                <List>
                  <ListItem button={true} onClick={() => { this.props.history.push('/'); this.handleRequestClose() }}>
                    <ListItemIcon><Icon>dashboard</Icon></ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem button={true} onClick={() => { this.props.history.push('/setup'); this.handleRequestClose() }}>
                    <ListItemIcon><Icon>tune</Icon></ListItemIcon>
                    <ListItemText primary="Nieuw spel starten" />
                  </ListItem>
                  <ListItem button={true} onClick={() => { this.props.history.push('/manage/games'); this.handleRequestClose() }}>
                    <ListItemIcon><Icon>extension</Icon></ListItemIcon>
                    <ListItemText primary="Spellen beheren" />
                  </ListItem>
                  <ListItem button={true} onClick={() => { this.props.history.push('/manage/users'); this.handleRequestClose() }}>
                    <ListItemIcon><Icon>group</Icon></ListItemIcon>
                    <ListItemText primary="Spelleiders beheren" />
                  </ListItem>
                  <ListItem button={true} dense={true} onClick={() => { this.props.history.push('/debug'); this.handleRequestClose() }}>
                    <ListItemIcon><Icon>bug_report</Icon></ListItemIcon>
                    <ListItemText primary="Debug" />
                  </ListItem>
                </List>
              </Drawer>
            )}
            <Typography type="headline" style={{ color: '#000' }}>Spelleider app</Typography>
            <Item flex={true} />
            <EditProfileDialog callback={this.updateProfile} />
            <Typography type="title" style={{ color: '#000', margin: '0 12px' }}>{new Date(this.state.time).toLocaleTimeString()}</Typography>
            <LogoutButton />
          </Toolbar>
        </AppBar>
        <Flex row={true} alignItems="left" flex={1}>
          <Item flex={true} style={{ overflow: 'auto', padding: '8px 24px 24px 24px' }}>{this.props.children}</Item>
          <Hidden smDown>
            <Chat />
          </Hidden>
        </Flex>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          open={this.state.snackbarOpen}
          autoHideDuration={3000}
          onRequestClose={this.closeSnackbar}
          message={<span>{this.state.snackbarMessage}</span>}
        />
      </Flex>
    );
  }

  private updateProfile(profile) {
    const store = StoreManager.get('users');
    let success = store.update(profile);

    Auth.onAuthenticatedUserUpdated.next(profile);

    axios.put('api/user', profile)
      .then(res => {
        this.setState({ snackbarOpen: true, snackbarMessage: "Wijzigingen opgeslagen" });
        Events.send('user.updated', profile);
      });
    
    if(!success){
      this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het opslaan" });
    }
    return success;
  }

  private closeSnackbar() {
    this.setState({ snackbarOpen: false });
  }

}

export default withRouter(App);
