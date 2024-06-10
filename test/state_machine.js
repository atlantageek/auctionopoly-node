"use strict"
var StateMachine = require('../state_machine.js');
var Game = require('../game.js');
var expect = require('chai').expect;

describe('#process_message()', function () {
    let game=null;
    beforeEach(async () => {
      game = new Game();
      await game.initialize();
      game.add_player("A","a")
      game.add_player("B","b")
      game.add_player("C","c")
     
    });
    context('default object', () => {
      it('Initial Gameplay not yet started', async () => {  
        game.add_player("D","d")
        game.add_player("E","e")
        var result = StateMachine.process_message(game,{msgType:'register'},'C');
        expect(result.msgType).to.equal('ERROR')
      })
      it('Initial Gameplay not yet started', async () => {  
        game.add_player("D","d")
        var result = StateMachine.process_message(game,{msgType:'register'},'D');
        expect(result.msgType).to.equal('REGISTER_ACCEPT')
        expect(game.player_list.length).to.equal(4)
      })
      it('Start Game', async () => {  

        var result = StateMachine.process_player_move(game,'A', {die1:3,die2:1,val:4,doubles:false});
        expect(result.msgType).to.equal('DOSOMETHING')
        //expect(result.player).to.equal('B')
        result = StateMachine.process_player_move(game,'A',{die1:3,die2:2,val:5,doubles:false});
        expect(result.msgType).to.equal('AUCTION')
        expect(result.property).to.equal('connecticutave')
        expect(result.next_bid).to.equal(60)
      })
      
      // it('Available Property when Processling player', async () => {  
      //   var result = StateMachine.process_player(game,'A',{die1:4,die2:1,val:5,doubles:false})
      //   expect(result.msgType).to.equal('AUCTION');
      //   expect(result.minimum_bid.to.equal(100))
        
      // })
    })
});