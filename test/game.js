var Game = require('../game.js');
var expect = require('chai').expect;

describe('#game()', function() {

  context('default object', ()=> {
    it('should return 40', async()=> {
      let game = new Game();
      await game.initialize();

      expect(game.board.length).to.equal(40)
    })
  })
})