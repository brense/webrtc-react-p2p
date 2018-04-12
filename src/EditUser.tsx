import * as React from 'react';
import { Dialog, Button, TextField, Switch, Avatar, FormGroup, FormControlLabel, DialogActions, DialogContent } from 'material-ui';
import { Flex, Item } from 'react-flex';
import Dropzone from 'react-dropzone';
import Auth from './Auth';
import Events from './Events';
import axios from 'axios';

import { Card, AppBar, Toolbar, Typography, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, IconButton, Icon, Tooltip } from 'material-ui';
import Hidden from 'material-ui/Hidden';

export default class EditUser extends React.Component {

    state = {
        users: [],
        selected: []
    }

    constructor(props: any) {
        super(props);

        this.loadUsers();

        this.deleteUser = this.deleteUser.bind(this);
        this.userUpdated = this.userUpdated.bind(this);
        this.userCreated = this.userCreated.bind(this);
        this.toggleSelectAll = this.toggleSelectAll.bind(this);
        this.deleteSelected = this.deleteSelected.bind(this);

        Events.on('user.updated').subscribe((evt: any) => {
            this.userUpdated(evt.data);
        });

        Events.on('user.created').subscribe((evt: any) => {
            this.userCreated(evt.data);
        });

        Events.on('user.deleted').subscribe((evt: any) => {
            this.userDeleted(evt.data);
        });
    }

    componentDidMount() {
        
    }

    deleteUser(user){
        // TODO: show confirmation dialog first!
        axios.delete('api/user/' + user.username)
        .then(res => {
            Events.send('user.deleted', user);
            this.userDeleted(user);
        })
        .catch(e => {

        });
    }

    userCreated(user){
        let users: {}[] = this.state.users;
        users.push(user);
        if(this.refs.userTable) {
            this.setState({users: users});
        }
    }

    userUpdated(user){
        let users: {}[] = this.state.users;
        for(let i in users){
            const u:any = users[i];
            if(u.username === user.username){
                users[i] = user;
            }
        }
        if(this.refs.userTable) {
            this.setState({users: users});
        }
    }

    userDeleted(user){
        let users: {}[] = [];
        for(let i in this.state.users){
            const u:any = this.state.users[i]
            if(u.username !== user.username){
                users.push(u);
            }
        }
        if(this.refs.userTable) {
            this.setState({users: users, selected: []});
        }
    }

    loadUsers(){
        axios.get('api/user')
        .then(res => {
            this.setState({users: res.data});
        })
        .catch(e => {

        });
    }

    isSelected(id){
        const selected: any = this.state.selected;
        return selected.indexOf(id) !== -1;
    }

    toggleSelectAll(event, checked){
        if (checked) {
            this.setState({ selected: this.state.users.map((n, i) => i) });
            return;
        }
        this.setState({ selected: [] });
    }

    selectRow(event, id){
        const selected:any = this.state.selected;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
    
        if (selectedIndex === -1) {
          newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
          newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
          newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
          newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
          );
        }

        this.setState({selected: newSelected});
    }

    deleteSelected(){
        let users: {}[] = [];
        for(let i in this.state.selected){
            const index:number = this.state.selected[i];
            users.push(this.state.users[index]);
        }
        axios.delete('api/user?usernames=' + users.map((user:any, i: number) => {
            return user.username
        }))
        .then(res => {
            for(let i in users){
                Events.send('user.deleted', users[i]);
                this.userDeleted(users[i]);
            }
        })
        .catch(e => {

        });
    }

    render() {
        return (
            <Flex row={true} alignItems="left" style={{ height: '100%' }}>
                <Hidden mdDown><Item style={{ width: '340px' }} flex={false} /></Hidden>
                <Item flex={true}>
                    <Card style={{ height: '100%' }}>
                        <Flex column={true} alignItems="left" style={{ height: '100%' }}>
                            {this.state.selected.length === 0 && (<Toolbar>
                                <Typography type="headline">Spelleiders</Typography>
                                <Item flex={true} />
                                <AddUserButton callback={this.userCreated} />
                            </Toolbar>)}
                            {this.state.selected.length > 0 && (<AppBar color="accent" position="static" elevation={1}><Toolbar>
                                <Typography type="subheading" style={{color:'#fff'}}>{this.state.selected.length} spelleiders geselecteerd</Typography>
                                <Item flex={true} />
                                <Tooltip title="Verwijderen">
                                    <IconButton aria-label="Verwijderen" onClick={this.deleteSelected}>
                                        <Icon style={{color:'#fff'}}>delete</Icon>
                                    </IconButton>
                                </Tooltip>
                            </Toolbar></AppBar>)}
                            <Item flex={true} style={{ overflow: 'auto' }} ref="userTable">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    indeterminate={this.state.selected.length > 0 && this.state.selected.length < this.state.users.length}
                                                    checked={this.state.selected.length === this.state.users.length}
                                                    onChange={this.toggleSelectAll}
                                                />
                                            </TableCell>
                                            <TableCell>Gebruikersnaam</TableCell>
                                            <TableCell>Naam</TableCell>
                                            <TableCell>E-mail</TableCell>
                                            <TableCell>Admin</TableCell>
                                            <TableCell padding="none" numeric />
                                            <TableCell numeric style={{ width: 1 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {this.state.users.map((user: any, i: number) => {
                                            const isSelected = this.isSelected(i);
                                            return (
                                                <TableRow
                                                    hover
                                                    onClick={event => this.selectRow(event, i)}
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    tabIndex={-1}
                                                    key={i}
                                                    selected={isSelected}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox checked={isSelected} />
                                                    </TableCell>
                                                    <TableCell>{user.username}</TableCell>
                                                    <TableCell>{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.admin ? <Icon color="primary">done</Icon>: ''}</TableCell>
                                                    <TableCell padding="none" numeric>
                                                        <EditUserButton profile={user} callback={this.userUpdated} />
                                                    </TableCell>
                                                    <TableCell numeric style={{width:1}}>
                                                        <IconButton color="accent" onClick={() => {this.deleteUser(user)}}>
                                                            <Icon>delete</Icon>
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Item>
                        </Flex>
                    </Card>
                </Item>
            </Flex>
        );
    }
}

export class EditUserDialog extends React.Component<{ title: string, button: any, profile: any, callback?: any, adminOptions?: boolean, newUser?: boolean }> {
    state = {
        open: false,
        snackbarOpen: false,
        snackbarMessage: "",
        profile: this.props.profile
    };

    private actions = [
        (<Button onClick={() => this.cancel()} key={0}>Annuleren</Button>),
        (<Button color="primary" onClick={() => this.save()} key={1}>Opslaan</Button>),
    ];

    constructor(props: any) {
        super(props);

        this.open = this.open.bind(this);
        this.cancel = this.cancel.bind(this);
        this.save = this.save.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleImageDrop = this.handleImageDrop.bind(this);
    }

    private handleInputChange(evt: any, checked?) {
        const value = evt.target.type === 'checkbox' ? checked : evt.target.value;
        const name = evt.target.name;
        this.setState({ profile: { ...this.state.profile, [name]: value } });
    }

    private handleImageDrop(files) {
        const reader = new FileReader();
        reader.onload = () => {
            const base64string = reader.result;
            console.log(base64string.length);
            // TODO: set base64string as the users profile picture...
        };
        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        if (typeof files[0] !== 'undefined') {
            reader.readAsDataURL(files[0]);
        }
    }

    render() {
        let dropzoneRef;
        return (
            <span>
                <span onClick={() => this.open()}>{this.props.button}</span>
                <Dialog
                    title={this.props.title}
                    open={this.state.open}
                    onRequestClose={() => this.cancel()}
                >
                <DialogContent>
                    <form>
                        <Flex column={true} alignItems="center center">
                            <Dropzone ref={(node) => { dropzoneRef = node; }} multiple={false} accept="image/*" maxSize={30000} onDrop={this.handleImageDrop} style={{ display: 'none' }} />
                            <Flex row={true} style={{ width: '100%' }}>
                                <span onClick={() => { dropzoneRef.open() }}><Avatar src={this.state.profile.profile_image} style={{ margin: '10px 10px 0 0' }} /></span>
                                <Item flex>
                                    <TextField label="Naam" value={this.state.profile.name} onChange={this.handleInputChange} name="name" style={{ width: '100%' }} margin="normal" />
                                </Item>
                            </Flex>
                            <TextField label="Gebruikersnaam" value={this.state.profile.username} onChange={this.handleInputChange} disabled={!this.props.newUser} name="username" style={{ width: '100%' }} margin="normal" />
                            <TextField label="E-mail" value={this.state.profile.email} onChange={this.handleInputChange} name="email" style={{ width: '100%' }} margin="normal" />
                            {!this.props.adminOptions || this.props.newUser ? <TextField label="Wachtwoord" type="password" value={this.state.profile.password} onChange={this.handleInputChange} name="password" style={{ width: '100%' }} margin="normal" /> : ''}
                            {!this.props.adminOptions || this.props.newUser ? <TextField label="Herhaal wachtwoord" type="password" value={this.state.profile.passwordCompare} onChange={this.handleInputChange} name="passwordCompare" style={{ width: '100%' }} margin="normal" /> : ''}
                            {this.props.adminOptions || this.props.newUser ? <FormGroup><FormControlLabel control={<Switch checked={this.state.profile.admin ? true : false} name="admin" onChange={this.handleInputChange} />} label="A" /></FormGroup> : ''}
                        </Flex>
                    </form>
                    </DialogContent>
                    <DialogActions>{this.actions}</DialogActions>
                </Dialog>
            </span>
        )
    }

    private open() {
        let profile = this.props.profile;
        profile.admin = this.props.profile.admin ? true : false;
        profile.passwordCompare = profile.password;
        this.setState({ open: true, profile: profile });
    }

    private cancel() {
        this.setState({ open: false });
    }

    private save() {
        const me:any = Auth.authenticatedUser;
        if(me.username === this.state.profile.username){
            Auth.setAuthenticatedUser(this.state.profile);
        }
        axios.put('/api/user', this.state.profile)
            .then(res => {
                Events.send(this.props.newUser ? 'user.created' : 'user.updated', this.state.profile);
                if(typeof this.props.callback !== 'undefined'){
                    this.props.callback(this.state.profile);
                }
                this.setState({ open: false, snackbarOpen: true, snackbarMessage: (this.props.newUser ? "Spelleider toegevoegd" : "Wijzigingen opgeslagen") });
            })
            .catch(e => {
                this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het opslaan" });
            });
    }
}

export class EditProfileButton extends React.Component<{ profile: any }> {
    render() {
        return (
            <EditUserDialog
                title="Profiel bewerken"
                button={<Button>{this.props.profile.name}</Button>}
                profile={this.props.profile}
            />
        )
    }
}

export class EditUserButton extends React.Component<{ profile: any, callback?: any }> {
    render() {
        return (
            <EditUserDialog
                title="Spelleider bewerken"
                button={<IconButton><Icon>create</Icon></IconButton>}
                profile={this.props.profile}
                callback={this.props.callback}
                adminOptions={true}
            />
        )
    }
}

export class AddUserButton extends React.Component<{callback?: any }> {

    private newProfile = {
        username: '',
        password: '',
        email: '',
        name: '',
        isAdmin: false,
        profile_image: ''
    }

    render() {
        return (
            <EditUserDialog
                title="Spelleider toevoegen"
                button={<Button raised={true} color="primary"><Icon>add</Icon>&nbsp;&nbsp;Spelleider toevoegen</Button>} // TODO: this needs to become an icon button
                profile={this.newProfile}
                callback={this.props.callback}
                newUser={true}
            />
        )
    }
}