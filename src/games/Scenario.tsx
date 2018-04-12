import { observable } from 'mobx';

export default class Scenario {
    @observable selected = false;
    @observable title:string;
    @observable hash:string;
    @observable game:string;
    @observable description:string;
}