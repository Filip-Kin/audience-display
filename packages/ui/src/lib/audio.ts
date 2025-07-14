import { Sound } from "svelte-sound";

import abort_wav from "../assets/audio/abort.wav";
import matchEnd_wav from "../assets/audio/end.wav";
import matchStart_wav from "../assets/audio/start.wav";
import endgameWarning_wav from "../assets/audio/warning.wav";
import teleopStart_wav from "../assets/audio/resume.wav";
import ready_wav from "../assets/audio/ready.wav";

const matchStartSound = new Sound(matchStart_wav);
const endgameWarningSound = new Sound(endgameWarning_wav);
const matchEndSound = new Sound(matchEnd_wav);
const teleopStartSound = new Sound(teleopStart_wav);
const abortSound = new Sound(abort_wav, { volume: 0.5 });
const matchReadySound = new Sound(ready_wav);

export const playMatchStartSound = () => {
  matchStartSound.play();
};

export const playAutoEndSound = () => {
  matchEndSound.play();
};

export const playEndgameWarning = () => {
  endgameWarningSound.play();
};

export const playMatchEndSound = () => {
  matchEndSound.play();
};

export const playTeleopStartSound = () => {
  teleopStartSound.play();
};

export const playAbortSound = () => {
  abortSound.play();
};

export const playMatchReadySound = () => {
  matchReadySound.play();
};

export const playSound = (sound: string) => {
  if (sound === "matchStart") {
    playMatchStartSound();
  } else if (sound === "autoEnd") {
    playAutoEndSound();
  } else if (sound === "endgameWarning") {
    playEndgameWarning();
  } else if (sound === "matchEnd") {
    playMatchEndSound();
  } else if (sound === "teleopStart") {
    playTeleopStartSound();
  } else if (sound === "matchAbort") {
    playAbortSound();
  } else if (sound === "matchReady") {
    playMatchReadySound();
  } else if (sound === "timeoutWarning") {
    playEndgameWarning();
  } else if (sound === "timeoutEnd") {
    playMatchEndSound();
  }
};
