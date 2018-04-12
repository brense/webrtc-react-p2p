import { IObservableArray } from 'mobx';

export default interface iDataStore {
    registry: IObservableArray<any>;
    toggleSelectAll: (checked: boolean) => void;
    selected: {}[];
    numSelected: number;
    create: (row: any, callback?: any) => boolean;
    update: (row: any, callback?: any) => boolean;
    delete: (row: any, callback?: any) => boolean;
}