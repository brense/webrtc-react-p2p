import { observable, action, computed, extendObservable, toJS } from 'mobx';
import Game from '../models/Game';
import Scenario from '../models/Scenario';
import iDataStore from './iDataStore';
import axios from 'axios';

export default class ScenarioStore implements iDataStore {

    @observable isLoading: boolean = false;
    readonly registry = observable<Scenario>([]);

    @computed get scenarios(): Scenario[] {
        return this.registry;
    }

    @computed get selected(): {}[] {
        return this.registry.filter((row: Scenario) => row.selected);
    }

    @computed get numSelected(): number {
        return this.registry.filter((row: Scenario) => row.selected).length;
    }

    getScenario(hash: string): Scenario | undefined {
        let scenario: Scenario | undefined;
        this.registry.forEach((row: Scenario) => {
            if (row.hash === hash) {
                scenario = row;
                return;
            }
        });
        return scenario;
    }

    @action loadScenarios(game: Game) {
        this.isLoading = true;
        axios.get('api/game/' + game.hash + '/scenarios')
            .then(res => {
                this.registry.clear();
                res.data.map((scenario: Scenario) => {
                    scenario.selected = false;
                    this.registry.push(scenario);
                });
                this.isLoading = false;
            });
    }

    @action toggleSelectAll(checked: boolean): void {
        this.registry.map((row: Scenario) => {
            row.selected = checked;
        });
    }

    @action create(scenario: any) {
        this.registry.push(scenario);
        // TODO: save to server
        return true;
    }

    @action update(scenario: Scenario) {
        this.registry.forEach((row: Scenario) => {
            if (row.hash === scenario.hash) {
                extendObservable(row, toJS(scenario));
                return;
            }
        });
        // TODO: save to server if something changed
        return true;
    }

    @action delete(scenario: any) {
        this.registry.remove(scenario);
        // TODO: save to server
        return true;
    }
}