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

//*}
function rollDice() {
    let die1 = Math.floor(Math.random()*6)+1;
    let die2 = Math.floor(Math.random()*6)+1; 
    return {die1:die1,die2:die2,val:die1+die2,doubles:(die1==die2)}
}
function process_player_move(game,player,roll=rollDice()) {
    let player_idx=game.get_player_idx(player);
    console.log("PLAYER IDX: " + player_idx)
    console.log(roll);
    //let roll=rollDice()
    let move=roll.val;
    let pos = game.move_by(player,move);
    console.log("Position " + pos);
    let property = game.board[pos];
    console.log(property.ownable)
    console.log(property.id);
    console.log(property.owned_by)
    console.log("----------------------------------------------------")
    if (property.ownable && property.owned_by == -1) {
        var response = {msgType:'AUCTION',gamestate:game, player:player,roll:roll,start_bid:property.mortgage_value, property:property.id}
        return response;

    }
    var response={msgType:'DOSOMETHING',gamestate:game,player:player,roll:roll}
    return response;
}

const process_message=(game,msgObj,email)=>{
    if (msgObj.msgType == 'register') {
        console.log('REGISTER: ' + email);
        if (!game.open){
            
            return {msgType:'ERROR',errMsg:'Game is closed', kickout:true}
        }
    
        game.add_player(email,email);
        response={msgType:'REGISTER_ACCEPT',gamestate:game,player:email}
    //player_sockets.push(ws);
        
    }
    else if (msgObj.msgType =='start_game') {
        console.log("try start game")
        if (game.start_game()) {
            let player=game.get_current_player();
            response =process_player_move(game,player);
        }
    }
    else if (msgObj.msgType=='done') { // Player hit the done button and it goes to the next player.
        game.next_turn();
        let player=game.get_current_player();
        response=process_player_move(game,player);
    }
    return response;
}
exports.process_message=process_message;
exports.process_player_move=process_player_move;