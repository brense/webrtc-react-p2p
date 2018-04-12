import * as React from 'react';
import { TextField, Avatar, FlatButton } from 'material-ui';
import { Flex, Item } from 'react-flex';
import Dropzone from 'react-dropzone';
import EditDialog from '../data-views/EditDialog';
import { Auth } from '../Auth';
import User from '../users/User';
import { observer } from 'mobx-react';

@observer
class EditUserDialog extends React.Component<{ data: any, title: string, button: any, callback: any, adminOptions?: boolean, newUser?: boolean }> {
    state = {
        profile: this.props.data
    };

    constructor(props: any) {
        super(props);

        this.save = this.save.bind(this);
        this.onOpen = this.onOpen.bind(this);
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
            this.setState({ profile: { ...this.state.profile, profile_image: base64string } });
        };
        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        if (typeof files[0] !== 'undefined') {
            reader.readAsDataURL(files[0]);
        }
    }

    render() {
        let dropzoneRef;
        const dialogOptions = {
            callback: this.save,
            title: this.props.title,
            button: this.props.button
        };
        return (
            <EditDialog {...dialogOptions}>
                <form>
                    <Flex column={true} alignItems="start center">
                        <Dropzone ref={(node) => { dropzoneRef = node; }} multiple={false} accept="image/*" maxSize={30000} onDrop={this.handleImageDrop} style={{ display: 'none' }} />
                        <Flex row={true} style={{ width: '100%' }}>
                            <span onClick={() => { dropzoneRef.open() }}><Avatar src={this.state.profile.profile_image} style={{ margin: '10px 10px 0 0' }} /></span>
                            <Item flex>
                                <TextField label="Naam" value={this.state.profile.name} onChange={this.handleInputChange} name="name" style={{ width: '100%' }} margin="normal" />
                            </Item>
                        </Flex>
                        <TextField label="Gebruikersnaam" value={this.state.profile.username} onChange={this.handleInputChange} disabled={!this.props.newUser} name="username" style={{ width: '100%' }} margin="normal" />
                        <TextField label="E-mail" value={this.state.profile.email} onChange={this.handleInputChange} name="email" style={{ width: '100%' }} margin="normal" />
                        {(!this.props.adminOptions || this.props.newUser) && <TextField label="Wachtwoord" type="password" value={this.state.profile.password} onChange={this.handleInputChange} name="password" style={{ width: '100%' }} margin="normal" />}
                        {(!this.props.adminOptions || this.props.newUser) && <TextField label="Herhaal wachtwoord" type="password" value={this.state.profile.passwordCompare} onChange={this.handleInputChange} name="passwordCompare" style={{ width: '100%' }} margin="normal" />}
                        {this.props.adminOptions && <FormGroup><FormControlLabel control={<Switch checked={this.state.profile.admin ? true : false} name="admin" onChange={this.handleInputChange} />} label="Admin" /></FormGroup>}
                    </Flex>
                </form>
            </EditDialog>
        )
    }

    private save(){
        return this.props.callback(this.state.profile);
    }

    private onOpen(profile: User){
        this.setState({profile: profile});
    }
}

export class EditProfileDialog extends React.Component<{ callback: any }> {

    state = {
        user: Auth.authenticatedUser as User
    }

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        this.setState({ user: Auth.authenticatedUser });
        Auth.onAuthenticatedUserUpdated.subscribe((user: User) => {
            this.setState({ user: user });
        });
    }

    render() {
        return (
            <EditUserDialog callback={this.props.callback} title="Profiel bewerken" button={<span style={{display: 'flex', flexDirection: 'row'}}><Avatar src={this.state.user.profile_image} /><Button>{this.state.user.name}</Button></span>} data={this.state.user} />
        )
    }
}

export default EditUserDialog;