import * as React from 'react';
import TableView, { ColumnData } from '../data-views/TableView';
import StoreManager from '../data-views/StoreManager';
import UsersDataStore from './UsersDataStore';
import EditUserDialog from './EditUserDialog';
import User from './User';
import { Auth } from '../Auth';
import Events from '../Events';
import { Card, Snackbar } from 'material-ui';
import axios from 'axios';

export default class Users extends React.Component {

    state = {
        snackbarOpen: false,
        snackbarMessage: ''
    };

    private tableData: UsersDataStore;

    constructor(props: {}) {
        super(props);

        if (!StoreManager.exists('users')) {
            StoreManager.set('users', new UsersDataStore());
        }
        this.tableData = StoreManager.get('users');

        this.createUser = this.createUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.deleteUsers = this.deleteUsers.bind(this);
        this.closeSnackbar = this.closeSnackbar.bind(this);

        Events.on('user.updated').subscribe((evt: any) => {
            this.updateUser(evt.data, true);
        });

        Events.on('user.created').subscribe((evt: any) => {
            this.createUser(evt.data, true);
        });

        Events.on('user.deleted').subscribe((evt: any) => {
            this.deleteUser(evt.data, true);
        });
    }

    render() {
        const columns: [ColumnData] = [
            {
                name: 'username',
                numeric: false,
                noPadding: false,
                label: 'Gebruikersnaam'
            },
            {
                name: 'name',
                numeric: false,
                noPadding: false,
                label: 'Naam'
            },
            {
                name: 'email',
                numeric: false,
                noPadding: false,
                label: 'E-mail'
            },
            {
                name: 'admin',
                numeric: false,
                noPadding: false,
                label: 'Admin'
            }
        ];

        const newProfile = {
            username: '',
            password: '',
            email: '',
            name: '',
            isAdmin: false,
            profile_image: ''
        }

        const addDialogOptions = {
            title: 'Spelleider toevoegen',
            dialog: EditUserDialog,
            adminOptions: true,
            newUser: true,
            callback: this.createUser,
            data: newProfile
        }

        const editDialogOptions = {
            title: 'Spelleider bewerken',
            dialog: EditUserDialog,
            adminOptions: true,
            callback: this.updateUser
        }

        const deleteConformDialogOptions = {
            title: 'Spelleider verwijderen',
            text: 'Weet je zeker dat je deze spelleider wilt verwijderen?',
            callback: this.deleteUser,
            multiCallback: this.deleteUsers
        };

        return (
            <Card style={{ height: '100%' }}>
                <TableView
                    style={{ height: '100%' }}
                    title="Spelleiders"
                    store={this.tableData}
                    selectableRows={true}
                    columns={columns}
                    addDialogOptions={addDialogOptions}
                    editDialogOptions={editDialogOptions}
                    deleteConfirmDialogOptions={deleteConformDialogOptions}
                />
                <Snackbar
                    
                    open={this.state.snackbarOpen}
                    autoHideDuration={3000}
                    onRequestClose={this.closeSnackbar}
                    message={<span>{this.state.snackbarMessage}</span>}
                />
            </Card>
        );
    }

    
    private createUser(user: User, resend: boolean = false){
        user.selected = false;
        let success = this.tableData.create(user);
        if(success && !resend){
            axios.put('api/user', user)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Spelleider toegevoegd" });
                    Events.send('user.created', user);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het aanmaken" });
        }
        return success;
    }

    private updateUser(user: User, resend: boolean = false){
        user.selected = false;
        let success = this.tableData.update(user);
        
        if ((Auth.authenticatedUser as User).username === user.username) {
            Auth.onAuthenticatedUserUpdated.next(user);
        }
        
        if(success && !resend){
            axios.put('api/user', user)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Wijzigingen opgeslagen" });
                    Events.send('user.updated', user);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het opslaan" });
        }
        return success;
    }

    private deleteUser(user: User, resend: boolean = false){
        user.selected = false;
        let success = this.tableData.delete(user);
        if(success && !resend){
            axios.delete('api/user/' + user.username)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Spelleider verwijderd" });
                    Events.send('user.deleted', user);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het verwijderen" });
        }
        return success;
    }

    private deleteUsers(users: any){
        let success = false;
        let usernames:{}[] = [];
        for(var k in users){
            usernames.push(users[k].username);
            this.tableData.delete(users[k]);
        }
        axios.delete('api/user/?usernames=' + usernames.join())
            .then(res => {
                success = true;
                this.setState({ snackbarOpen: true, snackbarMessage: "Spelleiders verwijderd" });
                for(var k in users){
                    Events.send('user.deleted', users[k]);
                }
            });
        return success;
    }

    private closeSnackbar(){
        this.setState({snackbarOpen: false});
    }
}