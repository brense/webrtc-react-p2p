import * as React from 'react';
import { TextField } from 'material-ui';
import { Flex } from 'react-flex';
import EditDialog from '../data-views/EditDialog';
import { observer } from 'mobx-react';
import GamesDataStore from './GamesDataStore';
import Stepper, { Step, StepLabel, StepContent } from 'material-ui/Stepper';
import Typography from 'material-ui/Typography';
import InlineEditField from './InlineEditField';
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List';
import Tooltip from 'material-ui/Tooltip';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';

@observer
class EditScenarioDialog extends React.Component<{ data: any, title: string, button: any, callback: any, gamesStore: GamesDataStore }> {
    state = {
        scenario: this.props.data,
        edit: null
    };

    constructor(props: any) {
        super(props);

        this.addRound = this.addRound.bind(this);
        this.addLine = this.addLine.bind(this);
        this.save = this.save.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.roundChanged = this.roundChanged.bind(this);
        this.removeRound = this.removeRound.bind(this);
        this.lineChanged = this.lineChanged.bind(this);
        this.removeLine = this.removeLine.bind(this);
    }

    private handleInputChange(evt: any, checked?) {
        const value = evt.target.type === 'checkbox' ? checked : evt.target.value;
        const name = evt.target.name;
        this.setState({ scenario: { ...this.state.scenario, [name]: value } });
    }

    render() {
        const dialogOptions = {
            callback: this.save,
            title: this.props.title,
            button: this.props.button
        };
        return (
            <EditDialog {...dialogOptions}>
                <form>
                    <Flex column={true} alignItems="start center">
                        <TextField label="Titel" value={this.state.scenario.title} onChange={this.handleInputChange} name="title" style={{ width: '100%' }} margin="normal" />
                        <TextField label="Beschrijving" multiline={true} rows={4} value={this.state.scenario.description} onChange={this.handleInputChange} name="description" style={{ width: '100%' }} margin="normal" />
                    </Flex>
                </form>
                {this.state.scenario.hash && (<div>
                    <p>&nbsp;</p>
                    <Typography type="title">Rondes</Typography>
                    <Stepper orientation="vertical">
                        {this.state.scenario.rounds.map((round, si) => {
                            return (
                                <Step key={round.hash} active={true}>
                                    <StepLabel>
                                        {this.state.edit !== si ? round.title : (<InlineEditField data={round} field="title" onChange={(data:any) => this.roundChanged(data)} />)}
                                    </StepLabel>
                                    <StepContent>
                                        <List>
                                            {round.lines.map((line, li) => {
                                                return (
                                                    <ListItem key={line.hash} dense={true}>
                                                        <ListItemText
                                                            primary={this.state.edit !== si ? line.title : (<InlineEditField data={line} field="title" onChange={(data:any) => this.lineChanged(data, round)} />)}
                                                            secondary={this.state.edit !== si ? line.text : (<InlineEditField data={line} field="text" onChange={(data:any) => this.lineChanged(data, round)} />)}
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <Tooltip id="tooltip-remove-line" title="Verwijderen" placement="bottom">
                                                                <IconButton onClick={() => this.removeLine(line, round)}><Icon>delete</Icon></IconButton>
                                                            </Tooltip>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                )
                                            })}
                                        </List>
                                        <Button raised={true} dense={true} onClick={() => this.addLine(round)}><Icon>add_circle</Icon>&nbsp;&nbsp;Regel toevoegen</Button>
                                        <Tooltip id="tooltip-edit-mode" title={this.state.edit === si ? 'Klaar met bewerken' : 'Bewerk modus inschakelen'} placement="bottom">
                                            <IconButton onClick={() => this.setState({edit: (this.state.edit === si ? null : si)})}><Icon>{this.state.edit === si ? 'check' : 'create'}</Icon></IconButton>
                                        </Tooltip>
                                        <Tooltip id="tooltip-remove-step" title="Ronde verwijderen" placement="bottom">
                                            <IconButton onClick={() => this.removeRound(round)}><Icon>delete</Icon></IconButton>
                                        </Tooltip>
                                    </StepContent>
                                </Step>
                            )
                        })}
                    </Stepper>
                    <Button raised={true} color="primary" onClick={this.addRound}><Icon>add_circle</Icon>&nbsp;&nbsp;Ronde toevoegen</Button>
                </div>)}
            </EditDialog>
        )
    }

    private addRound(){
        let rounds:{}[] = [];
        if(typeof this.state.scenario.rounds !== 'undefined'){
            rounds = this.state.scenario.rounds;
        }
        const roundHash = btoa(new Date().getTime().toString());
        rounds.push({title: 'Nieuwe ronde', lines: [], hash: roundHash});
        this.setState({ scenario: { ...this.state.scenario, rounds: rounds } });
    }

    private roundChanged(round:any){
        let rounds:any = this.state.scenario.rounds;
        for(let i in rounds){
            if(rounds[i].hash === round.hash){
               rounds[i] = round;
            }
        }
        this.setState({ scenario: { ...this.state.scenario, rounds: rounds } });
    }

    private removeRound(round: any){
        let newRounds:{}[] = [];
        for(let r of this.state.scenario.rounds){
            if(r.hash !== round.hash){
                newRounds.push(r);
            }
        }
        this.setState({ scenario: { ...this.state.scenario, rounds: newRounds } });
    }

    private addLine(round:any){
        const lineHash = btoa(new Date().getTime().toString());
        round.lines.push({title: 'Nieuwe regel', text: "Uitleg", hash: lineHash});
        this.roundChanged(round);
    }

    private lineChanged(line:any, round:any){
        for(let i in round.lines){
            if(round.lines[i].hash === round.hash){
               round.lines[i] = round;
            }
        }
        this.roundChanged(round);
    }

    private removeLine(line:any, round:any){
        let newLines:{}[] = [];
        for(let l of round.lines){
            if(l.hash !== line.hash){
                newLines.push(l);
            }
        }
        round.lines = newLines;
        this.roundChanged(round);
    }

    private save(){
        return this.props.callback(this.state.scenario);
    }
}

export default EditScenarioDialog;