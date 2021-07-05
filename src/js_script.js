inlets = 3;

function log() {
  for (var i = 0; i < arguments.length; i++) {
    const message = arguments[i];
    if (
      message &&
      message.toString &&
      message.toString() !== "[object Object]"
    ) {
      post(message.toString());
    } else {
      post(JSON.stringify(message));
    }
    post(" | ");
  }
  post("\n");
}

function LiveElement(path) {
  this.element = new LiveAPI(path);
  this.info = this.element.info;
  this.path = JSON.parse(this.element.path);
  this.get = function (attribute) {
    return JSON.parse(this.element.get(attribute));
  };
}
LiveElement.prototype.getRelativeitem = function (path) {
  return new LiveElement(JSON.parse(this.element.path) + " " + path);
};
LiveElement.prototype.createClip = function () {
  return new Clip(this.path);
};

function Clip(path) {
  this.element = new LiveAPI(path);
}
Clip.prototype.getLength = function () {
  return this.element.get("length");
};
Clip.prototype.getNotes = function (
  startTime,
  timeRange,
  startPitch,
  pitchRange
) {
  if (!startTime) startTime = 0;
  if (!timeRange) timeRange = this.getLength();
  if (!startPitch) startPitch = 0;
  if (!pitchRange) pitchRange = 128;
  var data = this.element.call(
    "get_notes",
    startTime,
    startPitch,
    timeRange,
    pitchRange
  );
  return this._parseNotes(data);
};
Clip.prototype._parseNotes = function (notes) {
  const notesArray = [];
  for (var i = 2; i <= notes.length - 2; i += 6) {
    const note = new Note(
      notes[i + 1],
      notes[i + 2],
      notes[i + 3],
      notes[i + 4],
      notes[i + 5]
    );
    notesArray.push(note);
  }
  return notesArray;
};
Clip.prototype.setNotes = function (notes) {
  var element = this.element;
  element.call("set_notes");
  element.call("notes", notes.length);
  notes.forEach(function (note) {
    element.call(
      "note",
      note.pitch,
      note.start.toFixed(2),
      note.duration.toFixed(2),
      note.velocity,
      note.muted
    );
  });
  element.call("done");
};

function Note(pitch, start, duration, velocity, muted) {
  this.pitch = pitch;
  this.start = start;
  this.duration = duration;
  this.velocity = velocity;
  this.muted = muted;
}
Note.prototype.toString = function () {
  return (
    "{pitch:" +
    this.pitch +
    ", start:" +
    this.start +
    ", duration:" +
    this.duration +
    ", velocity:" +
    this.velocity +
    ", muted:" +
    this.muted +
    "}"
  );
};

var currentTrack = new LiveElement("this_device canonical_parent");

function getFirstEmptyClipSlot() {
  var i = 0;
  while (i < 20) {
    const currentSlot = currentTrack.getRelativeitem("clip_slots " + i);
    const slotHasClip = currentSlot.get("has_clip");
    if (!slotHasClip) {
      return currentSlot;
    }
    i++;
  }
}

function fromTheInternet() {
  post("hello from the internet");
  const slot = getFirstEmptyClipSlot();
  const t = slot.element.call("create_clip", "16");
  post(t);
}

var messageHandlerMap = {
  createChordProgression: createChordProgression,
  fromTheInternet: fromTheInternet,
};

function input(messageType, messageContent) {
  if (messageContent) {
    const parsedContent = JSON.parse(messageContent);
    if (messageHandlerMap[messageType]) {
      messageHandlerMap[messageType](parsedContent);
    }
  }
}
