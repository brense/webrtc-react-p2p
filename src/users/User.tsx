import { observable } from 'mobx';

export default class User {
    @observable selected = false;
    @observable name:string;
    @observable username:string;
    @observable email:string;
    @observable admin:boolean;  
    @observable profile_image:string;
}