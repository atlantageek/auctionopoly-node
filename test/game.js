"use strict"
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
      expect(property.owned_by).to.equal(2);
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
      expect(game.checkGroupOwnership('darkblue')).to.equal(false)
      game.assignOwnership(3,'parkplace');
      expect(game.checkGroupOwnership('darkblue')).to.equal(true)
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
  context('Test rent',() => {
    it('Try Group rent', async()=> {
      let game = new Game();
      await game.initialize();
      game.setPlayers(7,9,11,13)
      game.assignOwnership(7,'boardwalk');
      let cnt = game.countGroupOwnership(7,'darkblue');
      expect(cnt).to.equal(1);
      let rent=game.getRent('boardwalk',3);
      expect(rent).to.equal(50);
      game.assignOwnership(9,'parkplace');
      rent=game.getRent('parkplace',3);
      expect(rent).to.equal(35);
      game.assignOwnership(7,'parkplace');
      expect(game.countGroupOwnership(7,'darkblue')).to.equal(2)
      rent=game.getRent('parkplace',3);
      
      expect(rent).to.equal(70);
      game.assignOwnership(1,'parkplace');

      //Railroads
      game.assignOwnership(7,'readingrailroad');
      game.assignOwnership(7,'pennsylvaniarailroad');
      game.assignOwnership(7,'shortlinerailroad');
      rent=game.getRent('shortlinerailroad',3);
      expect(rent).to.equal(100);

      //Utilities
      rent=game.getRent('electriccompany',3);
      expect(rent).to.equal(0);
      game.assignOwnership(7,'electriccompany');
      rent=game.getRent('electriccompany',3);
      expect(rent).to.equal(12);
      game.assignOwnership(7,'waterworks');
      rent=game.getRent('electriccompany',3);
      expect(rent).to.equal(30);
      
    })
  })
  context('Test Ownership of group',() => {
    it('Try Group test', async()=> {
    let game = new Game();
    await game.initialize();
    game.assignOwnership(7,'boardwalk');
    expect(game.checkGroupOwnership('darkblue')).to.equal(false);
    game.assignOwnership(9,'parkplace');
    expect(game.checkGroupOwnership('darkblue')).to.equal(false);
    game.assignOwnership(9,'boardwalk');
    expect(game.checkGroupOwnership('darkblue')).to.equal(true);
    });
  })
  context('Test adding houses',() => {
    it('Try Group test', async()=> {
    let game = new Game();
    await game.initialize();
    game.assignOwnership(9,'parkplace');
    let result = game.addHouse('parkplace');
    expect(result).to.equal(false);
    game.assignOwnership(9,'boardwalk');
    result = game.addHouse('parkplace');
    expect(result).to.equal(true);
    result = game.addHouse('parkplace');
    expect(result).to.equal(false);
    result = game.addHouse('parkplace');
    expect(result).to.equal(false);
    result = game.addHouse('boardwalk');
    expect(result).to.equal(false);
    });
  })
})