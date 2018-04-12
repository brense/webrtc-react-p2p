import { observable } from 'mobx';

export default class Scenario {
    @observable hash:string = '';
    @observable selected = false;
    @observable title:string = '';
    @observable game:string = '';
    @observable description:string = '';
}