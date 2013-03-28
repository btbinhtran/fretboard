window.App = Ember.Application.create({
    ready: function () {
    }
});

// Routing
App.Router.map(function() {
    this.route("guitar_exercise", { path: "/guitar_exercise" });
});

App.GuitarExerciseRoute = Ember.Route.extend({
    setupController: function(controller, exercise) {
        controller.set('content', exercise);
    }
});

App.GuitarExerciseController = Ember.ObjectController.extend({
    create: function(args) {
        this._super();
    }
});

App.FretboardView = Ember.View.extend({
    didInsertElement: function() {
        var canvasWidth = jQuery(document).width(),
            canvasHeight = jQuery(document).height();
        var guitarExercise = App.GuitarExercise.create({
            paper: Raphael(this.get('elementId'), canvasWidth, canvasHeight),
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
        });
//
        guitarExercise.start();
    },

    mouseEnter: function(event) {
        console.log("Enter dragon");
        console.log(event);
    }
});

// Guitar Exercise class
App.GuitarExercise = Ember.Object.extend({
    oscillator: null,
    paper: null,
    guitar: null,
    infoText: null,
    noteText: null,
    infoTextFontSize: 0,
    notesGamepad: null,
    canvasWidth: 1000,
    canvasHeight: 500,
    randSpot: null,
    randGuitarNote: null,
    randGuitarNoteRadius: 1,
    randGuitarNoteColor: "#FF0000",
    nextNoteDelayMs: 1100,

    init: function () {
        this._super();
//        this.canvasWidth = jQuery(document).width();
//        this.canvasHeight = jQuery(document).height();

        if (this.oscillator === null)
            this.oscillator = T("PluckGen", {wave: "pulse", mul: 0.5});

//        this.paper = Raphael("fretboard", this.canvasWidth, this.canvasHeight);
        this.guitar = App.Guitar.create({
            paper: this.paper,
            oscillator: this.oscillator,
            y: this.canvasHeight / 20.0
        });
        var self = this;

        // Create notes gamepad
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
        ].reverse();

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
        ].reverse();

        var rOut = (this.canvasHeight * 0.26) * 0.85;

        this.randGuitarNoteRadius = (this.guitar.fretWidth / 2.0) - ((this.guitar.fretWidth / 2.0) / 2.0);
        this.infoTextFontSize = 40 * (1 - (40 / this.guitar.fretboardWidth));
        this.infoText = this.paper.text(this.canvasWidth / 2.0, this.guitar.y + this.guitar.fretboardWidth + (this.guitar.fretboardWidth / 8.0), "   ")
            .attr({fill: "#000", stroke: "none", "font-size": this.infoTextFontSize});

        // Create notes gamepad
        this.notesGamepad = App.NotesGamepad.create({
            paper: this.paper,
            outNotes: outerNotes,
            inNotes: innerNotes,
            cx: this.canvasWidth / 2.0,
            cy: (this.canvasHeight / 2.0) + (this.canvasHeight / 8.0),
            rOut: rOut,
            rIn: rOut / 2,
            wheelTextFontSize: 20 * (1 - (20 / this.guitar.fretboardWidth))
        });

        jQuery.each(this.notesGamepad.buttons, function (indexInArray, button) {
            button.click(function () {
                self.makeGuess(button.value, self.randSpot.fretNum, self.randSpot.stringNum);
            })
        });

        // make settings
        $("#settings").hover("")
    },

    randFretStringNums: function () {
        return {
            fretNum: Math.floor(Math.random() * (this.guitar.frets + 1)),
            stringNum: Math.floor(Math.random() * this.guitar.strings.length)
        };
    },

    playRandomGuitarNote: function () {
        this.randSpot = this.randFretStringNums();
        if (this.randGuitarNote) this.randGuitarNote.remove();
        if (this.noteText) this.noteText.remove();

        this.guitar.playGuitarNoteSound(this.randSpot.fretNum, this.randSpot.stringNum);
        this.randGuitarNote = this.paper.circle(this.guitar.fretCoord(this.randSpot.fretNum), this.guitar.stringCoord(this.randSpot.stringNum) + 1, this.randGuitarNoteRadius)
            .attr({fill: this.randGuitarNoteColor, stroke: this.randGuitarNoteColor});
        this.infoText.attr({text: "Guess the note pressed on string " + (this.randSpot.stringNum + 1) + " fret " + this.randSpot.fretNum, fill: "#000", stroke: "none", "font-size": this.infoTextFontSize});
    },

    makeGuess: function (guessNote, fretNum, stringNum) {
        var stringNote = Note.fromLatin(this.guitar.strings[stringNum]),
            actualNoteValue = (fretNum + stringNote.numValue()) % 12,
            guessNoteStr = Note.unicodeString(guessNote),
            self = this;

        if (guessNote === actualNoteValue) {
            this.noteText = this.paper.text(this.randGuitarNote.attr('cx'), this.randGuitarNote.attr('cy'), guessNoteStr)
                .attr({fill: '#FFF', stroke: '#FFF', "font-size": this.randGuitarNoteRadius - (this.randGuitarNoteRadius / 4)});
            this.randGuitarNote.attr({fill: "green", stroke: "green"});
            this.infoText.attr({text: guessNoteStr.replace("\n", " / ") + " is right", fill: 'green', stroke: "green", "font-size": this.infoTextFontSize})
                .animate({"font-size": this.infoTextFontSize},
                this.nextNoteDelayMs, "linear",
                function () {
                    self.guitar.interval.timeout = 0;
                    self.guitar.interval.on("ended", function () {
                        self.playRandomGuitarNote();
                    });
                });
        } else {
            this.infoText.attr({text: guessNoteStr.replace("\n", " / ") + " is wrong", fill: '#FF0000', stroke: "#FF0000", "font-size": this.infoTextFontSize});
        }
    },

    start: function () {
        this.guitar.drawFretboard();
        this.playRandomGuitarNote();
    }
});

App.NotesGamepad = Ember.Object.extend({
    paper: null,
    cx: 0,
    cy: 0,
    rad: Math.PI / 180,
    outNotes: null,
    inNotes: null,
    rIn: 50,
    rOut: 100,
    buttons: null,
    txtStrokeColor: "#000",
    wheelTextFontSize: 20,

    init: function () {
        this._super();
        this.buttons = this.paper.set();

        // Create outer buttons
        var outAngle = 50,
            inAngle = 25,
            outTotal = 0,
            inTotal = 0,
            outStart = 0,
            inStart = 0,
            self = this;

        var createOutButton = function (j) {
            var outNote = self.outNotes[j],
                outAngleplus = 360 * outNote.percent / outTotal,
                outPopangle = outAngle + (outAngleplus / 2),
                outSectorPad = 52 * (1 - (52 / (self.rOut * 2))),
                ms = 0,
                bcolor = outNote.bgColor,
                p = self.outerSector(self.cx, self.cy, self.rOut, self.rIn, outAngle, outAngle + outAngleplus, {fill: bcolor, stroke: self.txtStrokeColor, "stroke-width": 3}),
                txt = self.paper.text(self.cx + (self.rOut - outSectorPad) * Math.cos(-outPopangle * self.rad), self.cy + (self.rOut - outSectorPad) * Math.sin(-outPopangle * self.rad), outNote.label).attr({fill: self.txtStrokeColor, stroke: self.txtStrokeColor, "font-size": self.wheelTextFontSize}),
                pieceMouseOver = function () {
                    p.stop().animate({transform: "s1.05 1.05 " + (self.cx) + " " + (self.cy)}, ms, "linear");
                    txt.stop().animate({transform: "s1.05 1.05 " + (self.cx) + " " + (self.cy)}, ms, "linear");
                },
                pieceMouseOut = function () {
                    p.stop().animate({transform: ""}, ms, "linear");
                    txt.stop().animate({transform: ""}, ms, "linear");
                };

            // attach piece event listeners
            var button = self.paper.set();
            button.push(p, txt);
            button.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
            button.value = outNote.value;

            // Update Angles
            outAngle += outAngleplus;
            outStart += 0.1;

            return button;
        };

        for (var i = 0, outNotesSize = this.outNotes.length; i < outNotesSize; i++)
            outTotal += this.outNotes[i].percent;
        for (i = 0; i < outNotesSize; ++i)
            this.buttons.push(createOutButton(i));

        // Create inner buttons
        var createInButton = function (j) {
            var inNote = self.inNotes[j],
                inAngleplus = 360 * inNote.percent / inTotal,
                inPopangle = inAngle + (inAngleplus / 2),
                inSectorPad = 35 * (1 - (35 / (self.rOut * 2))),
                ms = 0,
                bcolor = inNote.bgColor;

            if (inNote.value !== -1) {
                var p = self.innerSector(self.cx, self.cy, self.rIn, inAngle, inAngle + inAngleplus, {fill: bcolor, stroke: self.txtStrokeColor, "stroke-width": 3}),
                    txt = self.paper.text(self.cx + (self.rIn - inSectorPad) * Math.cos(-inPopangle * self.rad), self.cy + (self.rIn - inSectorPad) * Math.sin(-inPopangle * self.rad), inNote.label).attr({fill: self.txtStrokeColor, stroke: self.txtStrokeColor, "font-size": self.wheelTextFontSize});
                var pieceMouseOver = function () {
                        p.stop().animate({transform: "s1.05 1.05 " + (self.cx) + " " + (self.cy)}, ms, "linear");
                        txt.stop().animate({transform: "s1.05 1.05 " + (self.cx) + " " + (self.cy)}, ms, "linear");
                    },
                    pieceMouseOut = function () {
                        p.stop().animate({transform: ""}, ms, "linear");
                        txt.stop().animate({transform: ""}, ms, "linear");
                    };

                // attach piece event listeners
                var button = self.paper.set();
                button.push(p, txt);
                button.mouseover(pieceMouseOver).mouseout(pieceMouseOut);
                button.value = inNote.value;
            }
            inAngle += inAngleplus;
            inStart += .1;

            return button;
        };

        for (var i = 0, inNotesSize = this.inNotes.length; i < inNotesSize; i++)
            inTotal += this.inNotes[i].percent;
        for (i = 0; i < inNotesSize; ++i)
            this.buttons.push(createInButton(i));
    },

    innerSector: function (cx, cy, r, startAngle, endAngle, params) {
        var rad = Math.PI / 180;

        var x1 = cx + r * Math.cos(-startAngle * rad),
            x2 = cx + r * Math.cos(-endAngle * rad),
            y1 = cy + r * Math.sin(-startAngle * rad),
            y2 = cy + r * Math.sin(-endAngle * rad);
        return this.paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
    },

    outerSector: function (cx, cy, rOut, rIn, startAngle, endAngle, params) {
        var rad = Math.PI / 180;

        var x1 = cx + rOut * Math.cos(-startAngle * rad),
            x2 = cx + rOut * Math.cos(-endAngle * rad),
            y1 = cy + rOut * Math.sin(-startAngle * rad),
            y2 = cy + rOut * Math.sin(-endAngle * rad),
            xx1 = cx + rIn * Math.cos(-startAngle * rad),
            xx2 = cx + rIn * Math.cos(-endAngle * rad),
            yy1 = cy + rIn * Math.sin(-startAngle * rad),
            yy2 = cy + rIn * Math.sin(-endAngle * rad);

        return this.paper.path(["M", xx1, yy1,
            "L", x1, y1,
            "A", rOut, rOut, 0, +(endAngle - startAngle > 180), 0, x2, y2,
            "L", xx2, yy2,
            "A", rIn, rIn, 0, +(endAngle - startAngle > 180), 1, xx1, yy1, "Z"]
        ).attr(params);
    }
});

// Guitar class that utilizes Raphael paper
App.Guitar = Ember.Object.extend({
    strings: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'], // standard tuning from 1st to 6th string
    frets: 24,
    paper: null,
    oscillator: null,
    interval: null,
    fretboardBgColor: "#000",
    fretboardStrokeColor: "#000",
    fretboardWidth: 0,
    fretboardHeight: 0,
    fretWidth: 0,
    fretBarWidth: 2,
    fretBarColor: "silver",
    fretMarkColor: "#FFF",
    fretMarkRadius: 0,
    nutWidth: 4,
    stringPad: 0,
    x: 0,
    y: 10,

    init: function () {
        this._super();
        this.fretboardWidth = this.paper.height * 0.26;
        this.fretboardHeight = this.paper.width * 0.90;
        this.fretWidth = this.fretboardHeight / this.frets;
        this.stringPad = this.fretboardWidth / this.strings.length;
        this.fretMarkRadius = this.stringPad * 0.25;
        this.x = ((this.paper.width - this.fretboardHeight) / 2) - 5;
    },

    fretCoord: function (fretNum) {
        return this.x + this.nutWidth
            + ((this.fretWidth * fretNum) - (this.fretWidth / 2.0) - (this.fretBarWidth / 2.0));
    },

    stringCoord: function (stringNum) {
        return (stringNum * this.stringPad) + this.y + (this.fretboardWidth / 12.0) - 2;
    },

    drawFretboard: function () {
        var halfFretboardWidth = this.fretboardWidth / 2.0;
        var fretBg = this.paper.rect(this.x + this.nutWidth, this.y, this.fretboardHeight, this.fretboardWidth)
            .attr({fill: this.fretboardBgColor, stroke: this.fretboardStrokeColor});

        // draw fret lines
        var vertLineHeight = this.stringPad * this.strings.length;
        var vertLine = this.paper.rect(this.x, this.y, this.fretBarWidth * 4, vertLineHeight)
            .attr({fill: "#FFF"});
        var fretBars = this.frets + 1;
        for (var i = 1; i < fretBars; ++i) {
            vertLine = this.paper.rect((i * this.fretWidth) + this.x - this.fretBarWidth + this.nutWidth, this.y, this.fretBarWidth, vertLineHeight)
                .attr({fill: this.fretBarColor, stroke: this.fretBarColor});
        }

        // draw strings
        for (var i = 0; i < this.strings.length; ++i) {
            var horLine = this.paper.rect(this.x, this.stringCoord(i), this.fretboardHeight + this.nutWidth, i + 1)
                .attr({"fill": "#AAAAAA", "stroke": "#888888"});
        }

        // draw markers
        // first octave markers
        var mark = null;
        for (var fret = 3; fret <= 9 && fret <= this.frets; fret += 2) {
            mark = this.paper.circle(this.fretCoord(fret), this.y + halfFretboardWidth, this.fretMarkRadius)
                .attr({fill: this.fretMarkColor, stroke: this.fretMarkColor});

        }

        // draw special double dot octave markers
        for (var fret = 12; fret <= this.frets; fret *= 2) {
            mark = this.paper.circle(this.fretCoord(fret), this.y + halfFretboardWidth - this.stringPad, this.fretMarkRadius)
                .attr({fill: this.fretMarkColor, stroke: this.fretMarkColor});
            mark = this.paper.circle(this.fretCoord(fret), this.y + halfFretboardWidth + this.stringPad, this.fretMarkRadius)
                .attr({fill: this.fretMarkColor, stroke: this.fretMarkColor});
        }

        // draw second octave
        for (var fret = 15; fret <= 21 && fret <= this.frets; fret += 2) {
            mark = this.paper.circle(this.fretCoord(fret), this.y + halfFretboardWidth, this.fretMarkRadius)
                .attr({fill: this.fretMarkColor, stroke: this.fretMarkColor});

        }
    },

    playGuitarNoteSound: function (fretNum, stringNum) {
        var stringNote = Note.fromLatin(this.strings[stringNum]),
            openStringOctave = stringNote.octave(),
            actualNote = stringNote.numValue() + fretNum,
            correctOctave = openStringOctave + Math.floor(actualNote / 12.0),
            note = Note.fromLatin(Note.unicodeString(actualNote % 12, true) + correctOctave),
            self = this;

//        this.oscillator.noteOnWithFreq(note.frequency(), 100);
//        this.oscillator.play();
        if (this.interval) {
            this.interval.timeout = 0;
        }
        this.interval = T("interval", {interval: 2000},function (count) {
            self.oscillator.noteOnWithFreq(note.frequency(), 100).play();
        }).start();

        return;
    }
});


