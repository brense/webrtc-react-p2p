import { IObservableArray } from 'mobx';

export default interface DataStore {
    rows: IObservableArray<any>;
    index: string;
    toggleSelectAll: (checked: boolean) => void;
    selected: {}[];
    create: (row: any, callback?: any) => boolean;
    update: (row: any, callback?: any) => boolean;
    delete: (row: any, callback?: any) => boolean;
}