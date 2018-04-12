import * as React from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';
import axios from 'axios';
import { Subject } from 'rxjs/Subject';
import { Flex, Item } from 'react-flex';
import { Button, IconButton, TextField, Card, Icon, CardActions, CardContent } from 'material-ui';

export const Auth = {
    loginUrl: '',
    logoutUrl: '',
    isAuthenticated: false,
    isAdmin: false,
    authenticatedUser: {},
    onLogin: (user: any, token: string) => { },
    onLogout: () => { },
    setAuthenticatedUser(user: any){
        this.authenticatedUser = user;
        this.onAuthenticatedUserUpdated.next(user);
    },
    onAuthenticatedUserUpdated: new Subject(),
    authenticate(username: string, password: string, cb: any) {
        axios.post(this.loginUrl, { username: username, password: password })
            .then(res => {
                this.onLogin(res.data.user, res.data.token);
                localStorage.username = res.data.user.username;
                localStorage.password = res.data.user.password;
                this.isAuthenticated = true;
                this.isAdmin = res.data.user.admin ? true : false;
                this.authenticatedUser = res.data.user;
                cb(res);
            })
            .catch(e => {
                cb(e.response);
            });
    },
    signout(cb: any) {
        this.isAuthenticated = false;
        this.authenticatedUser = {};
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        this.onLogout();
        cb();
    }
};

export const LogoutButton = withRouter(({ history }) => (
    <IconButton onClick={() => { Auth.signout(() => history.push('/')); }}><Icon>power_settings_new</Icon></IconButton>
));

export const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props => (
            Auth.isAuthenticated ? (<Component {...props} />) : (
                <Redirect
                    to={{
                        pathname: '/login',
                        state: { from: props.location }
                    }}
                />
            )
        )}
    />
);

export const PrivateAdminRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props => (
            Auth.isAuthenticated && Auth.isAdmin ? (<Component {...props} />) : (
                <Redirect
                    to={{
                        pathname: '/login',
                        state: { from: props.location }
                    }}
                />
            )
        )}
    />
);

export class LoginForm extends React.Component<{ location: any }> {
    state = {
        redirectToReferrer: false,
        isValid: false,
        username: "",
        password: "",
        errors: { username: null, password: null }
    };

    private loginForm: any;
    //private errors = {};

    constructor(props: any) {
        super(props);
        this.login = this.login.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        //this.isValid = this.isValid.bind(this);
    }

    login = (event: any) => {
        event.preventDefault();
        Auth.authenticate(this.state.username, this.state.password, (response: any) => {
            if (response.status === 200) {
                this.setState({ redirectToReferrer: true, isValid: false });
                if (this.loginForm !== null) {
                    this.loginForm.reset();
                }
            } else {
                switch (response.data) {
                    case 'Password incorrect':
                        this.setState({ errors: { password: 'Wachtwoord onjuist' } });
                        break;
                    case 'User not found':
                        this.setState({ errors: { username: 'Spelleider niet gevonden' } });
                        break;
                    case 'User already logged in':
                        this.setState({ errors: { username: 'Spelleider is al ingelogd' } });
                        break;
                    default:
                }
            }
        });
    }

    componentDidMount() {
        // attempt to auto login
        if (typeof localStorage.username !== 'undefined' && typeof localStorage.password !== 'undefined') {
            Auth.authenticate(localStorage.username, localStorage.password, (response) => {
                if (typeof response !== 'undefined' && response.status === 200) {
                    this.setState({ redirectToReferrer: true, isValid: false });
                }
            });
        }
    }

    private handleInputChange(evt: any, checked?) {
        const value = evt.target.type === 'checkbox' ? checked : evt.target.value;
        const name = evt.target.name;
        this.setState({ [name]: value });
    }

    render() {
        const { from } = this.props.location.state || { from: { pathname: '/' } };
        const { redirectToReferrer } = this.state;

        if (redirectToReferrer) {
            return (
                <Redirect to={from} />
            );
        }

        return (
            <Flex column={true} alignItems="center">
                <Item flex={1} />
                <Card>
                    <form onSubmit={this.login} /*onChange={this.isValid}*/ ref={(form: any) => this.loginForm = form}>
                        <CardContent>
                            <h2 className="mdc-typography--headline">Spelleider login</h2>
                            <Flex column={true} alignItems="start">
                                <TextField label="Gebruikersnaam" onChange={this.handleInputChange} value={this.state.username} name="username" margin="normal" />
                                <TextField label="Wachtwoord" type="password" onChange={this.handleInputChange} value={this.state.password} name="password" margin="normal" />
                            </Flex>
                        </CardContent>
                        <CardActions style={{ textAlign: 'right' }}>
                            <Button raised={true} color="primary" type="submit" disabled={this.state.isValid}>Login</Button>
                        </CardActions>
                    </form>
                </Card>
                <Item flex={1} />
            </Flex>
        );
    }

    /*
    private isRequired(event: any, property: string, errorText: string) {
        if (event.target.value.length === 0) {
            this.errors[property] = errorText;
        } else {
            this.errors[property] = null;
        }
        this.setState({ errors: this.errors });
    }
    */

    /*
    private isValid() {
        if (this.state.errors.username == null
            && this.state.errors.password == null
            && typeof this.username !== 'undefined'
            && typeof this.password !== 'undefined'
            && this.username.input.value.length > 0
            && this.password.input.value.length > 0) {
            this.setState({ isValid: true });
        } else {
            this.setState({ isValid: false });
        }
    }
    */
}

export default Auth;