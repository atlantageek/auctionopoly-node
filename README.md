# Auctionopoly

## Run Tests
- Download code
- npm install
- npm test

## Rules of Auctionopoly
Played on a monopoly like board with same cards and properties however the difference is that when you land on a property it immediately goes up for auction and anyone can purchase it.  This gets rid of a lot of luck and adds more strategy to the game.

Strategies might include
- Getting one of each of the cheaper properties to block group control.
- Bidding up prices on the last property of a group to get players to spend all their money.
- Getting all the railroads and try to win early game.
- Buy all the cheaper properties (The 5 properties after Go) and lock down 20 of the houses leaving 12 for everyone else.

Other possible rule changes.
- Allow player to roll either 1 die or 2.  This will allow a player to target a little more which property they land on.
- The player that lands on a property gets 10% of the auction price as a finder's fee. (or a 10% discount if they win the bid)
- Pay a fee to keep properties mortgaged.
- Do not collect rent while in jail.

## Current files
- game.js - Main game object under development.  Will handle rules and track state of game.
- b.js - crap code testing redis connection
- server.js - Eventually will be the host of the game.  Currently a barebones login and user management screen.
- ws-server.js - Testing websockets.
- index.html - pairs with ws-server.js to test web sockets.
