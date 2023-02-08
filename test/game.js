var Game = require('../game.js');
var expect = require('chai').expect;

describe('#game()', function() {

  context('default object', ()=> {
    it('should return 40', async()=> {
      let game = new Game();
      await game.initialize();

      expect(game.board.length).to.equal(40)
      expect(game.board[39].id).to.equal('boardwalk')
    })
  })
  context('add players', ()=> {
    it('should return 4 players', async()=> {
      let game = new Game();
      await game.initialize();
      game.setPlayers(1,2,3,4);
      expect(game.player_list.length).to.equal(4)
      for (let i=0;i<17;i++) game.nextTurn();
      expect(game.getCurrentPlayer()).to.equal(2)
    })
  })
  context('assign ownership', ()=> {
    it('should return 4 players', async()=> {
      let game = new Game();
      await game.initialize();
      game.setPlayers(1,2,3,4);
      game.assignOwnership(2,'boardwalk');
      let property = game.getProperty('boardwalk');
      expect(property.ownedBy).to.equal(2);
    })
  })
  context('get properties by group',() => {
    it('Try to get all railroads', async()=> {
      let game = new Game();
      await game.initialize();
      let idList = game.getIdsByGroup('Railroad');
      expect(idList.length).to.equal(4);
      expect(idList[0]).to.equal('readingrailroad');
      expect(idList[1]).to.equal('pennsylvaniarailroad');
      expect(idList[2]).to.equal('borailroad');
      expect(idList[3]).to.equal('shortlinerailroad');
    })
  })
  context('verifyOwnership',() => {
    //Will be used to test whether we can add a house to a property.
    it('Try ownership of darkblue group', async()=> {
      let game = new Game();
      await game.initialize();
      game.setPlayers(1,2,3,4)
      game.assignOwnership(3,'boardwalk');
      game.assignOwnership(1,'parkplace');
      expect(game.checkGroupOwnership(3,'darkblue')).to.equal(false)
      game.assignOwnership(3,'parkplace');
      expect(game.checkGroupOwnership(3,'darkblue')).to.equal(true)
    })
  })
  context('count properties  group ownership',() => {
    it('Test ownershipCount', async()=> {
      //Will be used in calculating rent on railroads and utilitiles
      let game = new Game();
      await game.initialize();
      game.setPlayers(1,2,3,4)
      game.assignOwnership(3,'readingrailroad');
      game.assignOwnership(1,'pennsylvaniarailroad');
      game.assignOwnership(3,'shortlinerailroad');
      expect(game.countGroupOwnership(3,'Railroad')).to.equal(2)
      game.assignOwnership(3,'boardwalk');
      game.assignOwnership(1,'parkplace');
      game.assignOwnership(3,'parkplace');
      expect(game.countGroupOwnership(1,'Railroad')).to.equal(1)
      game.assignOwnership(3,'readingrailroad');
      game.assignOwnership(3,'pennsylvaniarailroad');
      game.assignOwnership(3,'shortlinerailroad');
      expect(game.countGroupOwnership(3,'Railroad')).to.equal(3)
      expect(game.countGroupOwnership(1,'Railroad')).to.equal(0)
    })
  })
  context('Moving Player by increments',() => {
    it('Try to get all railroads', async()=> {
      let game = new Game();
      await game.initialize();
      game.setPlayers(7,9,11,13)
      expect(game.getPlayerPosition(9)).to.equal(0)
      game.setPlayerPosition(9,3)
      expect(game.getPlayerPosition(9)).to.equal(3)
      game.moveBy(9,12);
      game.moveBy(9,12);
      game.moveBy(9,12);
      game.moveBy(9,12);
      expect(game.getPlayerPosition(9)).to.equal(11)
    })
  })
})