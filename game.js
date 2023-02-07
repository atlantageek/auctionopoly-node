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
    _housecost = 0;
    _group = "";
    _ownedby = -1;
    _mortgaged = false;
    _probability = 2.1314;

    get name() { return this._name; }
    get id() { return this._id }
    get position() { return this._posistion; }
    get price() { return this._price; }
    get base_rent() { return this._rent; }
    get group() { return this._group; }
    get housecount() { return this._house_count; }
    set housecount(cnt) { this._house_count = cnt }
    get owned_by() { return this._ownedby }
    set owned_by(owner) { this.ownedby = owner }
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


    addhouse() {
        if (this._house_count > 5) return false;
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

        if ((group == "Purple" || group == "darkblue") && owned_in_group == 2) return this._rent * 2;
        if (owned_in_group == 3) return this._rent * 3;
        else return this._rent;
    }
}


class Game {
    const
    player_list = [];
    player_position = [];
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
    setPlayers(player1, player2, player3, player4) {
        let plist = [player1, player2, player3, player4];
        //randomize players;
        this.player_list = plist.sort(() => (Math.random() > 0.5) ? 1 : -1);
    }
}
module.exports = Game