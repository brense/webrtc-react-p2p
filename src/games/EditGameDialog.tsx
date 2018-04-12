import * as React from 'react';
import { TextField } from 'material-ui';
import { Flex } from 'react-flex';
import EditDialog from '../data-views/EditDialog';
import Game from '../games/Game';
import { observer } from 'mobx-react';
import Stepper, { Step, StepLabel, StepContent } from 'material-ui/Stepper';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';
import InlineEditField from './InlineEditField';
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List';
import Tooltip from 'material-ui/Tooltip';

@observer
class EditGameDialog extends React.Component<{ data: any, title: string, button: any, callback: any }> {
    state = {
        game: this.props.data,
        edit: null
    };

    constructor(props: any) {
        super(props);

        this.addStep = this.addStep.bind(this);
        this.addLine = this.addLine.bind(this);
        this.save = this.save.bind(this);
        this.onOpen = this.onOpen.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.stepChanged = this.stepChanged.bind(this);
        this.removeStep = this.removeStep.bind(this);
        this.lineChanged = this.lineChanged.bind(this);
        this.removeLine = this.removeLine.bind(this);
    }

    private handleInputChange(evt: any, checked?) {
        const value = evt.target.type === 'checkbox' ? checked : evt.target.value;
        const name = evt.target.name;
        this.setState({ game: { ...this.state.game, [name]: value } });
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
                        <TextField label="Titel" value={this.state.game.title} onChange={this.handleInputChange} name="title" style={{ width: '100%' }} margin="normal" />
                        <TextField label="Beschrijving" multiline={true} rows={4} value={this.state.game.description} onChange={this.handleInputChange} name="description" style={{ width: '100%' }} margin="normal" />
                    </Flex>
                </form>
                {this.state.game.hash && (<div>
                    <p>&nbsp;</p>
                    <Typography type="title">Spel uitleg</Typography>
                    <Stepper orientation="vertical">
                        {this.state.game.explanationSteps.map((step, si) => {
                            return (
                                <Step key={step.hash} active={true}>
                                    <StepLabel>
                                        {this.state.edit !== si ? step.title : (<InlineEditField data={step} field="title" onChange={(data:any) => this.stepChanged(data)} />)}
                                    </StepLabel>
                                    <StepContent>
                                        <List>
                                            {step.lines.map((line, li) => {
                                                return (
                                                    <ListItem key={line.hash} dense={true}>
                                                        <ListItemText
                                                            primary={this.state.edit !== si ? line.title : (<InlineEditField data={line} field="title" onChange={(data:any) => this.lineChanged(data, step)} />)}
                                                            secondary={this.state.edit !== si ? line.text : (<InlineEditField data={line} field="text" onChange={(data:any) => this.lineChanged(data, step)} />)}
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <Tooltip id="tooltip-remove-line" title="Verwijderen" placement="bottom">
                                                                <IconButton onClick={() => this.removeLine(line, step)}><Icon>delete</Icon></IconButton>
                                                            </Tooltip>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                )
                                            })}
                                        </List>
                                        <Button raised={true} dense={true} onClick={() => this.addLine(step)}><Icon>add_circle</Icon>&nbsp;&nbsp;Regel toevoegen</Button>
                                        <Tooltip id="tooltip-edit-mode" title={this.state.edit === si ? 'Klaar met bewerken' : 'Bewerk modus inschakelen'} placement="bottom">
                                            <IconButton onClick={() => this.setState({edit: (this.state.edit === si ? null : si)})}><Icon>{this.state.edit === si ? 'check' : 'create'}</Icon></IconButton>
                                        </Tooltip>
                                        <Tooltip id="tooltip-remove-step" title="Stap verwijderen" placement="bottom">
                                            <IconButton onClick={() => this.removeStep(step)}><Icon>delete</Icon></IconButton>
                                        </Tooltip>
                                    </StepContent>
                                </Step>
                            )
                        })}
                    </Stepper>
                    <Button raised={true} color="primary" onClick={this.addStep}><Icon>add_circle</Icon>&nbsp;&nbsp;Stap toevoegen</Button>
                </div>)}
            </EditDialog>
        )
    }

    private save(){
        return this.props.callback(this.state.game);
    }

    private addStep(){
        let steps:{}[] = [];
        if(typeof this.state.game.explanationSteps !== 'undefined'){
            steps = this.state.game.explanationSteps;
        }
        const stepHash = btoa(new Date().getTime().toString());
        steps.push({title: 'Nieuwe stap', lines: [], hash: stepHash});
        this.setState({ game: { ...this.state.game, explanationSteps: steps } });
    }

    private stepChanged(step:any){
        let steps:any = this.state.game.explanationSteps;
        for(let i in steps){
            if(steps[i].hash === step.hash){
               steps[i] = step;
            }
        }
        this.setState({ game: { ...this.state.game, explanationSteps: steps } });
    }

    private removeStep(step: any){
        let newSteps:{}[] = [];
        for(let s of this.state.game.explanationSteps){
            if(s.hash !== step.hash){
                newSteps.push(s);
            }
        }
        this.setState({ game: { ...this.state.game, explanationSteps: newSteps } });
    }

    private addLine(step:any){
        const lineHash = btoa(new Date().getTime().toString());
        step.lines.push({title: 'Nieuwe regel', text: "Uitleg", hash: lineHash});
        this.stepChanged(step);
    }

    private lineChanged(line:any, step:any){
        for(let i in step.lines){
            if(step.lines[i].hash === step.hash){
               step.lines[i] = step;
            }
        }
        this.stepChanged(step);
    }

    private removeLine(line:any, step:any){
        let newLines:{}[] = [];
        for(let l of step.lines){
            if(l.hash !== line.hash){
                newLines.push(l);
            }
        }
        step.lines = newLines;
        this.stepChanged(step);
    }

    private onOpen(game: Game){
        this.setState({game: game});
    }
}

export default EditGameDialog;