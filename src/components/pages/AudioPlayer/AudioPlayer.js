import { useEffect, useState, useRef } from "react";
import song from "./src_Suncrown - Legend of the Forgotten Centuries.mp3";
import Slider from "./components/slider/Slider";
import ControlPanel from "./components/controls/ControlPanel";
import { useDispatch, useSelector } from "react-redux";
import db, { storage, auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { setCurrentUser } from "../../../redux/user/actions";

function AudioPlayer() {
  const dispatch = useDispatch();
  const transcriptionText = useSelector(
    (state) => state.languageReducer.transcriptionText
  );
  const sound = useSelector((state) => state.recordingReducer.sound);
  const [percentage, setPercentage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("authUser is: ", authUser); // uid
      if (authUser) {
        dispatch(setCurrentUser(authUser));
        //loadRecordings(authUser);
      }
    });

    return unsubscribe;
  }, [sound]);

  const audioRef = useRef();

  const onChange = (e) => {
    const audio = audioRef.current;
    audio.currentTime = (audio.duration / 100) * e.target.value;
    setPercentage(e.target.value);
  };

  const play = () => {
    const audio = audioRef.current;
    audio.volume = 0.1;

    if (!isPlaying) {
      setIsPlaying(true);
      audio.play();
    }

    if (isPlaying) {
      setIsPlaying(false);
      audio.pause();
    }
  };

  const getCurrDuration = (e) => {
    const percent = (
      (e.currentTarget.currentTime / e.currentTarget.duration) *
      100
    ).toFixed(2);
    const time = e.currentTarget.currentTime;

    setPercentage(+percent);
    setCurrentTime(time.toFixed(2));
  };

  return (
    <div className="audioplayer-body">
      <div className="audioplayer-container">
        <h1>Audio Player</h1>
        <h1>Lol: {sound.transcript}</h1>
        <Slider percentage={percentage} onChange={onChange} />
        <audio
          ref={audioRef}
          onTimeUpdate={getCurrDuration}
          onLoadedData={(e) => {
            setDuration(e.currentTarget.duration.toFixed(2));
          }}
          src={song}
        ></audio>
        <ControlPanel
          play={play}
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
}

export default AudioPlayer;
