$(document).ready(function () {
// GAME CONSTANTS
    var CANVAS_WIDTH = 1201,
        CANVAS_HEIGHT = 1000,
        NUM_STRINGS = 6,
        NUM_FRETS = 24,
        NUM_FRET_BARS = 25,
        X_OFFSET = 40,
        Y_OFFSET = 55,
        FRETBOARD_WIDTH = 240,
        FRETBOARD_HEIGHT = 1200,
        VERT_LINE_PAD = FRETBOARD_HEIGHT / NUM_FRET_BARS,
        HOR_LINE_PAD = FRETBOARD_WIDTH / NUM_STRINGS,
        FRET_MARK_RADIUS = 8,
        INFO_OFFSET = Y_OFFSET + FRETBOARD_WIDTH + (FRETBOARD_WIDTH / 4.0),
        GUESS_PAD_OFFSET = INFO_OFFSET + (FRETBOARD_WIDTH),
        RAND_PRESS_RADIUS = (VERT_LINE_PAD / 2) - ((VERT_LINE_PAD / 2) / 5),
        NOTE_QUESTION_TEXT = "Guess the note pressed on the fretboard";

    // Raphael.js monkey patching
    Raphael.fn.donutChart = function (cx, cy, rOut, rIn, outNotes, inNotes, stroke) {
        var paper = this,
            rad = Math.PI / 180,
            chart = this.set();

        function innerSector(cx, cy, r, startAngle, endAngle, params) {
            //console.log(params.fill);
            var x1 = cx + r * Math.cos(-startAngle * rad),
                x2 = cx + r * Math.cos(-endAngle * rad),
                y1 = cy + r * Math.sin(-startAngle * rad),
                y2 = cy + r * Math.sin(-endAngle * rad);
            return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
        }

        function outerSector(cx, cy, r, startAngle, endAngle, params) {
            //console.log(params.fill);
            var x1 = cx + r * Math.cos(-startAngle * rad),
                x2 = cx + r * Math.cos(-endAngle * rad),
                y1 = cy + r * Math.sin(-startAngle * rad),
                y2 = cy + r * Math.sin(-endAngle * rad),
                xx1 = cx + rIn * Math.cos(-startAngle * rad),
                xx2 = cx + rIn * Math.cos(-endAngle * rad),
                yy1 = cy + rIn * Math.sin(-startAngle * rad),
                yy2 = cy + rIn * Math.sin(-endAngle * rad);

            return paper.path(["M", xx1, yy1,
                "L", x1, y1,
                "A", rOut, rOut, 0, +(endAngle - startAngle > 180), 0, x2, y2,
                "L", xx2, yy2,
                "A", rIn, rIn, 0, +(endAngle - startAngle > 180), 1, xx1, yy1, "z"]
            ).attr(params);

        }

        // outer donut chart
        var outAngle = 50,
            outTotal = 0,
            outStart = 0,
            outProcess = function (j) {
                var outNote = outNotes[j],
                    outAngleplus = 360 * outNote.percent / outTotal,
                    outPopangle = outAngle + (outAngleplus / 2),
                    outSectorPad = 52,
                    ms = 0,
                    delta = 30,
                    bcolor = outNote.bgColor,
                    p = outerSector(cx, cy, rOut, outAngle, outAngle + outAngleplus, {fill: bcolor, stroke: "#000", "stroke-width": 3}),
                    txt = paper.text(cx + (rOut - outSectorPad) * Math.cos(-outPopangle * rad), cy + (rOut - outSectorPad) * Math.sin(-outPopangle * rad), outNote.label).attr({fill: '#000', stroke:"none", "font-size":20});
                var pieceMouseOver = function () {
                    p.stop().animate({transform:"s1.05 1.05 " + (cx) + " " + (cy)}, ms, "linear");
                    txt.stop().animate({transform:"s1.05 1.05 " + (cx) + " " + (cy)}, ms, "linear");
                },
                pieceMouseOut = function () {
                    p.stop().animate({transform:""}, ms, "linear");
                    txt.stop().animate({transform:""}, ms, "linear");
                },
                pieceClick = function() {
                    processGuess(outNote.value, randSpot.fretNum, randSpot.stringNum);
                };

                p.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
                txt.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
                p.click(pieceClick);
                txt.click(pieceClick);

                outAngle += outAngleplus;
                chart.push(p);
                chart.push(txt);
                outStart += .1;
            };
        for (var i = 0, outNotesSize = outNotes.length; i < outNotesSize; i++)
            outTotal += outNotes[i].percent;
        for (i = 0; i < outNotesSize; i++)
            outProcess(i);
        // end outer donut chart

        // inner pie chart
        var inAngle = 25,
            inTotal = 0,
            inStart = 0,
            inProcess = function (j) {
                var inNote = inNotes[j],
                    inAngleplus = 360 * inNote.percent / inTotal,
                    inPopangle = inAngle + (inAngleplus / 2),
                    inSectorPad = 35,
                    ms = 0,
                    delta = 30,
                    bcolor = inNote.bgColor;

                if (inNote.value !== -1) {
                    var p = innerSector(cx, cy, rIn, inAngle, inAngle + inAngleplus, {fill:bcolor, stroke:"#000", "stroke-width":3}),
                        txt = paper.text(cx + (rIn - inSectorPad) * Math.cos(-inPopangle * rad), cy + (rIn - inSectorPad) * Math.sin(-inPopangle * rad), inNote.label).attr({fill:'#000', stroke:"none", "font-size":20});
                    var pieceMouseOver = function () {
                            p.stop().animate({transform:"s1.05 1.05 " + (cx) + " " + (cy)}, ms, "linear");
                            txt.stop().animate({transform:"s1.05 1.05 " + (cx) + " " + (cy)}, ms, "linear");
                        },
                        pieceMouseOut = function () {
                            p.stop().animate({transform:""}, ms, "linear");
                            txt.stop().animate({transform:""}, ms, "linear");
                        },
                        pieceClick = function() {
                            processGuess(inNote.value, randSpot.fretNum, randSpot.stringNum);
                        };

                    p.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
                    txt.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
                    p.click(pieceClick);
                    txt.click(pieceClick);

                    chart.push(p);
                    chart.push(txt);
                }
                inAngle += inAngleplus;
                inStart += .1;
            };
        for (var i = 0, inNotesSize = inNotes.length; i < inNotesSize; i++)
            inTotal += inNotes[i].percent;
        for (i = 0; i < inNotesSize; i++)
            inProcess(i);
        // end inner pie chart
        return chart;
    };
// end monkey patching

// GAME LOGIC START
    var paper = Raphael("fretboard", CANVAS_WIDTH, CANVAS_HEIGHT);

// fretboard background
    var fretBg = paper.rect(X_OFFSET, Y_OFFSET, FRETBOARD_HEIGHT, FRETBOARD_WIDTH);
    fretBg.attr("fill", "#000");
    fretBg.attr("stroke", "#000");
// end fretboard background

    var infoText = paper.text(CANVAS_WIDTH / 2.0, INFO_OFFSET, NOTE_QUESTION_TEXT).attr({fill: "#000", stroke: "none", "font-size": 40});

    // GAMEPAD
    var outerNotes = [
        {
            label: "A",
            percent: 0.1428571429,
            value: 0,
            bgColor: "blue"
        },
        {
            label: "B",
            percent: 0.1428571429,
            value: 2,
            bgColor: "red"
        },
        {
            label: "C",
            percent: 0.1428571429,
            value: 3,
            bgColor: "yellow"
        },
        {
            label: "D",
            percent: 0.1428571429,
            value: 5,
            bgColor: "red"
        },
        {
            label: "E",
            percent: 0.1428571429,
            value: 7,
            bgColor: "blue"
        },
        {
            label: "F",
            percent: 0.1428571429,
            value: 8,
            bgColor: "red"
        },
        {
            label: "G",
            percent: 0.1428571429,
            value: 10,
            bgColor: "yellow"
        }
    ];
    var innerNotes = [
        {
            label: "A\u266F\nB\u266D",
            percent: 0.1428571429,
            value: 1,
            bgColor: "#FF00FF"
        },
        {
            label: "",
            percent: 0.1428571429,
            value: -1,
            bgColor: "#FFF"
        },
        {
            label: "C\u266F\nD\u266D",
            percent: 0.1428571429,
            value: 4,
            bgColor: "#FFA500"
        },
        {
            label: "D\u266F\nE\u266D",
            percent: 0.1428571429,
            value: 6,
            bgColor: "#FF00FF"
        },
        {
            label: "",
            percent: 0.1428571429,
            value: -1,
            bgColor: "#FFF"
        },
        {
            label: "F\u266F\nG\u266D",
            percent: 0.1428571429,
            value: 9,
            bgColor: "#FFA500"
        },
        {
            label: "G\u266F\nA\u266D",
            percent: 0.1428571429,
            value: 11,
            bgColor: "#00FF00"
        }
    ];

    var gamePad = paper.donutChart(CANVAS_WIDTH / 2.0, GUESS_PAD_OFFSET, 200, 100,
        outerNotes.reverse(),
        innerNotes.reverse()
    );


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

        return { fretNum: randFret, stringNum: randString };
    }

// first octave markers
    for (var fret = 3; fret <= 9; fret += 2) {
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
    for (var fret = 15; fret <= 21; fret += 2) {
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
    function noteUnicodeString(note) {
        switch (note) {
            case 0:
                return "A";
            case 1:
                return "A\u266F\nB\u266D";
            case 2:
                return "B";
            case 3:
                return "C";
            case 4:
                return "C\u266F\nD\u266D";
            case 5:
                return "D";
            case 6:
                return "D\u266F\nE\u266D";
            case 7:
                return "E";
            case 8:
                return "F";
            case 9:
                return "F\u266F\nG\u266D";
            case 10:
                return "G";
            case 11:
                return "G\u266F\nA\u266D";
        }
    }

    var randSpot = randFretStringNums();
    var randPress = paper.circle(fretCoord(1), stringCoord(1), RAND_PRESS_RADIUS);

    function playFretboardGuess() {
        infoText.attr({text: NOTE_QUESTION_TEXT, fill: '#000', stroke:"none", "font-size": 40});
        randSpot = randFretStringNums();
        randPress.remove();
        randPress = paper.circle(fretCoord(randSpot.fretNum), stringCoord(randSpot.stringNum), RAND_PRESS_RADIUS);
        randPress.attr("fill", "#FF0000");
        randPress.attr("stroke", "#FF0000");
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

        var noteStr = noteUnicodeString(guessNote);

        if (guessNote === actualNote) {
            var noteText = paper.text(randPress.attr('cx'), randPress.attr('cy'), noteStr).attr({fill: '#FFF', stroke: '#FFF', "font-size": RAND_PRESS_RADIUS - (RAND_PRESS_RADIUS / 4)});
            randPress.attr({fill: "green", stroke: "green"});
            infoText.attr({text: noteStr + " is correct", fill: 'green', stroke:"none", "font-size": 40})
                .animate({"font-size": 40},
                1100, "linear",
                function() {
                    noteText.remove();
                    playFretboardGuess();
                }
            );


//            $(infoText).effect("highlight", 1300, function () {
//                infoText.attr({text: NOTE_QUESTION_TEXT, fill: '#000', stroke:"none", "font-size": 40});
//                playFretboardGuess();
//                noteText.remove();
//            });
        } else {
            infoText.attr({text: noteStr + " is wrong",fill: '#FF0000', stroke:"none", "font-size": 40});
        }
    }

    $('.notes a').click(function (e) {
        e.preventDefault();
        var note = $(this).data('note');
        processGuess(note, randSpot.fretNum, randSpot.stringNum);

    });

});