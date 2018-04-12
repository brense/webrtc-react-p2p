import { observable } from 'mobx';

export default class Game {
    @observable hash:string = '';
    @observable selected = false;
    @observable title:string = '';
    @observable description:string = '';
    @observable explanationSteps:{}[] = [];
}