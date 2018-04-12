import DataStore from '../data-views/DataStore';

let stores = {};

const StoreManager = {
    exists(storeName: string): boolean {
        if (typeof stores[storeName] === 'undefined') {
            return false;
        }
        return true;
    },
    get(storeName: string): DataStore {
        if (typeof stores[storeName] === 'undefined') {
            // TODO: throw exception...
        }
        return stores[storeName];
    },
    set(storeName: string, store: DataStore): void {
        stores[storeName] = store;
    }
};

export default StoreManager;