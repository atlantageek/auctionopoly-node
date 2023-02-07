class Card {
    position=0;
}
class Event extends Card {
    event_type='aa';
    func=()=> {console.log(this.event_type)}
}
class Property extends Card{
    group_id=0;
    house_available=false;
    rent_by_housecount=[0,0,0,0,0,0];
    rent_for_set=[0,0,0,0,0];
    property_price=0
    property_mortgage_value=0;
}
property_list=[
    {
        group_id:0,
    }
]

class Game {
    const
    player_list=[];
    player_position=[];
    board=[];
    constructor(player1,player2,player3,player4) {
        let plist=[player1,player2,player3,player4];
        this.player_list = plist.sort(()=>(Math.random() > 0.5) ? 1: -1);
    }
}