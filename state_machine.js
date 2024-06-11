//Game State Machine
//Users Join Game
//Are there 4 players?
//If yet enable start button
//Time start for all 4 players.
//Start game.  Lock new players from joining
//while (>1 player have positive network)
//*pick next player
//*Player In jail?{
//* No Pay 50? {
//*    try double roll if roll double then do move
//* }
//* Pay 50 {
//*   charge 50
//*   Play Normal turn
//*}
//* NORMAL TURN:
//** Do Roll
//*  Move
//* If project not owned then a {
//*  Auction mode Start auction at mortgage price
//*  (Wait for bid or 6 seconds) {
//*     if six seconds and no bid leave property unowned
//*     If bid then offer new amount
//*     If six seconds then give property to winner and deduct funds
//* }

const { reset } = require("nodemon");

//*}
auction_interval=null;
auction_countdown=0;
function rollDice() {
    let die1 = Math.floor(Math.random()*6)+1;
    let die2 = Math.floor(Math.random()*6)+1; 
    return {die1:die1,die2:die2,val:die1+die2,doubles:(die1==die2)}
}
function process_player_move(game,player,roll=rollDice()) {
    let player_idx=game.get_player_idx(player);
    console.log("PLAYER IDX: " + player_idx)
    console.log(roll);
    //Need to check the roll for doubles and handle accordingly
    let move=roll.val;
    let pos = game.move_by(player,move);
    console.log("Position " + pos);
    let property = game.board[pos];
    console.log(property.ownable)
    console.log(property.id);
    console.log(property.owned_by)
    console.log("----------------------------------------------------")
    if (property.ownable && (property.owned_by == -1 || property.owned_by == null)) {
        //Should we set a auction flag?
        
        console.log("This property should be going up for auction.")
        //Set all players to BIDDING
        game.start_auction(property.id);
        var response = {msgType:'AUCTION',gamestate:game, player:player,roll:roll,current_bid:0,next_bid:property.mortgage_value, property:property.id, winning_player:null}
        
        resetInterval(game);
        return response;

    }
    var response={msgType:'DOSOMETHING',gamestate:game,player:player,roll:roll}
    return response;
}

const process_message=(game,msgObj,player)=>{
    console.log("PROCESSIONG:" + msgObj.msgType)
    //let current_player = game.get_current_player()
    switch(msgObj.msgType){
        case 'register':
            console.log('REGISTER: ' + player);
            if (!game.open){
                
                return {msgType:'ERROR',errMsg:'Game is closed', kickout:true}
            }
        
            game.add_player(player,player);
            response={msgType:'REGISTER_ACCEPT',gamestate:game,player:player}
            break;
        case 'start_game':
            console.log("try start game")
            game.set_player_state(player,'WAITING')
    
            if (game.all_players_state('WAITING')) {//
                if (game.start_game()) {
                    let current_player=game.get_current_player();
                    game.set_player_state(current_player,'ROLLREADY')
                    response={msgType:'ROLLREADY',player:current_player,gamestate:game}
    
                }
                else {
                    response= {msgType:'WAITING',gamestate:game}
                }
            }
            else {
                response = {msgType:'WAITING',gamestate:game}
            }
            break;
        case 'roll':
            
            response=process_player_move(game,player);
            game.set_player_state(player,response.msgType)//If a double then ROLLREADY again otherwise DOSOMETHING
            break;

        case 'bid':
            if (!game.auction_active()) throw new Error('No bidding on inactive auction.')
            var bid = game.next_bid;
            game.bid_auction(bid,msgObj.bidder)
            var response = {msgType:'AUCTION',gamestate:game, player:player}
            //NO RESPONSE being sent here... very annoying
            
            //let bidder =msgObj.bidder;
            resetInterval(game);
            break;

        case 'done':
            game.next_turn();
            let next_player=game.get_current_player()
            console.log('CURRENT PLAYER' + player);
            game.set_player_state(next_player,'ROLLREADY')
            response = {msgType:'UPDATE',gamestate:game}
            break;

        
    }
    console.log("IS this an auction:" + response.msgType)
    return response;
}

function resetInterval(game) {
    if (auction_interval!=null)clearInterval(auction_interval)
    auction_countdown=6;
    auction_interval=setInterval(()=>{
        if (auction_countdown <=0){
            if (auction_interval!=null)clearInterval(auction_interval)
            auction_interval=null;
            game.close_auction();
            game.set_player_state(player,'DOSIMETHING')
        }
        else {
            auction_countdown -=1;
            console.log(auction_countdown);
        }
    },1000);
}
exports.process_message=process_message;
exports.process_player_move=process_player_move;