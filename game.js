"use strict";
const fs = require('fs');
const fsPromises = require('fs').promises;
class Card {
    position = 0;
}
class Special extends Card {
    _name = "";
    _group = "";
    _id = "";
    _event_type = 'aa';
    func = () => { console.log(this.event_type) }
    constructor(obj) {
        this._name = obj['name'];
        this._group = obj['group']
        this._id = obj['id']
    }
}
class Property extends Card {
    _name = " ";
    _id = "";
    _posistion = 0;
    _price = 0;
    _rent = 2;
    _multpliedrent = [
        10,
        30,
        90,
        160,
        250
    ];
    _house_count=0;
  
    _group = "";
    _owned_by  = -1;
    _mortgaged = false;
    _probability = 2.1314;

    get name() { return this._name; }
    get id() { return this._id }
    get position() { return this._posistion; }
    get price() { return this._price; }
    get base_rent() { return this._rent; }
    get group() { return this._group; }
    get house_count() { return this._house_count || 0; }
    set house_count(cnt) { this._house_count = cnt }
    get owned_by() { return this._owned_by }
    set owned_by(owner) { this._owned_by = owner }
    get mortgage_value() { return this._price / 2 }


    constructor(obj) {
        super();
        this._name = obj.name;
        this._id = obj.id;
        this._position = obj.position;
        this._price = obj.price;
        this._rent = obj.rent;
        if (obj.hasOwnProperty('multipliedrent'))
            this._multipliedrent = [...obj.multpliedrent];
        else
            this._multipliedrent = null;
        this._group = obj.group;
        this._probability = obj.probability;
    }


    add_house() {
        if (this._house_count >= 5) return false;
        this._house_count++;
        return true;
    }

    current_rent(owned_in_group, last_dice_roll = 0) {
        if (this.mortgaged) return 0;
        if (this.house_count > 0 && this._multipliedrent != null) return this._multipliedrent[housecount - 1];
        if (this.group == 'Railroad') {
            if (owned_in_group == 1) return 25;
            if (owned_in_group == 2) return 50;
            if (owned_in_group == 3) return 100;
            if (owned_in_group == 4) return 200;
        }
        if (this.group == 'Utilities') {
            if (owned_in_group == 1) return last_dice_roll * 4;
            if (owned_in_group == 2) return last_dice_roll * 10;
        }

        if ((this.group == "Purple" || this.group == "darkblue") && owned_in_group == 2) return this._rent * 2;
        if (owned_in_group == 3) return this._rent * 3;
        else return this._rent;
    }
}


class Game {
    turn=0;
    player_list = [];
    player_positions = [];
    board = [];
    constructor() {
    }
    async initialize() {
        try {

            let data = await fs.promises.readFile('monopoly.json');
            let parsed_data = JSON.parse(data);
            this.board = parsed_data['tiles'].map(tile => {
                let property=parsed_data['properties'].find(t=>t.id == tile.id);
                if (property['group'] == 'special') return new Event(property)
                return new Property(property);
            })

            if (data) return true;
            return false;
        }
        catch (e) {
            console.log(e);
        }

    }
    nextTurn() {
        this.turn++;
    }
    setPlayers(player1, player2, player3, player4) {
        this.player_list = [player1, player2, player3, player4];
        this.player_positions = [0,0,0,0];
        //randomize players;
        //this.randomizePlayers();
    }
    getPropertyIdx(property_id) {
        let property_idx = this.board.findIndex(t=>t.id==property_id)
        
        return property_idx;
    }
    getProperty(property_id) {
        let property_idx = this.getPropertyIdx(property_id)
        let p= this.board[property_idx];
        return p;
    }
    assignOwnership(owner_id, property_id) {
        let property_idx=this.getPropertyIdx(property_id)
        this.board[property_idx].owned_by=owner_id;
    }
    randomizePlayers() {
        this.player_list = this.player_list.sort(() => (Math.random() > 0.5) ? 1 : -1);
    }
    getCurrentPlayer(){
        let pos = this.turn % this.player_list.length;
        return this.player_list[pos];
    }
    getIdsByGroup(groupName) {
        let groupList =this.board.filter(p=>p.group==groupName).map(p=>p.id);
        return groupList;
    }
    //Full group ownership doubles rent.  Also decides if we can build houses on property.
        checkGroupOwnership(group_name) {
                let owner_list= this.getIdsByGroup(group_name).map(property_id =>{
                    let p=this.getProperty(property_id);
                    return p.owned_by
                })
                if (owner_list.length==0) return false;

                return !!owner_list.reduce((a, b)=>((a === b) ? a : NaN));
            }
    getRent(property_id,roll) {
                let property = this.getProperty(property_id)
                
                let owner=property.owned_by;
                if (owner == -1 || owner == null) return 0;
                let owner_cnt = this.countGroupOwnership(owner,property.group);
                return property.current_rent(owner_cnt,roll)
             }
    //Used to calculate rent for Utilities and Railroads
    countGroupOwnership(player_id, group_name) {
        return this.getIdsByGroup(group_name).reduce((cnt, property_id) => {
            
            let property = this.getProperty(property_id);
            return property.owned_by==player_id ? cnt+1:cnt;
        },0)
    }
    getPlayerPosition(player_id) {
        let player_idx =this.player_list.findIndex(p=>p==player_id);
        return this.player_positions[player_idx];
    }
    setPlayerPosition(player_id,pos) {
        let player_idx =this.player_list.findIndex(p=>p==player_id);
        this.player_positions[player_idx] = pos;
    }
    moveBy(player_id,cnt) {
        let player_idx =this.player_list.findIndex(p=>p==player_id);
        let pos = this.player_positions[player_idx];
        pos=(pos+cnt) % 40;
        this.player_positions[player_idx]=pos
        return pos;
    }
    addHouse(property_id){
        let p= this.getProperty(property_id);
        if (!this.checkGroupOwnership(p.group)) return false
        let house_counts = this.getIdsByGroup(p.group).map(pid =>{
            p=this.getProperty(pid)
            return p.house_count
        })
        console.log(house_counts)
        let min_count = Math.min(...house_counts);
        let max_count = Math.max(...house_counts);
        console.log(min_count,max_count,p.house_count)
        if(p.house_count > min_count) return false;
        if (p.house_count >=5) return false;
        return p.add_house();
    }

    #TODO 
    //Roll 1 or 2 die
    rollDie(die_count){
        //die_count 1 or 2
        let result = Math.floor(Math.random()*6)+1;
        if (die_count == 2){
            result+= Math.floor(Math.random()*6)+1;
        }
        return result;
    }
    rollPlayerDie(player_id,die_count) {
        let move_count = this.rollDie(die_count);
        let property_id=this.moveBy(player_id, move_count)
        return property_id;
    }
}
module.exports = Game