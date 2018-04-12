import DataStore from '../data-views/DataStore';
import { observable, action, computed, extendObservable, toJS } from 'mobx';
import User from './User';
import axios from 'axios';

export default class UsersDataStore implements DataStore {
  readonly rows = observable<User>([])
  index = 'username';

  constructor() {
    axios.get('api/user')
      .then(res => {
        res.data.map((user: User) => {
          user.selected = false;
          this.rows.push(user);
        });
      });
  }

  @computed get selected(): {}[] {
    return this.rows.filter((row: User) => row.selected);
  }

  @action toggleSelectAll(checked: boolean): void {
    this.rows.map((row: User) => {
      row.selected = checked;
    });
  }

  @action create(user: any) {
    this.rows.push(user);
    return true;
  }

  @action update(user: User) {
    this.rows.forEach((row: User) => {
      if (row.username === user.username) {
        extendObservable(row, toJS(user));
        return;
      }
    });
    return true;
  }

  @action delete(user: User) {
    this.rows.remove(user);
    return true;
  }
}