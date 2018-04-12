import * as React from 'react';
import { AppBar, Toolbar, Typography, Table, TableHead, TableBody, TableCell, TableRow, Checkbox, IconButton, Icon, Dialog, DialogContent, DialogActions, DialogTitle, Button } from 'material-ui';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import DataStore from './DataStore';
import { withStyles } from 'material-ui/styles';
import blue from 'material-ui/colors/blue';

// TODO: this needs to be defined on a higher level so it can also be used in MasonryView

export interface DeleteConfirmDialogProps {
    title: string;
    text: string;
    callback: any;
    multiCallback: any;
}

export interface AddDialogOptions {
    title: string;
    dialog: any;
    data: any;
    callback: any;
}

export interface EditDialogOptions {
    title: string;
    dialog: any;
    callback: any;
}

export interface ColumnData {
    name: string;
    numeric: boolean;
    noPadding: boolean;
    label: string;
}

const styles = {
    checked: {
        color: blue[500],
    },
}

class TempStore {
    @observable row:any;
    @action setRow(row: any){
        this.row = row;
    }
}

@observer
class TableView extends React.Component<{
    title: string,
    index: string,
    selectableRows?: boolean,
    store: DataStore,
    columns: [ColumnData],
    addDialogOptions?: AddDialogOptions,
    editDialogOptions?: EditDialogOptions,
    deleteConfirmDialogOptions?: DeleteConfirmDialogProps,
    classes?: any
}> {

    constructor(props: any) {
        super(props);

    }

    // TODO: sorting and searching...

    render() {
        const { classes } = this.props;
        let AddDialog;
        if(this.props.addDialogOptions){
            AddDialog = this.props.addDialogOptions.dialog;
        }
        let EditDialog;
        if(this.props.editDialogOptions){
            EditDialog = this.props.editDialogOptions.dialog;
        }
        const tempStore = new TempStore();
        tempStore.setRow(this.props.store.rows[0]);
        return (
            <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
                <AppBar position="static" color={this.props.store.selected.length === 0 ? "default" : "accent"} elevation={this.props.store.selected.length === 0 ? 0 : 1}>
                    <Toolbar style={{display:'flex', flexDirection:'row'}}>
                        <Typography type="headline" color="inherit" style={{flex:1}}>
                            {this.props.title}
                        </Typography>
                        {this.props.store.selected.length > 0 && (<Typography type="subheading" color="inherit">{this.props.store.selected.length} geselecteerd</Typography>)}
                        {(this.props.deleteConfirmDialogOptions && this.props.store.selected.length > 0) && (<ConfirmDeleteDialogButton
                            title={this.props.deleteConfirmDialogOptions.title}
                            text={this.props.deleteConfirmDialogOptions.text}
                            callback={this.props.deleteConfirmDialogOptions.multiCallback}
                            data={this.props.store.selected}
                        />)}
                        {(this.props.addDialogOptions && AddDialog && this.props.store.selected.length === 0) && (
                            <AddDialog {...this.props.addDialogOptions} button={<Button raised={true} color="primary" style={{ padding: '8px 16px', lineHeight: '1.4em' }}><Icon>add</Icon>&nbsp;&nbsp;{this.props.addDialogOptions.title}</Button>} />
                        )}
                    </Toolbar>
                </AppBar>
                <div style={{flex:1, overflow:'auto'}}>
                    <Table>
                        {this.renderTableHead()}
                        <TableBody>
                            {this.props.store.rows.map((row: any, i: number) => {
                                return (
                                    <TableRow
                                        hover={true}
                                        onClick={(event) => (row.selected = !row.selected)}
                                        role="checkbox"
                                        aria-checked={row.selected}
                                        tabIndex={-1}
                                        key={row[this.props.index]}
                                        selected={row.selected}
                                    >
                                        {this.props.selectableRows && (<TableCell style={{ width: 1, paddingRight: 0 }}>
                                            <Checkbox checked={row.selected} classes={{
                                                checked: classes.checked,
                                            }} />
                                        </TableCell>)}
                                        {this.props.columns.map((column: ColumnData, c: number) => {
                                            return (<TableCell key={c} numeric={column.numeric} {...column.noPadding ? { padding: 'none' } : {}}>
                                                {typeof (row[column.name]) === 'boolean' ? (row[column.name] ? <Icon color="primary">done</Icon> : '') : row[column.name]}
                                            </TableCell>);
                                        })}
                                        {EditDialog && (
                                            <TableCell numeric={true} padding="none">
                                                <EditDialog {...this.props.editDialogOptions} data={row} button={<IconButton><Icon>create</Icon></IconButton>} />
                                            </TableCell>
                                        )}
                                        {this.props.deleteConfirmDialogOptions && (
                                            <TableCell numeric={true} style={{ width: 1 }}>
                                                <ConfirmDeleteDialogButton
                                                    title={this.props.deleteConfirmDialogOptions.title}
                                                    text={this.props.deleteConfirmDialogOptions.text}
                                                    callback={this.props.deleteConfirmDialogOptions.callback}
                                                    data={row}
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    private renderTableHead() {
        const { classes } = this.props;
        return (
            <TableHead>
                <TableRow>
                    {this.props.selectableRows && (<TableCell style={{ width: 1, paddingRight: 0 }}>
                        <Checkbox
                            indeterminate={this.props.store.selected.length > 0 && this.props.store.selected.length < this.props.store.rows.length}
                            checked={this.props.store.selected.length === this.props.store.rows.length}
                            onChange={(event: any, checked: boolean) => { this.props.store.toggleSelectAll(checked) }}
                            classes={{
                                checked: classes.checked,
                            }} />
                    </TableCell>)}
                    {this.props.columns.map((column: ColumnData, i: number) => {
                        return (
                            <TableCell numeric={column.numeric} {...column.noPadding ? { padding: 'none' } : {}} key={i}>{column.label}</TableCell>
                        );
                    })}
                    {this.props.editDialogOptions && (<TableCell numeric={true}  padding="none" />)}
                    {this.props.deleteConfirmDialogOptions && (<TableCell numeric={true} style={{ width: 1 }} />)}
                </TableRow>
            </TableHead>
        );
    }
}

class ConfirmDeleteDialogButton extends React.Component<{
    title: string,
    text: string,
    callback: any,
    data: any
}> {

    state = {
        confirmDialogOpen: false
    };

    constructor(props: any) {
        super(props);

        this.openConfirmDialog = this.openConfirmDialog.bind(this);
        this.cancelConfirmDialog = this.cancelConfirmDialog.bind(this);
        this.agreeConfirmDialog = this.agreeConfirmDialog.bind(this);
    }

    render() {
        return (
            <span>
                <IconButton onClick={this.openConfirmDialog} color="inherit">
                    <Icon>delete</Icon>
                </IconButton>
                <Dialog
                    title={this.props.title}
                    open={this.state.confirmDialogOpen}
                    onRequestClose={this.cancelConfirmDialog}
                    ignoreBackdropClick={true}
                    ignoreEscapeKeyUp={true}
                >
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>
                        <p>{this.props.text}</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.cancelConfirmDialog}>Annuleren</Button>
                        <Button color="primary" onClick={this.agreeConfirmDialog}>Verwijderen</Button>
                    </DialogActions>
                </Dialog>
            </span>
        );
    }

    private openConfirmDialog() {
        this.setState({ confirmDialogOpen: true });
    }

    private cancelConfirmDialog() {
        this.setState({ confirmDialogOpen: false });
    }

    private agreeConfirmDialog() {
        this.setState({ confirmDialogOpen: false });
        this.props.callback(this.props.data);
    }
}

export default withStyles(styles)(TableView);