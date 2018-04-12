import * as React from 'react';
import Events from '../Events';
import { List, ListItem, ListItemText, Card, AppBar, Toolbar, Typography } from 'material-ui';
import Hidden from 'material-ui/Hidden';
import { Flex, Item } from 'react-flex';

export default class Debug extends React.Component {

    state = {
        eventsList: []
    }

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        this.setState({eventsList: Events.getEventsList() });
        Events.onNewEvent.subscribe((evt: any) => {
            this.setState({eventsList: Events.getEventsList() });
        });
    }

    render() {
        return (
            <Flex row={true} alignItems="left" style={{ height: '100%' }}>
                <Hidden mdDown><Item style={{ width: '340px' }} flex={false} /></Hidden>
                <Item flex={true}>
                    <Card style={{ height: '100%' }}>
                        <Flex column={true} alignItems="left">
                            <AppBar position="static" elevation={1}>
                                <Toolbar>
                                    <Typography type="headline" style={{ color: '#fff' }}>Events list</Typography>
                                </Toolbar>
                            </AppBar>
                            <Item flex={true} style={{ overflow: 'auto' }}>
                                <List>
                                    {this.state.eventsList.map(function (event: any, i: number) {
                                        return <ListItem key={i}><ListItemText primary={event.event} secondary={event.peer} /></ListItem>;
                                    })}
                                </List>
                            </Item>
                        </Flex>
                    </Card>
                </Item>
            </Flex>
        );
    }
}