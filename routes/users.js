var arangojs = require('arangojs');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    testDB('shalinblitz');
    res.send('respond with a resource');
});


function testDB(player) {
    console.log('---------- In testDB');
    var db = new arangojs.Database({url: "http://localhost:8529"});
    db.useDatabase("_system");
    db.useBasicAuth("root", "arango");    
    db.query("for tgame in tgames " +
            "filter tgame.player.name == @player "
             + "return tgame ",
             {player: player}
    ).then(function (cursor) {
        return cursor.next().then(function (result) {
            console.log('Got from DB: ' + JSON.stringify(result));
        });
    }).catch(function (err) {
        console.error('DB error: ' + err);
    });

    /*
    var coll = db.collection('tgames');
    var doc = {a:"a"};
    coll.save(doc).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );

    var reqUrl = require('url').parse('https://www.chess.com/daily/game/182835986', true);
    console.log(reqUrl);

    var pathParts = reqUrl.path.split('/');
    console.log('parsed: ' + pathParts[1] + '-' + pathParts[3]);
    */

    var count = getCount('shalinblitz', 'win', 'w');
    console.log('getCount returned ' + count);
 
}

function getDB() {
    var db = new arangojs.Database({url: "http://localhost:8529"});
    db.useDatabase("_system");
    db.useBasicAuth("root", "");
    return db;
}

function getCount(player, result, color) {
    var count = 0;
    var db = getDB();
    db.query("return length("
             + "for tgame in tgames "
             + " filter tgame.game.player == @player "
             + "  && tgame.game.result == @result "
             + "  && tgame.game.color == @color "
             + " return tgame)",
             {player: player,
              result: result,
              color: color}
    ).then(function (cursor) {
        return cursor.next().then(function (result) {
            console.log('Got COUNT from DB: ' + result);
            count = result;
        });
    }).catch(function (err) {
        console.error('DB error: ' + err);
    });

    return count;
}

module.exports = router;
