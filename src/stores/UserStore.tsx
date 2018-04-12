import { observable, action, computed, extendObservable, toJS } from 'mobx';
import User from '../models/User';
import iDataStore from './iDataStore';
import axios from 'axios';

export default class UserStore implements iDataStore {

    @observable isLoading: boolean = false;
    readonly registry = observable<User>([]);

    @computed get users(): User[] {
        return this.registry;
    }

    @computed get selected(): {}[] {
        return this.registry.filter((row: User) => row.selected);
    }

    @computed get numSelected(): number {
        return this.registry.filter((row: User) => row.selected).length;
    }

    getUser(username: string): User | undefined {
        let user: User | undefined;
        this.registry.forEach((row: User) => {
            if (row.username === username) {
                user = row;
                return;
            }
        });
        return user;
    }

    @action loadUsers() {
        this.isLoading = true;
        axios.get('api/user')
            .then(res => {
                this.registry.clear();
                res.data.map((user: User) => {
                    user.selected = false;
                    this.registry.push(user);
                });
                this.isLoading = false;
            });
    }

    @action toggleSelectAll(checked: boolean): void {
        this.registry.map((row: User) => {
            row.selected = checked;
        });
    }

    @action create(user: any) {
        this.registry.push(user);
        // TODO: save to server
        return true;
    }

    @action update(user: User) {
        this.registry.forEach((row: User) => {
            if (row.username === user.username) {
                extendObservable(row, toJS(user));
                return;
            }
        });
        // TODO: save to server if something changed
        return true;
    }

    @action delete(user: any) {
        this.registry.remove(user);
        // TODO: save to server
        return true;
    }
}