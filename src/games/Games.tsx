import * as React from 'react';
import StoreManager from '../data-views/StoreManager';
import Events from '../Events';
import GamesDataStore from './GamesDataStore';
import ScenariosDataStore from './ScenariosDataStore';
import Game from './Game';
import Scenario from './Scenario';
import EditGameDialog from './EditGameDialog';
import EditScenarioDialog from './EditScenarioDialog';
import { Card, CardContent, Snackbar, Typography, Button, IconButton, Icon, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Divider } from 'material-ui';
import axios from 'axios';
import Masonry from 'react-masonry-component';
import { observer } from 'mobx-react';
import ConfirmDialog from '../ConfirmDialog';

@observer
export default class Games extends React.Component {

    private tableData: GamesDataStore;

    state = {
        snackbarOpen: false,
        snackbarMessage: '',
        confirmDialogOpen: false
    };

    constructor(props: {}) {
        super(props);

        if (!StoreManager.exists('games')) {
            StoreManager.set('games', new GamesDataStore());
        }
        this.tableData = StoreManager.get('games');

        this.createGame = this.createGame.bind(this);
        this.updateGame = this.updateGame.bind(this);
        this.deleteGame = this.deleteGame.bind(this);
        this.deleteGames = this.deleteGames.bind(this);
        this.createScenario = this.createScenario.bind(this);
        this.updateScenario = this.updateScenario.bind(this);
        this.deleteScenario = this.deleteScenario.bind(this);
        this.closeSnackbar = this.closeSnackbar.bind(this);

        Events.on('game.updated').subscribe((evt: any) => {
            this.updateGame(evt.data, true);
        });

        Events.on('game.created').subscribe((evt: any) => {
            this.createGame(evt.data, true);
        });

        Events.on('game.deleted').subscribe((evt: any) => {
            this.deleteGame(evt.data, true);
        });

        Events.on('scenario.updated').subscribe((evt: any) => {
            this.updateScenario(evt.data, true);
        });

        Events.on('scenario.created').subscribe((evt: any) => {
            this.createScenario(evt.data, true);
        });

        Events.on('scenario.deleted').subscribe((evt: any) => {
            this.deleteScenario(evt.data, true);
        });
    }

    render() {

        const addScenarioDialogOptions = {
            callback: this.createScenario,
            title: "Scenario toevoegen",
            gamesStore: this.tableData
        }
        let childElements = this.tableData.rows.map((game: Game, i: number) => {
            if (!StoreManager.exists('scenarios.' + game.hash)) {
                StoreManager.set('scenarios.' + game.hash, new ScenariosDataStore(game.hash));
            }
            const newScenario = {
                title: '',
                description: '',
                game: game.hash
            }
            
            return (
                <div key={game.hash} style={{width:"33.33%", padding:8, boxSizing:"border-box"}}>
                    <Card>
                        <CardContent style={{position: 'relative'}}>
                            <Typography type="headline" component="h2">
                                {game.title}
                            </Typography>
                            <Typography component="p">
                                {game.description}
                            </Typography>
                            <span style={{position: 'absolute', top: 0, right: 0}}>
                                <EditGameDialog
                                    button={<IconButton><Icon>create</Icon></IconButton>}
                                    title="Spel bewerken"
                                    data={game}
                                    callback={this.updateGame}
                                    />
                                <ConfirmDialog
                                    button={<IconButton><Icon>delete</Icon></IconButton>}
                                    title="Spel verwijderen"
                                    text="Weet je zeker dat je dit spel wilt verwijderen?"
                                    confirmText="Verwijderen"
                                    confirm={() => this.deleteGame(game)}
                                />
                            </span>
                        </CardContent>
                        <List style={{ background: "#f6f6f6" }} disablePadding={true}>
                            <Divider />
                            {StoreManager.get('scenarios.' + game.hash).rows.map((scenario: Scenario) => {
                                return (
                                    <ListItem button={true} key={scenario.hash}>
                                        <ListItemText primary={scenario.title} />
                                        <ListItemSecondaryAction>
                                            <EditScenarioDialog
                                                title="Scenario bewerken"
                                                data={scenario}
                                                callback={this.updateScenario}
                                                button={<IconButton><Icon>create</Icon></IconButton>}
                                                gamesStore={this.tableData}
                                            />
                                            <ConfirmDialog
                                                button={<IconButton><Icon>delete</Icon></IconButton>}
                                                title="Scenario verwijderen"
                                                text="Weet je zeker dat je dit scenario wilt verwijderen?"
                                                confirmText="Verwijderen"
                                                confirm={() => this.deleteScenario(scenario)}
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )
                            })}
                            <EditScenarioDialog {...addScenarioDialogOptions} data={newScenario} button={<ListItem button={true}><ListItemIcon><Icon>add</Icon></ListItemIcon><ListItemText primary="Scenario toevoegen" /></ListItem>} />
                        </List>
                    </Card>
                </div>
            )
        });

        const newGame = {
            title: '',
            description: '',
            explanationSteps: []
        }

        const addGameDialogOptions = {
            callback: this.createGame,
            title: "Spel toevoegen",
            data: newGame
        }

        return (
            <div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Typography type="headline" color="inherit" style={{ flex: 1 }}>
                        Spellen beheren
                    </Typography>
                    <EditGameDialog {...addGameDialogOptions} button={<Button raised={true} color="primary" style={{ padding: '8px 16px', lineHeight: '1.4em' }}><Icon>add</Icon>&nbsp;&nbsp;{addGameDialogOptions.title}</Button>} />
                </div>
                <Masonry style={{margin:"8px -8px"}}>
                    {childElements}
                </Masonry>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    open={this.state.snackbarOpen}
                    autoHideDuration={3000}
                    onRequestClose={this.closeSnackbar}
                    message={<span>{this.state.snackbarMessage}</span>}
                />
            </div>
        );
    }
    
    private createGame(game: Game, resend: boolean = false){
        game.selected = false;
        game.hash = btoa(new Date().getTime().toString());
        let success = this.tableData.create(game);
        if(success && !resend){
            axios.put('api/game', game)
                .then(res => {
                    if (!StoreManager.exists('scenarios.' + game.hash)) {
                        StoreManager.set('scenarios.' + game.hash, new ScenariosDataStore(game.hash));
                    }
                    this.setState({ snackbarOpen: true, snackbarMessage: "Spel toegevoegd" });
                    Events.send('game.created', game);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het aanmaken" });
        }
        return success;
    }

    private updateGame(game: Game, resend: boolean = false){
        game.selected = false;
        let success = this.tableData.update(game);
        
        if(success && !resend){
            axios.put('api/game', game)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Wijzigingen opgeslagen" });
                    Events.send('game.updated', game);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het opslaan" });
        }
        return success;
    }

    private deleteGame(game: Game, resend: boolean = false){
        game.selected = false;
        let success = this.tableData.delete(game);
        if(success && !resend){
            axios.delete('api/game/' + game.hash)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Spel verwijderd" });
                    Events.send('game.deleted', game);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het verwijderen" });
        }
        return success;
    }

    private deleteGames(games: any){
        let success = false;
        let hashes:{}[] = [];
        for(var k in games){
            hashes.push(games[k].hash);
            this.tableData.delete(games[k]);
        }
        axios.delete('api/game/?hashes=' + hashes.join())
            .then(res => {
                success = true;
                this.setState({ snackbarOpen: true, snackbarMessage: "Spellen verwijderd" });
                for(var k in hashes){
                    Events.send('game.deleted', hashes[k]);
                }
            });
        return success;
    }

    private createScenario(scenario: Scenario, resend: boolean = false){
        scenario.hash = btoa(new Date().getTime().toString());
        if (!StoreManager.exists('scenarios.' + scenario.game)) {
            StoreManager.set('scenarios.' + scenario.game, new ScenariosDataStore(scenario.game));
        }
        let success = StoreManager.get('scenarios.' + scenario.game).create(scenario);

        if(success && !resend){
            axios.put('api/scenario', scenario)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Scenario toegevoegd" });
                    Events.send('scenario.created', scenario);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het aanmaken" });
        }
        return success;
    }

    private updateScenario(scenario: Scenario, resend: boolean = false) {
        scenario.selected = false;
        if (!StoreManager.exists('scenarios.' + scenario.game)) {
            StoreManager.set('scenarios.' + scenario.game, new ScenariosDataStore(scenario.game));
        }
        let success = StoreManager.get('scenarios.' + scenario.game).create(scenario);

        if (success && !resend) {
            axios.put('api/scenario', scenario)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Wijzigingen opgeslagen" });
                    Events.send('scenario.updated', scenario);
                });
        } else if (!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het opslaan" });
        }
        return success;
    }

    private deleteScenario(scenario: Scenario, resend: boolean = false){
        let success = StoreManager.get('scenarios.' + scenario.game).delete(scenario);
        if(success && !resend){
            axios.delete('api/scenario/' + scenario.hash)
                .then(res => {
                    this.setState({ snackbarOpen: true, snackbarMessage: "Scenario verwijderd" });
                    Events.send('scenario.deleted', scenario);
                });
        } else if(!success) {
            this.setState({ snackbarOpen: true, snackbarMessage: "Er is iets mis gegaan bij het verwijderen" });
        }
        return success;
    }

    private closeSnackbar(){
        this.setState({snackbarOpen: false});
    }
}