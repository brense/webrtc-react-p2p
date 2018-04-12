import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TextField, List, ListItem, ListItemText, Avatar, Menu, MenuItem, Typography } from 'material-ui';
import { Flex, Item } from 'react-flex';
import { Auth } from '../Auth';
import Events from '../Events';
import User from '../users/User';
const bell = require('../audio/Desk-bell-sound.wav');

class Chat extends React.Component {

    private chatForm: any;
    private newMessage: boolean = false;
    private connectedUsers = {};
    private menuButton;
    private messageInput;
    private bell = new Audio(bell);

    state = {
        messages: [],
        author: {
            name: '',
            profile_image: ''
        },
        message: '',
        connectedUsers: {},
        open: false
    };

    constructor(props: any) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
        this.handleSendTo = this.handleSendTo.bind(this);
    }

    componentDidMount() {
        this.setState({ author: Auth.authenticatedUser });

        Auth.onAuthenticatedUserUpdated.subscribe((user: User) => {
            this.setState({ author: user });
        });

        Events.on('message.new').subscribe((evt: any) => {
            if(evt.data.text.indexOf('@' + (Auth.authenticatedUser as User).username) >= 0){
                this.bell.play();
            }
            this.addMessage(evt.data);
        });

        Events.on('user.updated').subscribe((evt: any) => {
            if(this.connectedUsers[evt.from].username === evt.data.username && this.refs.messageList){
                this.connectedUsers[evt.from] = evt.data;
                this.setState({connectedUsers: this.connectedUsers});
            }
        });

        Events.on('user').subscribe((evt: any) => {
            if(typeof this.connectedUsers[evt.from] === 'undefined'){
                this.connectedUsers[evt.from] = evt.data;
                this.setState({connectedUsers: this.connectedUsers});
                this.addMessage({ author: {name: 'System'}, text: this.connectedUsers[evt.from].name + ' connected', time: new Date()});
            }
        });

        Events.on('disconnected').subscribe((evt: any) => {
            if(typeof this.connectedUsers[evt.from] !== 'undefined'){
                this.addMessage({ author:{name: 'System'}, text: this.connectedUsers[evt.from].name + ' disconnected', time: new Date()});
                delete this.connectedUsers[evt.from];
                this.setState({connectedUsers: this.connectedUsers});
            }
        });
    }

    componentDidUpdate(prevProps) {
        if (this.newMessage) {
            var scrollNode = ReactDOM.findDOMNode(this.refs.messageList);
            scrollNode.scrollTop = scrollNode.scrollHeight;
            this.newMessage = false;
        }
    }

    sendMessage = (event: any) => {
        event.preventDefault();
        var message = {
            author: this.state.author,
            text: this.state.message,
            time: new Date()
        };
        Events.send('message.new', message);
        this.chatForm.reset();
        this.setState({
            message: ''
        })
        this.addMessage(message);
    }

    render() {
        const me: any = Auth.authenticatedUser;
        return (
            <Flex column alignItems="left" style={{ width: '340px' }}>
                <Item flex={true} style={{ overflow: 'auto' }} ref="messageList">
                    <List>
                        {this.state.messages.map(function (message: any, i: number) {
                            if(message.author.name === 'System'){
                                return <ListItem key={i}>
                                    <ListItemText primary={<div style={{ position: 'relative', fontSize: '14px' }}><code>{message.text}</code><span style={{ position: 'absolute', right: 0, fontSize: '14px', color: '#999' }}>{new Date(message.time).toLocaleTimeString()}</span></div>} /></ListItem>;
                            } else {
                            return <ListItem key={i} style={{opacity: me.username === message.author.username ? 0.6 : 1, backgroundColor: message.text.indexOf('@' + me.username) > -1 ? '#E3F2FD' : null}}>
                                <Avatar src={message.author.profile_image} />
                                <ListItemText primary={<div style={{ position: 'relative' }}><span>{message.author.name}</span><span style={{ position: 'absolute', right: 0, fontSize: '14px', color: '#999' }}>{new Date(message.time).toLocaleTimeString()}</span></div>}
                                secondary={message.text} /></ListItem>;
                            }
                        })}
                    </List>
                </Item>
                <Item flex={false}>
                    <form onSubmit={this.sendMessage} ref={(form: any) => this.chatForm = form}>
                        <TextField label="Typ een bericht..." value={this.state.message} onChange={this.handleInputChange} inputRef={(input) => { this.messageInput = input; }} style={{ width: '100%' }} />
                    </form>
                </Item>
                <Item flex={false}>
                    <Typography style={{cursor: 'pointer', textAlign: 'right', padding: '4px 12px'}}>
                        <span ref={(node) => { this.menuButton = node; }} onClick={this.openMenu}>{Object.keys(this.state.connectedUsers).length} Verbonden gebruiker{Object.keys(this.state.connectedUsers).length !== 1 ? 's' : ''}</span>
                    </Typography>
                    <Menu
                        anchorEl={this.menuButton}
                        open={this.state.open}
                        onRequestClose={this.handleRequestClose}
                    >
                        {
                            Object.getOwnPropertyNames(this.state.connectedUsers).map((i, user) => {
                                return (<MenuItem key={i} onClick={() => {this.handleSendTo(this.state.connectedUsers[i])}}>
                                    <Avatar src={this.state.connectedUsers[i].profile_image} />&nbsp;&nbsp;&nbsp;
                                    <span>{this.state.connectedUsers[i].name}</span>
                                </MenuItem>);
                            })
                        }
                    </Menu>
                </Item>
            </Flex>
        );
    }


    private handleSendTo(user: any){
        this.setState({
            message: '@' + user.username + ' ',
            open: false
        });
        this.messageInput.focus();
    }

    private handleInputChange(event) {
        this.setState({
            message: event.target.value
        });
    }

    private addMessage (message: any) {
        this.newMessage = true;
        var messages: Array<any> = this.state.messages;
        messages.push(message);
        if(this.refs.messageList) {
            this.setState({messages: messages});
        }
    }

    private openMenu(){
        this.setState({open: true});
    }

    private handleRequestClose(){
        this.setState({open: false});
    }
}

export default Chat;