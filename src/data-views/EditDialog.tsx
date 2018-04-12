import * as React from 'react';
import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from 'material-ui';

export default class EditDialog extends React.Component<{ title: string, button: any, callback: any, onOpen?: any }> {
    state = {
        open: false
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
    }

    render() {
        return (
            <span>
                <span onClick={() => this.open()}>{this.props.button}</span>
                <Dialog
                    open={this.state.open}
                    onRequestClose={() => this.cancel()}
                >
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>{this.props.children}</DialogContent>
                    <DialogActions>{this.actions}</DialogActions>
                </Dialog>
            </span>
        )
    }

    private open() {
        if(this.props.onOpen){
            this.props.onOpen();
        }
        this.setState({ open: true });
    }

    private cancel() {
        this.setState({ open: false });
    }

    private save() {
        if(this.props.callback()){
            this.setState({ open: false });
        }
    }
}