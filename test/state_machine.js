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
        var result = StateMachine.process_message(game,{msgType:'register'},'E');
        expect(result.msgType).to.equal('ERROR')
      })
      it('Initial Gameplay not yet started', async () => {  

        var result = StateMachine.process_message(game,{msgType:'register'},'E');
        expect(result.msgType).to.equal('REGISTER_ACCEPT')
        expect(game.player_list.length).to.equal(4)
      })
      it('Start Game', async () => {  

        var result = StateMachine.process_message(game,{msgType:'start_game'},'A');
        expect(result.msgType).to.equal('DOSOMETHING')
        result = StateMachine.process_message(game,{msgType:'done'},'A');
        expect(result.msgType).to.equal('DOSOMETHING')
        expect(result.player).to.equal('B')
      })
    })
});