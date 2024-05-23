"use strict"
var Game = require('../game.js');
var expect = require('chai').expect;

describe('#game()', function () {
  let game=null;
  beforeEach(async () => {
    game = new Game();
    await game.initialize();
  });
  context('default object', () => {
    it('should return 40', async () => {


      expect(game.board.length).to.equal(40)
      expect(game.board[39].id).to.equal('boardwalk')
      expect(game.reward.length).to.equal(15)
      expect(game.risk.length).to.equal(14);
    })
  })
  context('add players', () => {
    it('should allow only unique players', async () => {
      expect(game.player_list.length).to.equal(0)
      var r=game.addPlayer('a','b');
      expect(r).to.equal(true);
      expect(game.player_list.length).to.equal(1)
      r=game.addPlayer('c','b');
      expect(r).to.equal(true);
      expect(game.player_list.length).to.equal(2)
      r=game.addPlayer('a','b');
      expect(r).to.equal(false);
      expect(game.player_list.length).to.equal(2)

    })
  })
  context('set players', () => {
    it('should return 4 players', async () => {

      game.setPlayers(1, 2, 3, 4);
      expect(game.player_list.length).to.equal(4)
      for (let i = 0; i < 17; i++) game.nextTurn();
      expect(game.getCurrentPlayer()).to.equal(2)
    })
  })
  context('assign ownership', () => {
    it('should return 4 players', async () => {

      game.setPlayers(1, 2, 3, 4);
      game.assignOwnership(2, 'boardwalk');
      let property = game.getProperty('boardwalk');
      expect(property.owned_by).to.equal(2);
    })
  })
  context('get properties by group', () => {
    it('Try to get all railroads', async () => {

      let idList = game.getIdsByGroup('Railroad');
      expect(idList.length).to.equal(4);
      expect(idList[0]).to.equal('readingrailroad');
      expect(idList[1]).to.equal('pennsylvaniarailroad');
      expect(idList[2]).to.equal('borailroad');
      expect(idList[3]).to.equal('shortlinerailroad');
    })
  })
  context('verifyOwnership', () => {
    //Will be used to test whether we can add a house to a property.
    it('Try ownership of darkblue group', async () => {
      game.setPlayers(1, 2, 3, 4)
      game.assignOwnership(3, 'boardwalk');
      game.assignOwnership(1, 'parkplace');
      expect(game.checkGroupOwnership('darkblue')).to.equal(false)
      game.assignOwnership(3, 'parkplace');
      expect(game.checkGroupOwnership('darkblue')).to.equal(true)
    })
  })
  context('count properties  group ownership', () => {
    it('Test ownershipCount', async () => {
      //Will be used in calculating rent on railroads and utilitiles
      game.setPlayers(1, 2, 3, 4)
      game.assignOwnership(3, 'readingrailroad');
      game.assignOwnership(1, 'pennsylvaniarailroad');
      game.assignOwnership(3, 'shortlinerailroad');
      expect(game.countGroupOwnership(3, 'Railroad')).to.equal(2)
      game.assignOwnership(3, 'boardwalk');
      game.assignOwnership(1, 'parkplace');
      game.assignOwnership(3, 'parkplace');
      expect(game.countGroupOwnership(1, 'Railroad')).to.equal(1)
      game.assignOwnership(3, 'readingrailroad');
      game.assignOwnership(3, 'pennsylvaniarailroad');
      game.assignOwnership(3, 'shortlinerailroad');
      expect(game.countGroupOwnership(3, 'Railroad')).to.equal(3)
      expect(game.countGroupOwnership(1, 'Railroad')).to.equal(0)
    })
  })
  context('Moving Player by increments', () => {
    it('Check player existance', async() => {
      game.setPlayers(7, 9, 11, 13)
      expect(game.getPlayerPosition(1)).to.equal(null)
    })
    it('Check player who has not yet moved', async() => {
      game.setPlayers(7, 9, 11, 13)
      expect(game.getPlayerPosition(7)).to.equal(0)
    })
    it('Move Player around board', async () => {
      game.setPlayers(7, 9, 11, 13)
      expect(game.getPlayerPosition(9)).to.equal(0)
      game.setPlayerPosition(9, 3)
      expect(game.getPlayerPosition(9)).to.equal(3)
      game.moveBy(9, 12);
      game.moveBy(9, 12);
      game.moveBy(9, 12);
      game.moveBy(9, 12);
      expect(game.getPlayerPosition(9)).to.equal(11)
    })
  })
  context('Test rent', () => {
    it('Try Group rent', async () => {
      game.setPlayers(7, 9, 11, 13)
      game.assignOwnership(7, 'boardwalk');
      let cnt = game.countGroupOwnership(7, 'darkblue');
      expect(cnt).to.equal(1);
      let rent = game.getRent('boardwalk', 3);
      console.log("--------------" + rent)
      expect(rent).to.equal(50);
      game.assignOwnership(9, 'parkplace');
      rent = game.getRent('parkplace', 3);
      expect(rent).to.equal(35);
      game.assignOwnership(7, 'parkplace');
      expect(game.countGroupOwnership(7, 'darkblue')).to.equal(2)
      rent = game.getRent('parkplace', 3);

      expect(rent).to.equal(70);
      game.assignOwnership(1, 'parkplace');

      //Railroads
      game.assignOwnership(7, 'readingrailroad');
      game.assignOwnership(7, 'pennsylvaniarailroad');
      game.assignOwnership(7, 'shortlinerailroad');
      rent = game.getRent('shortlinerailroad', 3);
      expect(rent).to.equal(100);

      //Utilities
      rent = game.getRent('electriccompany', 3);
      expect(rent).to.equal(0);
      game.assignOwnership(7, 'electriccompany');
      rent = game.getRent('electriccompany', 3);
      expect(rent).to.equal(12);
      game.assignOwnership(7, 'waterworks');
      rent = game.getRent('electriccompany', 3);
      expect(rent).to.equal(30);

    })
  })
  context('Test Ownership of group', () => {
    it('Try Group test', async () => {
      game.assignOwnership(7, 'boardwalk');
      expect(game.checkGroupOwnership('darkblue')).to.equal(false);
      game.assignOwnership(9, 'parkplace');
      expect(game.checkGroupOwnership('darkblue')).to.equal(false);
      game.assignOwnership(9, 'boardwalk');
      expect(game.checkGroupOwnership('darkblue')).to.equal(true);
    });
  })
  context('Test manipulating houses', () => {
    it('Try adding House', async () => {
      game.assignOwnership(9, 'parkplace');
      let result = game.addHouse('parkplace');
      expect(result).to.equal(false);
      game.assignOwnership(9, 'boardwalk');
      result = game.addHouse('parkplace');
      expect(result).to.equal(true);
      result = game.addHouse('parkplace');
      expect(result).to.equal(false);
      console.log("Boardwalk")
      result = game.addHouse('boardwalk');
      expect(result).to.equal(true);
    });
    it('Try removing house', async () => {
      game.assignOwnership(9, 'parkplace');
      let result = game.addHouse('parkplace');
      expect(result).to.equal(false);
      game.assignOwnership(9, 'boardwalk');
      result = game.addHouse('parkplace');
      expect(result).to.equal(true);
      result = game.addHouse('parkplace');
      expect(result).to.equal(false);
      result = game.addHouse('parkplace');
      expect(result).to.equal(false);
      result = game.addHouse('boardwalk');
      expect(result).to.equal(true);
      result = game.removeHouse('boardwalk');
      expect(result).to.equal(true);
      result = game.removeHouse('boardwalk');
      expect(result).to.equal(false);
    });
  })
  //TODO Add tests for player movements and rolling die
  context('Test rolling die', () => {
    it('One die', async () => {
      let rolls = [];
      let total = 0;
      for (let i = 0; i < 100; i++) {
        rolls[i] = game.rollDie(1)
        total += rolls[i];
      }
      expect(Math.min(...rolls)).to.equal(1)
      expect(Math.max(...rolls)).to.equal(6)
      expect(total / 100).to.approximately(3.5, 1)
    })
    it('two die', async () => {
      let game = new Game();
      let rolls = [];
      let total = 0;
      for (let i = 0; i < 1000; i++) {
        rolls[i] = game.rollDie(2)
        total += rolls[i];
      }
      expect(Math.min(...rolls)).to.equal(2)
      expect(Math.max(...rolls)).to.equal(12)
      expect(total / 1000).to.approximately(7, 1)
    })


  })

  context('Player Position testing',() => {
    it('Cross go and get 200 added to wallet',async()=> {
      game.setPlayers("a","b","c","d");
      game.getPlayerPosition("a");
      expect(game.getPlayerPosition("e")).to.equal(null);
      expect(game.getPlayerPosition("b")).to.equal(0)
      game.setPlayerPosition("b",39);
      expect(game.getPlayerPosition("b")).to.equal(39)
      game.doMove("b",1)
      expect(game.getPlayerPosition("b")).to.equal(0)
      expect(game.getWallet("b")).to.equal(1700)
    })
    it('Land on owned property get wallet deducted.',async()=> {
    })
    it('Land on go to jail square.',async()=> {
      game.setPlayers("a","b","c","d");
      game.doMove("a",30)
      expect(game.getPlayerPosition("a")).to.equal(10)
      expect(game.inJail("a")).to.equal(true);
    })
    it('Move three spaces back card',async()=> {
    })
  })
  context('Apply Community chest and risk cards',() => {
    it('Apply move cards',async() => {
      game.setPlayers("a","b","c","d");
      expect(game.getWallet("a")).to.equal(1500)
      game.activateMoveCard("a", 'go')
      expect(game.getWallet("a")).to.equal(1700)
      expect(game.getPlayerPosition("a")).to.equal(0)
      game.activateMoveCard("a", 'boardwalk')
      expect(game.getWallet("a")).to.equal(1700)
      expect(game.getPlayerPosition("a")).to.equal(39)
    })
    it('Apply move nearest card',async() => {
      game.setPlayers("a","b","c","d");
      expect(game.getWallet("a")).to.equal(1500)
      game.activateMoveCard("a", 'go')
      expect(game.getWallet("a")).to.equal(1700)
      expect(game.getPlayerPosition("a")).to.equal(0)
      game.activateMoveCard("a", 'boardwalk')
      expect(game.getWallet("a")).to.equal(1700)
      expect(game.getPlayerPosition("a")).to.equal(39)

      game.setPlayerPosition("b",4);
      game.activateMoveNearestCard("b",'Utilities');
      expect(game.getPlayerPosition("b")).to.equal(12);

      game.setPlayerPosition("b",20)
      game.activateMoveNearestCard("b",'Utilities');
      expect(game.getPlayerPosition("b")).to.equal(28);

      game.setPlayerPosition("b",30)
      game.activateMoveNearestCard("b",'Utilities');
      expect(game.getPlayerPosition("b")).to.equal(12);

      game.setPlayerPosition("b",8)
      game.activateMoveNearestCard("b",'Railroad');
      expect(game.getPlayerPosition("b")).to.equal(15);

      game.setPlayerPosition("b",20)
      game.activateMoveNearestCard("b",'Railroad');
      expect(game.getPlayerPosition("b")).to.equal(25);

      game.setPlayerPosition("b",30)
      game.activateMoveNearestCard("b",'Railroad');
      expect(game.getPlayerPosition("b")).to.equal(35);

      game.setPlayerPosition("b",1)
      game.activateMoveNearestCard("b",'Railroad');
      expect(game.getPlayerPosition("b")).to.equal(5);

      game.setPlayerPosition("b",1)
      game.activateMoveNearestCard("b",'Railroad');
      expect(game.getPlayerPosition("b")).to.equal(5);
    })
    it('Apply go to jail card',async() => {

      game.setPlayers("a","b","c","d");
      game.setPlayerPosition("b",1)
      game.activateJailCard("b");
      expect(game.getPlayerPosition("b")).to.equal(10)
      expect(game.inJail("b")).to.equal(true);
      game.releaseFromJail("b");
      expect(game.inJail("b")).to.equal(false);
    })
    it('Apply property charges', async () => {
      game.assignOwnership(9, 'parkplace');
      game.assignOwnership(9, 'boardwalk');
      game.addHouse('parkplace');
      game.addHouse('boardwalk');
      game.addHouse('parkplace');
      expect(game.activatePropertyCharges(9)).to.equal(75)
      game.addHouse('boardwalk');
      game.addHouse('parkplace');
      game.addHouse('boardwalk');
      game.addHouse('parkplace');
      game.addHouse('boardwalk');
      expect(game.activatePropertyCharges(9)).to.equal(200)
      game.addHouse('parkplace');
      expect(game.activatePropertyCharges(9)).to.equal(200)
    });
  })
})
