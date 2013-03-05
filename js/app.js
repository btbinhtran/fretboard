$(document).ready(function () {
// GAME CONSTANTS
    var CANVAS_WIDTH = $(document).width() * 0.95,
        CANVAS_HEIGHT = $(document).height() * 1.2,
        NUM_STRINGS = 6,
        NUM_FRETS = 24,
        NUM_FRET_BARS = 25,
        FRETBOARD_WIDTH = CANVAS_HEIGHT * 0.26,
        FRETBOARD_HEIGHT = CANVAS_WIDTH * 0.95,
        X_OFFSET = (CANVAS_WIDTH - FRETBOARD_HEIGHT) - 5,
        Y_OFFSET = 10,
        VERT_LINE_PAD = FRETBOARD_HEIGHT / NUM_FRET_BARS,
        HOR_LINE_PAD = FRETBOARD_WIDTH / NUM_STRINGS,
        FRET_MARK_RADIUS = HOR_LINE_PAD * 0.25,
        INFO_OFFSET = Y_OFFSET + FRETBOARD_WIDTH + (FRETBOARD_WIDTH / 8.0),
        GUESS_PAD_OFFSET = INFO_OFFSET + (FRETBOARD_WIDTH + 10),
        RAND_PRESS_RADIUS = (VERT_LINE_PAD / 2) - ((VERT_LINE_PAD / 2) / 5),
        GAMEPAD_OUT_RADIUS = FRETBOARD_WIDTH * 0.80,
        GAMEPAD_IN_RADIUS = GAMEPAD_OUT_RADIUS / 2.0,
        INFO_TEXT_FONT_SIZE = 40 * (1 - (40 / FRETBOARD_WIDTH)),
        WHEEL_TEXT_FONT_SIZE = 20 * (1 - (20 / FRETBOARD_WIDTH))
        NOTE_QUESTION_TEXT = "Guess the note pressed on the fretboard";


    // Raphael.js monkey patching
    Raphael.fn.donutChart = function (cx, cy, rOut, rIn, outNotes, inNotes, stroke) {
        var paper = this,
            rad = Math.PI / 180,
            chart = this.set(),
            txtStrokeColor = "#000";

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
                    outSectorPad = 52 * (1 - (52 / FRETBOARD_WIDTH)),
                    ms = 0,
                    delta = 30,
                    bcolor = outNote.bgColor,
                    p = outerSector(cx, cy, rOut, outAngle, outAngle + outAngleplus, {fill: bcolor, stroke: txtStrokeColor, "stroke-width": 3}),
                    txt = paper.text(cx + (rOut - outSectorPad) * Math.cos(-outPopangle * rad), cy + (rOut - outSectorPad) * Math.sin(-outPopangle * rad), outNote.label).attr({fill: txtStrokeColor, stroke: txtStrokeColor, "font-size": WHEEL_TEXT_FONT_SIZE});
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
                txt.mouseover(pieceMouseOver);
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
                    inSectorPad = 35 * (1 - (35 / FRETBOARD_WIDTH)),
                    ms = 0,
                    delta = 30,
                    bcolor = inNote.bgColor;

                if (inNote.value !== -1) {
                    var p = innerSector(cx, cy, rIn, inAngle, inAngle + inAngleplus, {fill:bcolor, stroke: txtStrokeColor, "stroke-width":3}),
                        txt = paper.text(cx + (rIn - inSectorPad) * Math.cos(-inPopangle * rad), cy + (rIn - inSectorPad) * Math.sin(-inPopangle * rad), inNote.label).attr({fill: txtStrokeColor, stroke: txtStrokeColor, "font-size": WHEEL_TEXT_FONT_SIZE});
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

    var infoText = paper.text(CANVAS_WIDTH / 2.0, INFO_OFFSET, NOTE_QUESTION_TEXT).attr({fill: "#000", stroke: "none", "font-size": INFO_TEXT_FONT_SIZE});

    // GAMEPAD
    var outerNotes = [
        {
            label: "A",
            percent: 0.1428571429,
            value: 9,
            bgColor: "blue"
        },
        {
            label: "B",
            percent: 0.1428571429,
            value: 11,
            bgColor: "red"
        },
        {
            label: "C",
            percent: 0.1428571429,
            value: 0,
            bgColor: "yellow"
        },
        {
            label: "D",
            percent: 0.1428571429,
            value: 2,
            bgColor: "red"
        },
        {
            label: "E",
            percent: 0.1428571429,
            value: 4,
            bgColor: "blue"
        },
        {
            label: "F",
            percent: 0.1428571429,
            value: 5,
            bgColor: "red"
        },
        {
            label: "G",
            percent: 0.1428571429,
            value: 7,
            bgColor: "yellow"
        }
    ];
    var innerNotes = [
        {
            label: "A\u266F\nB\u266D",
            percent: 0.1428571429,
            value: 10,
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
            value: 1,
            bgColor: "#FFA500"
        },
        {
            label: "D\u266F\nE\u266D",
            percent: 0.1428571429,
            value: 3,
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
            value: 6,
            bgColor: "#FFA500"
        },
        {
            label: "G\u266F\nA\u266D",
            percent: 0.1428571429,
            value: 8,
            bgColor: "#00FF00"
        }
    ];

    var gamePad = paper.donutChart(CANVAS_WIDTH / 2.0, GUESS_PAD_OFFSET, GAMEPAD_OUT_RADIUS, GAMEPAD_IN_RADIUS,
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
                return "C";
            case 1:
                return "C\u266F\nD\u266D";
            case 2:
                return "D";
            case 3:
                return "D\u266F\nE\u266D";
            case 4:
                return "E";
            case 5:
                return "F";
            case 6:
                return "F\u266F\nG\u266D";
            case 7:
                return "G";
            case 8:
                return "G\u266F\nA\u266D";
            case 9:
                return "A";
            case 10:
                return "A\u266F\nB\u266D";
            case 11:
                return "B";
        }
    }

    var randSpot = randFretStringNums();
    var randPress = paper.circle(fretCoord(1), stringCoord(1), RAND_PRESS_RADIUS);

    function playFretboardGuess() {
        infoText.attr({text: NOTE_QUESTION_TEXT, fill: '#000', stroke:"#000", "font-size": INFO_TEXT_FONT_SIZE});
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
            actualNote = (octaveFret + 4) % 12;
        } else if (stringNum === 1) {
            actualNote = (octaveFret + 12) % 12;
        } else if (stringNum === 2) {
            actualNote = (octaveFret + 7) % 12;
        } else if (stringNum === 3) {
            actualNote = (octaveFret + 2) % 12;
        } else if (stringNum === 4) {
            actualNote = (octaveFret + 9) % 12;
        }

        var noteStr = noteUnicodeString(guessNote);

        if (guessNote === actualNote) {
            var noteText = paper.text(randPress.attr('cx'), randPress.attr('cy'), noteStr).attr({fill: '#FFF', stroke: '#FFF', "font-size": RAND_PRESS_RADIUS - (RAND_PRESS_RADIUS / 4)});
            randPress.attr({fill: "green", stroke: "green"});
            infoText.attr({text: noteStr.replace("\n", " / ") + " is correct", fill: 'green', stroke:"green", "font-size": INFO_TEXT_FONT_SIZE})
                .animate({"font-size": INFO_TEXT_FONT_SIZE},
                1100, "linear",
                function() {
                    noteText.remove();
                    playFretboardGuess();
                }
            );
        } else {
            infoText.attr({text: noteStr.replace("\n", " / ") + " is wrong",fill: '#FF0000', stroke:"#FF0000", "font-size": INFO_TEXT_FONT_SIZE});
        }
    }

    $('.notes a').click(function (e) {
        e.preventDefault();
        var note = $(this).data('note');
        processGuess(note, randSpot.fretNum, randSpot.stringNum);

    });

    // MAIN AUDIO
    var audioContext = new webkitAudioContext();
    var tuna = new Tuna(audioContext);

    var AudioBus = function(){
        this.input = audioContext.createGainNode();
        var output = audioContext.createGainNode();

        //create effect nodes (Convolver and Equalizer are other custom effects from the library presented at the end of the article)
        var delay = new tuna.Delay({
            feedback: 0,    //0 to 1+
            delayTime: 0,    //how many milliseconds should the wet signal be delayed?
            wetLevel: 0,    //0 to 1+
            dryLevel: 0,       //0 to 1+
            cutoff: 22050,        //cutoff frequency of the built in highpass-filter. 20 to 22050
            bypass: 1000
        });
        var convolver = new tuna.Convolver();
        var compressor = new tuna.Compressor({
            threshold: 0,    //-100 to 0
            makeupGain: 1,     //0 and up
            attack: 1,         //0 to 1000
            release: 0,        //0 to 3000
            ratio: 1,          //1 to 20
            knee: 5,           //0 to 40
            automakeup: true,  //true/false
            bypass: 0
        });
        var compressor = new tuna.Compressor({
            threshold: 0,    //-100 to 0
            makeupGain: 400,     //0 and up
            attack: 1,         //0 to 1000
            release: 3000,        //0 to 3000
            ratio: 20,          //1 to 20
            knee: 40,           //0 to 40
            automakeup: true,  //true/false
            bypass: 0
        });
        var cabinet = new tuna.Cabinet({
            makeupGain: 1,                                 //0 to 20
            impulsePath: "impulses/impulse_guitar.wav",    //path to your speaker impulse
            bypass: 0
        });

        //route ‘em
        //equalizer -> delay -> convolver
        this.input.connect(delay.input);
        delay.connect(cabinet.input);
        cabinet.connect(output);


        this.connect = function(target){
            output.connect(target);
        };
    };

    // AUDIO STUFF
    var bus = new AudioBus();
    var instrument1 = audioContext.createOscillator();

    function playNote(fretNum, stringNum) {
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

        // set instrument frequencies and instant play
        instrument1.frequency.value = 523.25;

        //connect our instruments to the same bus
        instrument1.connect(bus.input);

        bus.input.gain.value = 0.005;
        bus.connect(audioContext.destination);
        instrument1.start(0);
    }
    playNote();
});