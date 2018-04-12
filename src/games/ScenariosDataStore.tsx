import DataStore from '../data-views/DataStore';
import { observable, action, computed, extendObservable, toJS } from 'mobx';
import Scenario from './Scenario';
import axios from 'axios';

export default class ScenariosDataStore implements DataStore {
  readonly rows = observable<Scenario>([])
  index = 'hash';

  constructor(game: string) {
    axios.get('api/game/' + game + '/scenarios')
      .then(res => {
        res.data.map((scenario: Scenario) => {
          scenario.selected = false;
          this.rows.push(scenario);
        });
      });
  }

  @computed get selected(): {}[] {
    return this.rows.filter((row: Scenario) => row.selected);
  }

  @action toggleSelectAll(checked: boolean): void {
    this.rows.map((row: Scenario) => {
      row.selected = checked;
    });
  }

  @action create(scenario: any) {
    this.rows.push(scenario);
    return true;
  }

  @action update(scenario: Scenario) {
    this.rows.forEach((row: Scenario) => {
      if (row.hash === scenario.hash) {
        extendObservable(row, toJS(scenario));
        return;
      }
    });
    return true;
    
  }

  @action delete(scenario: any) {
    this.rows.remove(scenario);
    return true;
  }
}