var express = require('express');
var router = express.Router();


/* GET stats */
router.get('/', function(req, res, next) {

    var reqUrl = require('url').parse(req.url, true);
    console.log(reqUrl);

    var player = reqUrl.query.userid;
    console.log(req.body);

    var refresh = reqUrl.query.refresh;

    if (refresh == 'true') {
        refreshGameData(player);
    }

    var stats = computeStats(player);

    console.log("STATS: " + JSON.stringify(stats));

    res.render('index', { title: 'ChesStat',
                          player: reqUrl.query.userid,
                          stats: stats
                        });
});


//
var request = require('request');
var jsonQ = require('jsonQ');
var jsonfile = require('jsonfile');
const pgnParser = require('pgn-parser');
var fs = require('fs');

var gameRec = {
    "date": "",
    "color": "",
    "result": ""
};

//var data = [];

const WHITE = 'w';
const BLACK = 'b';

function parsePgn(pgn) {
    pgnParser((err, parser) => {
        const [result] = parser.parse(pgn);
        console.log('PARSED PGN: ' + JSON.stringify(result));
    });
}

function saveGames(player, gameData) {
    var file = player + '.json';

    var wrapper = {};
    wrapper.games = gameData;

    jsonfile.writeFile(file, wrapper, {spaces: 2}, function(err) {
        console.error(err);
    }); 
}

function fetchMonthly(player, url) {
    var data = [];
    var r = request(url, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }

        var jqBody = jsonQ(body);

        //console.log('MONTHLY BODY:' + jqBody.value());

        var games = jqBody.find('games');

        //console.log('GAMES: ' + games.value());

        games.each((index, path, value) => {
            //console.log('\n\nGAME' + value);

            jsonQ.each(value, (k, v) => {

                if (v.rules == 'chess'
                    && v.time_class == 'standard'
                    && v.time_control.startsWith('1800')) {
                    console.log(k + '-> WHITE: ' + JSON.stringify(v.white)
                                + ', BLACK: ' + JSON.stringify(v.black) + '\n');
                    //parsePgn(v.pgn);

                    var gameRec = {'game':{}};
                    var playerObj;
                    var opponentObj;
                    if (v.white.username == player) {
                        playerObj = v.white;
                        opponentObj = v.black;
                        gameRec.game.color = WHITE;
                    } else {
                        playerObj = v.black;
                        opponentObj = v.white;
                        gameRec.game.color = BLACK;
                    }
                    if (playerObj.result == 'win') {
                        gameRec.game.result = 'win';
                        gameRec.game.resultmode = opponentObj.result;
                    } else if (playerObj.result == 'stalemate'
                               || playerObj.result == 'draw') {
                        gameRec.game.result = 'draw';
                        gameRec.game.resultmode = playerObj.result;
                    } else {
                        gameRec.game.result = 'loss';
                        gameRec.game.resultmode = playerObj.result;
                    }
                    gameRec.game.opponent = opponentObj.username;

                    data.push(gameRec);

                    console.log('gameRec: ' + JSON.stringify(gameRec));
                }
            });

        });

        console.log('data: ' + JSON.stringify(data));
        saveGames(player, data);
    });
}

function refreshGameData(player) {
    var arcUrl = "https://api.chess.com/pub/player/" + player + "/games/archives";

    //request(arcUrl).pipe(res);

    console.log("URL for archives: " + arcUrl);

    var r = request(arcUrl, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        console.log(body);
        
        var jqBody = jsonQ(body);
        var archives = jqBody.find("archives");

        var data = [];

        archives.each((index, path, value) => {
            var msg = 'archives\n';
            
            for (i=0; i<1; i++) {
                msg += '#' + i + '->' + value[i] + '\n';
                fetchMonthly(player, value[i]);
            }
            
            console.log(msg);

        });


    });
    
}

function perc(n, d) {
    return Math.round(100*n/d);
}

function computeStats(player) {
    var path = player + '.json';
    var wrapper;
    if (fs.existsSync(path)) {
        wrapper = jsonfile.readFileSync(path);
    } else {
        wrapper = { games: []};
    }

    var gd = jsonQ(wrapper);
    var games = gd.find('game');
    var nGames = games.value().length;

    var wins = games.filter({
        'result':'win'
    });
    var nWins = wins.value().length;

    var whiteWins = wins.filter({
        'color': 'w'
    });
    var nWhiteWins = whiteWins.value().length;

    var nBlackWins = nWins - nWhiteWins; 

    console.log('Wins: ' + JSON.stringify(wins.value()));
    console.log('Total: ' + nGames
                + ', Wins: ' + nWins + '(' + perc(nWins, nGames) + '%) - '
                + ' White: ' + nWhiteWins + '(' + perc(nWhiteWins, nWins) + '%)'
                + ', Black: ' + nBlackWins + '(' + perc(nBlackWins, nWins) + '%)');

    var losses = games.filter({
        'result':'loss'
    });
    var nLosses = losses.value().length;

    var whiteLosses = losses.filter({
        'color': 'w'
    });
    var nWhiteLosses = whiteLosses.value().length;

    var nBlackLosses = nLosses - nWhiteLosses; 

    console.log('Losses: ' + JSON.stringify(losses.value()));
    console.log('Total: ' + nGames
                + ', Losses: ' + nLosses + '(' + perc(nLosses, nGames) + '%) - '
                + ' White: ' + nWhiteLosses + '(' + perc(nWhiteLosses, nLosses) + '%)'
                + ', Black: ' + nBlackLosses + '(' + perc(nBlackLosses, nLosses) + '%)');

    var draws = games.filter({
        'result':'draw'
    });
    var nDraws = draws.value().length;

    var whiteDraws = draws.filter({
        'color': 'w'
    });
    var nWhiteDraws = whiteDraws.value().length;

    var nBlackDraws = nDraws - nWhiteDraws; 

    console.log('Draws: ' + JSON.stringify(draws.value()));
    console.log('Total: ' + nGames
                + ', Draws: ' + nDraws + '(' + perc(nDraws, nGames) + '%) - '
                + ' White: ' + nWhiteDraws + '(' + perc(nWhiteDraws, nDraws) + '%)'
                + ', Black: ' + nBlackDraws + '(' + perc(nBlackDraws, nDraws) + '%)');


    return {
        player: player,
        wins: {
            total: nWins,
            white: nWhiteWins,
            black: nBlackWins
        },
        losses: {
            total: nLosses,
            white: nWhiteLosses,
            black: nBlackLosses
        },
        draws: {
            total: nDraws,
            white: nWhiteDraws,
            black: nBlackDraws
        }
    };
}




//


module.exports = router;
