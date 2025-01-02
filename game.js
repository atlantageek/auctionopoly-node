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
    _house_count = 0;

    _group = "";
    _owned_by = null;
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
    get ownable() {return this.group!='Special'}


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
    get price() {
        return this._price /2;
    }

    add_house() {
        if (this._house_count >= 5) return false;
        this._house_count++;
        return true;
    }
    remove_house() {
        if (this._house_count <= 0) return false;
        this._house_count--;
        return true;
    }
    current_rent(owned_in_group, last_dice_roll = 0) {
        if (this.is_mortgaged()) return 0;
   
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
    mortgaged(val) {
        this._mortgaged=val;
    }
    is_mortgaged() {
        return this._mortgaged;
    }
}


class Game {
    turn = 0;
    player_names=[];
    player_list = [];//Key Fields for players.
    player_positions = [];
    player_wallets = [];
    player_in_jail = [];
    player_states=[];//NOTREADY,WAITING,ROLLREADY,DOSOMETHING
    auction_timeout=null;
    _property_id_under_auction=null;
    winning_bid=null;
    winning_player=null;
    end_auction_callback=null;
    
    board = [];
    reward = [];
    risk = [];
    game_running=false;
    current_player=null;
    get open() {
        if (this.player_names.length >4) return false;
        return true;
    }
    get game_started() {
        //if (this.open)return false;
        return game_running;
    }
    get winning_bid() {
        return this.winning_bid;
    }
    get winning_player() {
        return this.winning_player
    }
    constructor() {
    }
    toJSON() {
        return {
            player_names:this.player_names,
            player_list:this.player_list,
            player_positions:this.player_positions,
            player_wallets:this.player_wallets,
            player_in_jail:this.player_in_jail,
            player_states:this.player_states,
            winning_bid:this._winning_bid,
            winning_player:this._winning_player,
            board:this.board,
            reward:this.reward,
            risk:this.risk,
            game_running:this.game_running,
            current_player:this.current_player,
            next_bid:this.next_bid
        }
    }
    async initialize() {
        try {

            let data = await fs.promises.readFile('monopoly.json');
            let parsed_data = JSON.parse(data);
            this.board = parsed_data['tiles'].map(tile => {
                let property = parsed_data['properties'].find(t => t.id == tile.id);
                if (property['group'] == 'special') return new Event(property)
                return new Property(property);
            })
            this.risk = parsed_data['risk'];
            this.reward = parsed_data['reward']
            if (data) return this;
            return false;
        }
        catch (e) {
            console.log(e);
        }
    }
    //STARTS at NOTREADY. Then it goes to WAITING which becomes the default state.
    //NOTREADY -- PLAYER has not his the ready button to say they want to start the game
    //WAITING-- Player Waiting for either waiting for everyone to start the game or waiting for their turn 
    //ROLLREADY - Player's turn and they have not rolled yet.
    //DOSOMETHING- Player has rolled but now they can do property maintenance.  When they are done they say they are DONE. player gets set to WAITING
    set_player_state(player,state) {//NOTREADY,WAITING,ROLLREADY,DOSOMETHING
        console.log('Setting: Player: ' + player + ' State:' + state)
        if (!['NOTREADY','WAITING','ROLLREADY','DOSOMETHING','AUCTION'].includes(state)) {
            console.log("Should fail here.")
            return false;
        }
        var idx=this.player_list.findIndex(p=>p==player);
        if (idx == -1) return false;
        for(var i=0;i<this.player_list.length;i++) {
            if (idx==i) {
                this.player_states[i]=state;
            }
            else {
                if (this.player_states[i]!='NOTREADY') this.player_states[i]='WAITING'
            }
        }
        return true
    }
    get_player_state(player) {
        var idx=this.player_list.findIndex(p=>p==player);
        return this.player_states[idx];
    }
    all_players_state(state) {
        for(var i=0;i<this.player_list.length;i++) {
            if (state != this.player_states[i]) {
                return false
            }
        }
        return true;
    }
    set_all_players_state(state) {
        for(var i=0;i<this.player_list.length;i++) {
            this.set_player_state(this.player_list[i],state)
            
        }
        return true;
    }
    auction_active() {
        if (this._property_id_under_auction != null) return true;
        else return false;
    }
    start_auction(property_id) {
        
        let property = this.get_property(property_id)
        if (!property.ownable) return false;
        if (property.owned_by != null) return false;
        this._property_id_under_auction = property_id; //this.get_property(property_id);
        this.winning_bid = property._price/2
        this.next_bid=this.winning_bid+10;
        console.log('PROPERTY bid' + this.winning_bid)
        console.log('PROPERTY being auction' + JSON.stringify(this._property_id_under_auction))
        this.auction_timeout=setTimeout(()=>{
            console.log("Calling End Auction callback.")
            this.end_auction_callback()
        }, 6000)
        return true;

    }
    bid_auction(bid,player) {
        if (this._property_id_under_auction == null) {return false;}
        if (this._property_id_under_auction.owned_by != null) {return false;}
        if (this.winning_player == player) return false;
        if (bid <= this.winning_bid) {return false;}
        this.winning_player=player;
        this.winning_bid=bid;
        this.next_bid=this.winning_bid+10;
        this.auction_timeout.refresh();console.log("Refresh timeout")
        return true
    }
    close_auction() {
        if (this._property_id_under_auction == null || this._property_id_under_auction == undefined) return false;
        var property = this.get_property(this._property_id_under_auction);
        this._property_id_under_auction=null;
        
        property.owned_by=this.winning_player;
        this.charge_player(this.winning_player,this.winning_bid);
        this._property_id_under_auction=null;
        this.winning_bid=null;
        this.winning_player=null;
        this.next_bid=0
        this.set_player_state(this.get_current_player(),'DOSOMETHING')
        return true;
        
    }
    start_game() {
        if (!this.game_running) {
            this.game_running=true;
            this.current_player = this.player_list[0];
            return true;
        }
        return false;
    }
    get_property_by_position(pos) {

    }
    next_turn() {
        this.turn++;
        let player_idx = this.turn % this.player_list.length;
        this.current_player = this.player_list[player_idx];
    }
    get_current_player() {
        console.log("TURN: " + this.turn)
        let player_idx = this.turn % this.player_list.length;
        return player_list[player_idx];
    }
    add_player(player,name) {
        if (this.open){
            var idx=this.player_list.findIndex(p=>p==player);
            if (idx != -1) return false;
            this.player_list.push(player);
            this.player_positions.push(0);
            this.player_wallets.push(1500);
            this.player_in_jail.push(false);
            this.player_names.push(name);
            this.player_states.push('NOTREADY')
            return true;
        }
    }
    set_players(player1, player2, player3, player4) {
        this.player_list = [player1, player2, player3, player4];
        this.player_positions = [0, 0, 0, 0];
        this.player_wallets = [1500, 1500, 1500, 1500];
        this.player_in_jail = [false, false, false, false]
        this.player_names=['Bob1','Eve2','William3','Jenny4']
        this.player_states=['NOTREADY','NOTREADY','NOTREADY','NOTREADY']
        //randomize players;
        //this.randomize_players();
    }
    get_player_idx(player_id) {
        return this.player_list.findIndex(p => p == player_id);
    }
    get_tile_idx(property_id) {
        let property_idx = this.board.findIndex(t => t.id == property_id)

        return property_idx;
    }
    get_property(property_id) {
        let property_idx = this.get_tile_idx(property_id)
        let p = this.board[property_idx];
        return p;
    }
    assign_ownership(owner_id, property_id) {
        let property_idx = this.get_tile_idx(property_id)
        this.board[property_idx].owned_by = owner_id;
    }
    randomize_players() {
        this.player_list = this.player_list.sort(() => (Math.random() > 0.5) ? 1 : -1);
    }
    get_current_player() {
        let pos = this.turn % this.player_list.length;
        return this.player_list[pos];
    }
    get_ids_by_group(groupName) {
        let groupList = this.board.filter(p => p.group == groupName).map(p => p.id);
        return groupList;
    }
    //Full group ownership doubles rent.  Also decides if we can build houses on property.
    check_group_ownership(group_name) {
        let owner_list = this.get_ids_by_group(group_name).map(property_id => {
            let p = this.get_property(property_id);
            return p.owned_by
        })
        if (owner_list.length == 0) return false;

        return !!owner_list.reduce((a, b) => ((a === b) ? a : NaN));
    }
    get_rent(property_id, roll) {
        let property = this.get_property(property_id)

        let owner = property.owned_by;

        if (owner == -1 || owner == null) return 0;
        let owner_cnt = this.count_group_ownership(owner, property.group);
        return property.current_rent(owner_cnt, roll)
    }
    pay_owner(property_id,amount) {
        let property = this.get_property(property_id)
        let owner=property.owned_by;
        this.pay_player(owner,amount);
    }
    //Used to calculate rent for Utilities and Railroads
    count_group_ownership(player_id, group_name) {
        return this.get_ids_by_group(group_name).reduce((cnt, property_id) => {

            let property = this.get_property(property_id);
            return property.owned_by == player_id ? cnt + 1 : cnt;
        }, 0)
    }
    get_player_position(player_id) {
        let player_idx = this.get_player_idx(player_id);
        if (player_idx == -1) return null;
        return this.player_positions[player_idx];
    }
    set_player_position(player_id, pos) {
        let player_idx = this.player_list.findIndex(p => p == player_id);
        this.player_positions[player_idx] = pos;
    }
    move_by(player_id, cnt) {
        let player_idx = this.player_list.findIndex(p => p == player_id);
        let pos = this.player_positions[player_idx];
        pos = (pos + cnt) % 40;
        this.player_positions[player_idx] = pos
        return pos;
    }
    add_house(property_id) {
        let target_p = this.get_property(property_id);
        if (!this.check_group_ownership(target_p.group)) return false
        let house_counts = this.get_ids_by_group(target_p.group).map(pid => {
            let p = this.get_property(pid)
            return p.house_count
        })

        let min_count = Math.min(...house_counts);
        let max_count = Math.max(...house_counts);

        if (target_p.house_count > min_count) return false;
        if (target_p.house_count >= 5) return false;
        return target_p.add_house();
    }
    remove_house(property_id) {
        let target_p = this.get_property(property_id);
        if (!this.check_group_ownership(target_p.group)) return false
        let house_counts = this.get_ids_by_group(target_p.group).map(pid => {
            let p = this.get_property(pid)
            return p.house_count
        })
        let min_count = Math.min(...house_counts);
        let max_count = Math.max(...house_counts);
        if (target_p.house_count < max_count) return false;
        if (target_p.house_count <= 0) return false;
        return target_p.remove_house();
    }
    #TODO
    //Roll 1 or 2 die
    roll_die(die_count) {
        //die_count 1 or 2
        let result = Math.floor(Math.random() * 6) + 1;
        if (die_count == 2) {
            result += Math.floor(Math.random() * 6) + 1;
        }
        return result;
    }
    roll_player_die(player_id, die_count) {
        console.log("ROll Player Die");
        let move_count = this.roll_die(die_count);
        //let property_id = this.move_by(player_id, move_count)
        let property_id = this.do_move(player_id, move_count);
        return property_id;
    }
    get_wallet(player_id) {
        let player_idx = this.get_player_idx(player_id);
        return this.player_wallets[player_idx]
    }
    charge_player(player_id,amount) {
        let player_idx = this.get_player_idx(player_id);
        return this.player_wallets[player_idx]-=amount;
    }
    pay_player(player_id,amount) {
        let player_idx = this.get_player_idx(player_id);
        return this.player_wallets[player_idx]+=amount;
    }

    in_jail(player_id) {
        let player_idx = this.get_player_idx(player_id);
        return this.player_in_jail[player_idx]
    }
    send_player_to_jail(player_id) {
        let player_idx = this.get_player_idx(player_id);
        this.set_player_position(player_id, 10);
        this.player_in_jail[player_idx] = true;
    }
    release_from_jail(player_id) {
        let player_idx = this.get_player_idx(player_id);
        this.player_in_jail[player_idx] = false;
    }
    activate_move_card(player_id, tile_id) {
        let tile_idx = this.get_tile_idx(tile_id);
        let player_pos = this.get_player_position(player_id);
        let player_idx = this.get_player_idx(player_id)
        if (player_pos >= tile_idx) {
            this.player_wallets[player_idx] += 200;
        }
        this.set_player_position(player_id, tile_idx);
        return 0;
    }
    activate_move_nearest_card(player_id, group_name) {
        let player_pos = this.get_player_position(player_id);
        let tile_positions = this.get_ids_by_group(group_name).map(property_id => {
            return +(this.get_tile_idx(property_id));
        }).sort((a, b) => a - b);
        let target_pos = tile_positions.find(pos => +player_pos < +pos);
        if (target_pos == undefined) {
            target_pos = tile_positions[0];
            //Looks like they will pass go.
        }
        this.set_player_position(player_id, target_pos);
        return 0;
    }
    activate_jail_card(player_id) {
        this.send_player_to_jail(player_id);
    }
    activatePropertyCharges(player_id) {
        let property_list = this.board.filter(property => property.owned_by == player_id)
        let property_tax = this.board.reduce((sofar, p) => {
            let result = 0;
            if (p.house_count < 5) { result = sofar + p.house_count * 25; }
            else { result = sofar + 100; }
            return result;
        }, 0)
        return property_tax;
    }
    //activateAddFunds(player_id, )
    activate_card(player_id, card_id) {
        //actions
        //"move"
        //"movenearest"
        "addfunds"
        //"jail"
        "propertycharges"
        "removefunds"
        "removefundstoplayers"
        "addfundsfromplayers"
    }
    //This does everything. 
    //*rolls dice, move player, accounting, trigger random cards.
    do_move(player_id, move_count) {
        //let property_id = this.roll_player_die(player_id, die_count);
        let property_idx = this.move_by(player_id, move_count);
        let pos = this.get_player_position(player_id);
        let player_idx = this.get_player_idx(player_id);
        if (pos < move_count) {
            this.player_wallets[player_idx] += 200;
        }
        let property_id = this.board[pos].id;
        if (property_id == 'gotojail') {
            this.send_player_to_jail(player_id)
            return 10;
        }
        return pos;

        // if (property_id=='risk'){
        //     return;
        // }
        // else if (property_id=='reward') {
        //     return;
        // }
        // else 

    }
    //Ability to apply a card
    //Move to static function positions (go to jail etc.)
}
module.exports = Game