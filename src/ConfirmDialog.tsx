import * as React from 'react';
import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from 'material-ui';

export default class ConfirmDialog extends React.Component<{ title: string, text: string, confirmText: string, button: any, confirm: any }> {
    state = {
        open: false
    };

    constructor(props: any) {
        super(props);

        this.open = this.open.bind(this);
        this.cancel = this.cancel.bind(this);
        this.confirm = this.confirm.bind(this);
    }

    render() {
        return (
            <span>
                <span onClick={() => this.open()}>{this.props.button}</span>
                <Dialog
                    title={this.props.title}
                    open={this.state.open}
                    onRequestClose={this.cancel}
                    ignoreBackdropClick={true}
                    ignoreEscapeKeyUp={true}
                >
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>
                        <p>{this.props.text}</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.cancel}>Annuleren</Button>
                        <Button color="primary" onClick={this.confirm}>{this.props.confirmText}</Button>
                    </DialogActions>
                </Dialog>
            </span>
        )
    }

    private open() {
        this.setState({ open: true });
    }

    private cancel() {
        this.setState({ open: false });
    }

    private confirm() {
        if(this.props.confirm()){
            this.setState({ open: false });
        }
    }
}