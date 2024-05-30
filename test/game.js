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
      var r=game.add_player('a','b');
      expect(r).to.equal(true);
      expect(game.player_list.length).to.equal(1)
      r=game.add_player('c','b');
      expect(r).to.equal(true);
      expect(game.player_list.length).to.equal(2)
      r=game.add_player('a','b');
      expect(r).to.equal(false);
      expect(game.player_list.length).to.equal(2)

    })
  })
  context('set players', () => {
    it('should return 4 players', async () => {

      game.set_players(1, 2, 3, 4);
      expect(game.player_list.length).to.equal(4)
      for (let i = 0; i < 17; i++) game.next_turn();
      expect(game.get_current_player()).to.equal(2)
    })
  })
  context('assign ownership', () => {
    it('should return 4 players', async () => {

      game.set_players(1, 2, 3, 4);
      game.assign_ownership(2, 'boardwalk');
      let property = game.get_property('boardwalk');
      expect(property.owned_by).to.equal(2);
    })
  })
  context('get properties by group', () => {
    it('Try to get all railroads', async () => {

      let idList = game.get_ids_by_group('Railroad');
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
      game.set_players(1, 2, 3, 4)
      game.assign_ownership(3, 'boardwalk');
      game.assign_ownership(1, 'parkplace');
      expect(game.check_group_ownership('darkblue')).to.equal(false)
      game.assign_ownership(3, 'parkplace');
      expect(game.check_group_ownership('darkblue')).to.equal(true)
    })
  })
  context('count properties  group ownership', () => {
    it('Test ownershipCount', async () => {
      //Will be used in calculating rent on railroads and utilitiles
      game.set_players(1, 2, 3, 4)
      game.assign_ownership(3, 'readingrailroad');
      game.assign_ownership(1, 'pennsylvaniarailroad');
      game.assign_ownership(3, 'shortlinerailroad');
      expect(game.count_group_ownership(3, 'Railroad')).to.equal(2)
      game.assign_ownership(3, 'boardwalk');
      game.assign_ownership(1, 'parkplace');
      game.assign_ownership(3, 'parkplace');
      expect(game.count_group_ownership(1, 'Railroad')).to.equal(1)
      game.assign_ownership(3, 'readingrailroad');
      game.assign_ownership(3, 'pennsylvaniarailroad');
      game.assign_ownership(3, 'shortlinerailroad');
      expect(game.count_group_ownership(3, 'Railroad')).to.equal(3)
      expect(game.count_group_ownership(1, 'Railroad')).to.equal(0)
    })
  })
  context('Moving Player by increments', () => {
    it('Check player existance', async() => {
      game.set_players(7, 9, 11, 13)
      expect(game.get_player_position(1)).to.equal(null)
    })
    it('Check player who has not yet moved', async() => {
      game.set_players(7, 9, 11, 13)
      expect(game.get_player_position(7)).to.equal(0)
    })
    it('Move Player around board', async () => {
      game.set_players(7, 9, 11, 13)
      expect(game.get_player_position(9)).to.equal(0)
      game.set_player_position(9, 3)
      expect(game.get_player_position(9)).to.equal(3)
      game.move_by(9, 12);
      game.move_by(9, 12);
      game.move_by(9, 12);
      game.move_by(9, 12);
      expect(game.get_player_position(9)).to.equal(11)
    })
  })
  context('Test rent', () => {
    it('Try Group rent', async () => {
      game.set_players(7, 9, 11, 13)
      game.assign_ownership(7, 'boardwalk');
      let cnt = game.count_group_ownership(7, 'darkblue');
      expect(cnt).to.equal(1);
      let rent = game.get_rent('boardwalk', 3);
      console.log("--------------" + rent)
      expect(rent).to.equal(50);
      game.assign_ownership(9, 'parkplace');
      rent = game.get_rent('parkplace', 3);
      expect(rent).to.equal(35);
      game.assign_ownership(7, 'parkplace');
      expect(game.count_group_ownership(7, 'darkblue')).to.equal(2)
      rent = game.get_rent('parkplace', 3);

      expect(rent).to.equal(70);
      game.assign_ownership(1, 'parkplace');

      //Railroads
      game.assign_ownership(7, 'readingrailroad');
      game.assign_ownership(7, 'pennsylvaniarailroad');
      game.assign_ownership(7, 'shortlinerailroad');
      rent = game.get_rent('shortlinerailroad', 3);
      expect(rent).to.equal(100);

      //Utilities
      rent = game.get_rent('electriccompany', 3);
      expect(rent).to.equal(0);
      game.assign_ownership(7, 'electriccompany');
      rent = game.get_rent('electriccompany', 3);
      expect(rent).to.equal(12);
      game.assign_ownership(7, 'waterworks');
      rent = game.get_rent('electriccompany', 3);
      expect(rent).to.equal(30);

    })
  })
  context('Test Ownership of group', () => {
    it('Try Group test', async () => {
      game.assign_ownership(7, 'boardwalk');
      expect(game.check_group_ownership('darkblue')).to.equal(false);
      game.assign_ownership(9, 'parkplace');
      expect(game.check_group_ownership('darkblue')).to.equal(false);
      game.assign_ownership(9, 'boardwalk');
      expect(game.check_group_ownership('darkblue')).to.equal(true);
    });
  })
  context('Test manipulating houses', () => {
    it('Try adding House', async () => {
      game.assign_ownership(9, 'parkplace');
      let result = game.add_house('parkplace');
      expect(result).to.equal(false);
      game.assign_ownership(9, 'boardwalk');
      result = game.add_house('parkplace');
      expect(result).to.equal(true);
      result = game.add_house('parkplace');
      expect(result).to.equal(false);
      console.log("Boardwalk")
      result = game.add_house('boardwalk');
      expect(result).to.equal(true);
    });
    it('Try removing house', async () => {
      game.assign_ownership(9, 'parkplace');
      let result = game.add_house('parkplace');
      expect(result).to.equal(false);
      game.assign_ownership(9, 'boardwalk');
      result = game.add_house('parkplace');
      expect(result).to.equal(true);
      result = game.add_house('parkplace');
      expect(result).to.equal(false);
      result = game.add_house('parkplace');
      expect(result).to.equal(false);
      result = game.add_house('boardwalk');
      expect(result).to.equal(true);
      result = game.remove_house('boardwalk');
      expect(result).to.equal(true);
      result = game.remove_house('boardwalk');
      expect(result).to.equal(false);
    });
  })
  //TODO Add tests for player movements and rolling die
  context('Test rolling die', () => {
    it('One die', async () => {
      let rolls = [];
      let total = 0;
      for (let i = 0; i < 100; i++) {
        rolls[i] = game.roll_die(1)
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
        rolls[i] = game.roll_die(2)
        total += rolls[i];
      }
      expect(Math.min(...rolls)).to.equal(2)
      expect(Math.max(...rolls)).to.equal(12)
      expect(total / 1000).to.approximately(7, 1)
    })


  })

  context('Player Position testing',() => {
    it('Cross go and get 200 added to wallet',async()=> {
      game.set_players("a","b","c","d");
      game.get_player_position("a");
      expect(game.get_player_position("e")).to.equal(null);
      expect(game.get_player_position("b")).to.equal(0)
      game.set_player_position("b",39);
      expect(game.get_player_position("b")).to.equal(39)
      game.do_move("b",1)
      expect(game.get_player_position("b")).to.equal(0)
      expect(game.get_wallet("b")).to.equal(1700)
    })
    it('Land on owned property get wallet deducted.',async()=> {
    })
    it('Land on go to jail square.',async()=> {
      game.set_players("a","b","c","d");
      game.do_move("a",30)
      expect(game.get_player_position("a")).to.equal(10)
      expect(game.in_jail("a")).to.equal(true);
    })
    it('Move three spaces back card',async()=> {
    })
  })
  context('Apply Community chest and risk cards',() => {
    it('Apply move cards',async() => {
      game.set_players("a","b","c","d");
      expect(game.get_wallet("a")).to.equal(1500)
      game.activate_move_card("a", 'go')
      expect(game.get_wallet("a")).to.equal(1700)
      expect(game.get_player_position("a")).to.equal(0)
      game.activate_move_card("a", 'boardwalk')
      expect(game.get_wallet("a")).to.equal(1700)
      expect(game.get_player_position("a")).to.equal(39)
    })
    it('Apply move nearest card',async() => {
      game.set_players("a","b","c","d");
      expect(game.get_wallet("a")).to.equal(1500)
      game.activate_move_card("a", 'go')
      expect(game.get_wallet("a")).to.equal(1700)
      expect(game.get_player_position("a")).to.equal(0)
      game.activate_move_card("a", 'boardwalk')
      expect(game.get_wallet("a")).to.equal(1700)
      expect(game.get_player_position("a")).to.equal(39)

      game.set_player_position("b",4);
      game.activate_move_nearest_card("b",'Utilities');
      expect(game.get_player_position("b")).to.equal(12);

      game.set_player_position("b",20)
      game.activate_move_nearest_card("b",'Utilities');
      expect(game.get_player_position("b")).to.equal(28);

      game.set_player_position("b",30)
      game.activate_move_nearest_card("b",'Utilities');
      expect(game.get_player_position("b")).to.equal(12);

      game.set_player_position("b",8)
      game.activate_move_nearest_card("b",'Railroad');
      expect(game.get_player_position("b")).to.equal(15);

      game.set_player_position("b",20)
      game.activate_move_nearest_card("b",'Railroad');
      expect(game.get_player_position("b")).to.equal(25);

      game.set_player_position("b",30)
      game.activate_move_nearest_card("b",'Railroad');
      expect(game.get_player_position("b")).to.equal(35);

      game.set_player_position("b",1)
      game.activate_move_nearest_card("b",'Railroad');
      expect(game.get_player_position("b")).to.equal(5);

      game.set_player_position("b",1)
      game.activate_move_nearest_card("b",'Railroad');
      expect(game.get_player_position("b")).to.equal(5);
    })
    it('Apply go to jail card',async() => {

      game.set_players("a","b","c","d");
      game.set_player_position("b",1)
      game.activate_jail_card("b");
      expect(game.get_player_position("b")).to.equal(10)
      expect(game.in_jail("b")).to.equal(true);
      game.release_from_jail("b");
      expect(game.in_jail("b")).to.equal(false);
    })
    it('Apply property charges', async () => {
      game.assign_ownership(9, 'parkplace');
      game.assign_ownership(9, 'boardwalk');
      game.add_house('parkplace');
      game.add_house('boardwalk');
      game.add_house('parkplace');
      expect(game.activatePropertyCharges(9)).to.equal(75)
      game.add_house('boardwalk');
      game.add_house('parkplace');
      game.add_house('boardwalk');
      game.add_house('parkplace');
      game.add_house('boardwalk');
      expect(game.activatePropertyCharges(9)).to.equal(200)
      game.add_house('parkplace');
      expect(game.activatePropertyCharges(9)).to.equal(200)
    });
    it('Check Property By Position',async() => {
      var prop = game.get_tile_idx("freeparking");
      expect(prop).to.equal(20)
      expect(game.board[20].id).to.equal("freeparking")
    });
    it('startAuction',async() => {
      game.set_players("a","b","c","d");
      var result = game.start_auction('gotojail')
      expect(result).to.equal(false);
      game.assign_ownership("a","mediterraneanave")
      result = game.start_auction('mediterraneanave')
      expect(result).to.equal(false);
      result = game.start_auction('balticave')
      expect(result).to.equal(true);
    })
  })
})
