//var App = Ember.Application.create();
$(document).ready(function() {

var CANVAS_WIDTH = 1201;
var NUM_STRINGS = 6;
var NUM_FRETS = 24;
var NUM_FRET_BARS = 25;
var X_OFFSET = 40;
var Y_OFFSET = 55;
var FRETBOARD_WIDTH = 240;
var FRETBOARD_HEIGHT = 1200;
var VERT_LINE_PAD = FRETBOARD_HEIGHT / NUM_FRET_BARS;
var HOR_LINE_PAD = FRETBOARD_WIDTH / NUM_STRINGS;
var FRET_MARK_RADIUS = 8;

var paper = Raphael("fretboard", CANVAS_WIDTH, 300);

// fretboard background
var fretBg = paper.rect(X_OFFSET, Y_OFFSET, FRETBOARD_HEIGHT, FRETBOARD_WIDTH);
fretBg.attr("fill", "#000");
fretBg.attr("stroke", "#000");

// fret circle markers

function fretCoord(fret) {
    var xCoord = X_OFFSET + ((VERT_LINE_PAD * fret) - (VERT_LINE_PAD / 3));
    return xCoord;
}

function stringCoord(stringNum) {
    return (stringNum * HOR_LINE_PAD) + Y_OFFSET + (FRETBOARD_WIDTH / 12) - 2;
}

function randFretStringNums() {
    var randFret = Math.floor(Math.random() * (NUM_FRETS + 1));
    var randString = Math.floor(Math.random() * NUM_STRINGS);

    return {fretNum: randFret, stringNum: randString};
}

// first octave markers
for (var fret = 3; fret <= 9; fret +=2) {
    var mark = paper.circle(fretCoord(fret), Y_OFFSET + (FRETBOARD_WIDTH / 2), FRET_MARK_RADIUS);
    mark.attr("fill", "#fff");
    mark.attr("stroke", "#fff");
}
var halfFretboardWidth = (FRETBOARD_WIDTH / 2);
var twelveMarkTop = paper.circle(fretCoord(12), Y_OFFSET + 1 + halfFretboardWidth - (halfFretboardWidth / 3), FRET_MARK_RADIUS);
var twelveMarkBottom = paper.circle(fretCoord(12), Y_OFFSET + 1 + halfFretboardWidth + (halfFretboardWidth / 3), FRET_MARK_RADIUS);
twelveMarkTop.attr("fill", "#fff");
twelveMarkBottom.attr("fill", "#fff");
twelveMarkTop.attr("stroke", "#fff");
twelveMarkBottom.attr("stroke", "#fff");

// second octave markers
for (var fret = 15; fret <= 21; fret +=2) {
    var mark = paper.circle(fretCoord(fret), Y_OFFSET + (FRETBOARD_WIDTH / 2), FRET_MARK_RADIUS);
    mark.attr("fill", "#fff");
    mark.attr("stroke", "#fff");
}
twelveMarkTop = paper.circle(fretCoord(24), Y_OFFSET + 1 + halfFretboardWidth - (halfFretboardWidth / 3), FRET_MARK_RADIUS);
twelveMarkBottom = paper.circle(fretCoord(24), Y_OFFSET + 1 + halfFretboardWidth + (halfFretboardWidth / 3), FRET_MARK_RADIUS);
twelveMarkTop.attr("fill", "#fff");
twelveMarkBottom.attr("fill", "#fff");
twelveMarkTop.attr("stroke", "#fff");
twelveMarkBottom.attr("stroke", "#fff");
// end fretboard background

// vertical lines
var firstVertLine = paper.rect(X_OFFSET, Y_OFFSET, 8, HOR_LINE_PAD * 6);
firstVertLine.attr("fill", "#FFF");
// end vertical lines

for (var i = 1; i < NUM_FRET_BARS; ++i) {
    var vertLine = paper.rect((i * VERT_LINE_PAD) + X_OFFSET + 6, Y_OFFSET, 2, HOR_LINE_PAD * 6);
    vertLine.attr("fill", "silver");
    vertLine.attr("stroke", "silver");
}

// horizontal lines
for (var i = 0; i < NUM_STRINGS; ++i) {
    var horLine = paper.rect(X_OFFSET, stringCoord(i), FRETBOARD_HEIGHT, i + 1);
    horLine.attr("fill", "#AAAAAA");
    horLine.attr("stroke", "#888888");
}
// end horizontal lines
function noteHTMLString(note) {
    switch(note) {
        case 0: return "A";
        case 1: return "A&#9839;/B&#9837;";
        case 2: return "B";
        case 3: return "C";
        case 4: return "C&#9839;/D&#9837;";
        case 5: return "D";
        case 6: return "D&#9839;/E&#9837;";
        case 7: return "E";
        case 8: return "F";
        case 9: return "F&#9839;/G&#9837;";
        case 10: return "G";
        case 11: return "G&#9839;/A&#9837;";
    }
}

    var randSpot = randFretStringNums();
    var randPress = paper.circle(fretCoord(1), stringCoord(1), 15);

    function playFretboardGuess() {
        randSpot = randFretStringNums();
        randPress.remove();
        randPress = paper.circle(fretCoord(randSpot.fretNum), stringCoord(randSpot.stringNum), 15);
        randPress.attr("fill", "blue");
        randPress.attr("stroke", "blue");
    }
    playFretboardGuess();

function processGuess(guessNote, fretNum, stringNum) {
    var actualNote = 0;
    var octaveFret = fretNum % 12;

    if (stringNum === 0 || stringNum === 5) {
        actualNote = (octaveFret + 7) % 12;
    } else if (stringNum === 1) {
        actualNote = (octaveFret + 2) % 12;
    } else if (stringNum === 2) {
        actualNote = (octaveFret + 10) % 12;
    } else if (stringNum === 3) {
        actualNote = (octaveFret + 5) % 12;
    } else if (stringNum === 4) {
        actualNote = octaveFret % 12;
    }

    if (guessNote === actualNote) {
        $('#message h1').html(noteHTMLString(guessNote) + " is correct")
            .removeClass("error")
            .addClass("success")
            .css('visibility', 'visible');
        $('#message h1').fadeOut(1500, function() {
            $(this).show().css('visibility', 'hidden')
            playFretboardGuess();
        });
    } else {
        $('#message h1').html(noteHTMLString(guessNote) + " is wrong")
            .removeClass("success")
            .addClass("error")
            .css('visibility', 'visible');
    }
}

$('.notes a').click(function (e) {
    e.preventDefault();
    var note = $(this).data('note');
    processGuess(note, randSpot.fretNum, randSpot.stringNum);

});

});