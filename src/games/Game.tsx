import { observable } from 'mobx';

export default class Game {
    @observable selected = false;
    @observable title:string;
    @observable hash:string;
    @observable description:string;
    @observable explanationSteps:{}[];
}