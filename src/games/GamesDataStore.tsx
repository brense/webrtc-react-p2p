import DataStore from '../data-views/DataStore';
import { observable, action, computed, extendObservable, toJS } from 'mobx';
import Game from './Game';
import axios from 'axios';

export default class GamesDataStore implements DataStore {
  readonly rows = observable<Game>([])
  index = 'hash';

  constructor() {
    axios.get('api/game')
      .then(res => {
        res.data.map((game: Game) => {
          game.selected = false;
          this.rows.push(game);
        });
      });
  }

  @computed get selected(): {}[] {
    return this.rows.filter((row: Game) => row.selected);
  }

  @action toggleSelectAll(checked: boolean): void {
    this.rows.map((row: Game) => {
      row.selected = checked;
    });
  }

  @action create(game: any) {
    this.rows.push(game);
    return true;
  }

  @action update(game: Game) {
    this.rows.forEach((row: Game) => {
      if (row.hash === game.hash) {
        extendObservable(row, toJS(game));
        return;
      }
    });
    return true;
    
  }

  @action delete(game: any) {
    this.rows.remove(game);
    return true;
  }
}