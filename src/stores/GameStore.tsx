import { observable, action, computed, extendObservable, toJS } from 'mobx';
import Game from '../models/Game';
import iDataStore from './iDataStore';
import axios from 'axios';

export default class GameStore implements iDataStore {

    @observable isLoading: boolean = false;
    readonly registry = observable<Game>([]);

    @computed get games(): Game[] {
        return this.registry;
    }

    @computed get selected(): {}[] {
        return this.registry.filter((row: Game) => row.selected);
    }

    @computed get numSelected(): number {
        return this.registry.filter((row: Game) => row.selected).length;
    }

    getGame(hash: string): Game | undefined {
        let game: Game | undefined;
        this.registry.forEach((row: Game) => {
            if (row.hash === hash) {
                game = row;
                return;
            }
        });
        return game;
    }

    @action loadGames() {
        this.isLoading = true;
        axios.get('api/game')
            .then(res => {
                this.registry.clear();
                res.data.map((game: Game) => {
                    game.selected = false;
                    this.registry.push(game);
                });
                this.isLoading = false;
            });
    }

    @action toggleSelectAll(checked: boolean): void {
        this.registry.map((row: Game) => {
            row.selected = checked;
        });
    }

    @action create(game: any) {
        this.registry.push(game);
        // TODO: save to server
        return true;
    }

    @action update(game: Game) {
        this.registry.forEach((row: Game) => {
            if (row.hash === game.hash) {
                extendObservable(row, toJS(game));
                return;
            }
        });
        // TODO: save to server if something changed
        return true;
    }

    @action delete(game: any) {
        this.registry.remove(game);
        // TODO: save to server
        return true;
    }
}