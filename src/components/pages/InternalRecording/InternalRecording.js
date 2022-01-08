import { useReactMediaRecorder } from "react-media-recorder";
import * as React from "react";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateRecordingList,
  setCurrentSoundRecording,
  setCurrentPlayingStatus,
  setRecording,
  setIsRecording,
  setRecordURI,
  setRecordingDuration,
} from "../../../redux/recording/actions";
import moment from "moment";
import getBlobDuration from "get-blob-duration";
import db, { storage } from "../../../firebase";
import { uploadBytes, ref } from "firebase/storage";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import withAuth from "../../withAuth";
import { auth } from "../../../firebase";
import { setCurrentUser } from "../../../redux/user/actions";
import RecordRTC, { StereoAudioRecorder, MediaStreamRecorder } from "recordrtc";
import { io } from "socket.io-client";

const InternalRecording = () => {
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    previewAudioStream,
  } = useReactMediaRecorder({ audio: true }); // could also put video and screen props as true!
  // the useReactMediaRecorder call above allows me to record both screen audio and microphone.
  // for example, it could record audio from a YouTube video I am watching while I am speaking on the microphone.
  // so this is a capable audio recorder in which it records not just the microphone, but also sounds inside the computer
  // see this for reference:
  // https://github.com/VincentLu91/react-firebase-login-email/blob/ffe985d000cab213c74eb24fc299a4743544a406/src/components/pages/InternalRecording/InternalRecording.js
  console.log("previewAudioStream is: ", previewAudioStream);
  const socketRef = useRef();

  const [filename, setFilename] = React.useState("");
  const [media, setMedia] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const dispatch = useDispatch();
  const recordingList = useSelector(
    (state) => state.recordingReducer.recordingList
  );
  //const recording = useSelector((state) => state.recordingReducer.recording);
  const isRecording = useSelector(
    (state) => state.recordingReducer.isRecording
  );
  const recordURI = useSelector((state) => state.recordingReducer.recordURI);
  const currentUser = useSelector((state) => state.user.currentUser);
  console.log("Internal Recording CurrentUser: ", currentUser);
  console.log("Internal Recording isRecording: ", isRecording);
  console.log("Firebase storage object: ", storage._bucket);

  let recorder;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log(authUser); // uid
      if (authUser) {
        dispatch(setCurrentUser(authUser));
        //navigate("/home");
      }
    });

    return unsubscribe;
  }, []);

  const uploadAudio = async (audioData) => {
    //const uriParts = recordURI.split(".");
    const uriParts = mediaBlobUrl.split(".");
    const fileType = uriParts[uriParts.length - 1];
    const fileName =
      //audioData.filename + "_" + currentUser + `${Date.now()}.${fileType}`;
      audioData.filename + "_" + currentUser.uid + `${Date.now()}.${fileType}`;
    audioData.originalFilename = fileName;
    console.log("FILE NAME", fileName);
    audioData.fileName = fileName;

    //delete filename
    delete audioData.filename;

    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          try {
            resolve(xhr.response);
          } catch (error) {
            console.log("error:", error);
          }
        };
        xhr.onerror = (e) => {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", mediaBlobUrl, true);
        xhr.send(null);
      });
      if (blob != null) {
        // storage
        //   .child(fileName)
        //   .put(blob, {
        //     contentType: `audio/${fileType}`,
        //   })
        //   .then(() => {
        //     console.log("Sent!");
        //     db.collection("recordings").add(audioData);
        //   })
        //   .catch((e) => console.log("error:", e));
        // 'file' comes from the Blob or File API
        const storageRef = ref(storage, fileName);
        uploadBytes(storageRef, blob).then((snapshot) => {
          const docRef = addDoc(
            //collection(db, `customers/${userContext.user.uid}/checkout_sessions`),
            //collection(db, `customers/${user.uid}/checkout_sessions`),
            collection(db, `recordings/${currentUser.uid}/files`),
            audioData
          );
          console.log("snapshot is: ", snapshot);
        });
      } else {
        console.log("erroor with blob");
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const startRecordingAudio = async () => {
    await startRecording();
    // call transcription function later
    //startTranscribing();
    // dispatch(setIsRecording(true));
  };

  useEffect(() => {
    const createSocket = async () => {
      const response = await fetch("http://localhost:5000/");
      const data = await response.json();
      console.log("DATOKEN", data);
      if (data.error) {
        alert(data.error);
      }

      const { token } = data;

      // establish wss with AssemblyAI (AAI) at 16000 sample rate
      socketRef.current = io(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
        //"http://localhost:5000/"
      );

      const texts = {};

      socketRef.current.on("disconnect", () => {
        //console.log("error event useEffect is: ", event);
        //console.log("e in useEffect is: ", e);
        console.log("Got disconnected, need to try connecting again");
        socketRef.current.connect();
      });
      socketRef.current.on("receiving audio data", (message) => {
        //alert("Entering onmessage");
        console.log("onsocket message is: ", message);
        let msg = "";
        //const res = JSON.parse(message.data);
        const res = message.data;
        texts[res.audio_start] = res.text;
        const keys = Object.keys(texts);
        keys.sort((a, b) => a - b);
        for (const key of keys) {
          if (texts[key]) {
            msg += ` ${texts[key]}`;
          }
        }
        console.log("Leaving onmessage. msg is: ", msg);
        setTranscript(msg);
      });

      /*socketRef.current.onerror = (event) => {
        console.error("error event is: ", event);
        socketRef.current.close();
      };*/
      socketRef.current.on("connect", () => {
        console.log("socket is opened");
        console.log(socketRef.current.id);
      });
    };
    createSocket();
  }, []);

  useEffect(() => {
    if (status === "recording" && previewAudioStream !== null) {
      startTranscribing();
    }
    //console.log("transcribing status is: ", status);
    //console.log("transcribing previewAudioStream is: ", previewAudioStream);
  }, [status, previewAudioStream]);

  const startTranscribing = async () => {
    //console.log("transcribing status is: ", status);
    //console.log("transcribing previewAudioStream is: ", previewAudioStream);
    //return;
    /*const response = await fetch("http://localhost:5000/");
    const data = await response.json();
    console.log("DATOKEN", data);
    if (data.error) {
      alert(data.error);
    }

    const { token } = data;

    // establish wss with AssemblyAI (AAI) at 16000 sample rate
    socketRef.current = await new WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
    );

    // handle incoming messages to display transcription to the DOM
    const texts = {};
    socketRef.current.onmessage = (message) => {
      alert("Entering onmessage");
      alert("onsocket message is: ", message);
      let msg = "";
      const res = JSON.parse(message.data);
      texts[res.audio_start] = res.text;
      const keys = Object.keys(texts);
      keys.sort((a, b) => a - b);
      for (const key of keys) {
        if (texts[key]) {
          msg += ` ${texts[key]}`;
        }
      }
      alert("Leaving onmessage. msg is: ", msg);
      setTranscript(msg);
    };

    socketRef.current.onerror = (event) => {
      console.error(event);
      socketRef.current.close();
    };*/

    /*socketRef.current.onclose = (event) => {
      console.log(event);
      socketRef.current = null;
    };*/

    //socketRef.current.onopen = () => {
    //alert("trying to transcribe");
    // once socket is open, begin recording
    //messageEl.style.display = "";
    /*console.log(
        "mediaDevices is: ",
        navigator.mediaDevices.getUserMedia({ audio: true })
      );*/
    console.log("status is: ", status);

    recorder = RecordRTC(previewAudioStream, {
      type: "audio",
      mimeType: "audio/webm;codecs=pcm", // endpoint requires 16bit PCM audio
      recorderType: StereoAudioRecorder, // or MediaStreamRecorder
      timeSlice: 250, // set 250 ms intervals of data that sends to AAI
      //sampleRate: 16000,
      desiredSampRate: 16000,
      numberOfAudioChannels: 2, // real-time requires only one channel
      bufferSize: 4096,
      //audioBitsPerSecond: 128000,
      ondataavailable: (blob) => {
        console.log("trying to read blob: ", blob);
        const reader = new FileReader();
        reader.onload = () => {
          const base64data = reader.result;
          console.log("socket is: ", socketRef.current);
          console.log("base64data is: ", base64data);
          // audio data must be sent as a base64 encoded string
          if (socketRef.current) {
            socketRef.current.emit(
              /*JSON.stringify({
                audio_data: base64data.split("base64,")[1],
              })*/
              "sending audio data",
              {
                audio_data: base64data.split("base64,")[1],
              }
            );
          }
        };
        reader.readAsDataURL(blob);
      },
    });

    recorder.startRecording();
    /*navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          alert("entering stream");
          console.log("Stream is: ", stream);*/
    /*recorder = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm;codecs=pcm", // endpoint requires 16bit PCM audio
            recorderType: StereoAudioRecorder, // or MediaStreamRecorder
            timeSlice: 250, // set 250 ms intervals of data that sends to AAI
            desiredSampRate: 16000,
            numberOfAudioChannels: 1, // real-time requires only one channel
            bufferSize: 4096,
            audioBitsPerSecond: 128000,
            ondataavailable: (blob) => {
              alert("trying to read blob"); // this is not firing
              const reader = new FileReader();
              reader.onload = () => {
                const base64data = reader.result;

                // audio data must be sent as a base64 encoded string
                if (socket) {
                  alert("socket is: ", socket);
                  socket.send(
                    JSON.stringify({
                      audio_data: base64data.split("base64,")[1],
                    })
                  );
                }
              };
              reader.readAsDataURL(blob);
            },
          });

          recorder.startRecording();*/
    //})
    //.catch((err) => console.error("navigator mediaDevice err is: ", err));
    //};
  };

  async function stopRecordingAudio() {
    stopRecording();
    // call transcription function later
    //dispatch(setRecordURI(mediaBlobUrl));
    dispatch(setIsRecording(false));
  }

  function extractFilename(filepath) {
    let arraypath = filepath.split("/");
    let filename = arraypath[arraypath.length - 1];
    /*if (global.socket) {
      global.socket.onclose = (event) => {
        console.log(event);
        global.socket = null;
      };
      //socket.close(); // not necessary since we have the onclose() event
    }*/
    return filename;
  }

  async function renameRecord() {
    if (!filename && filename.length < 1) {
      alert("Filename can not be empty!");
      return;
    }
    setRecordURI(mediaBlobUrl);

    const durationSeconds = await getBlobDuration(mediaBlobUrl); // or it could just be mediaBlobUrl
    const durationMillis = durationSeconds * 1000;
    console.log("durationSeconds is: ", durationSeconds);
    const momentduration = moment.duration(durationMillis);
    let duration = moment
      .utc(momentduration.as("milliseconds"))
      .format("HH:mm:ss");
    if (momentduration.hours() === 0) {
      duration = moment.utc(momentduration.as("milliseconds")).format("mm:ss");
    }
    const recordingdate = moment().format("MMMM Do YYYY");
    const newRecordingList = [...recordingList];
    newRecordingList.push({
      filepath: mediaBlobUrl,
      filename,
      recordingdate: recordingdate,
      duration: duration,
      //duration: durationSeconds,
      transcript: transcript,
    });

    //newRecordingList.reverse()   //sorting
    //props.setRecordinglistProp(newRecordingList);
    dispatch(updateRecordingList(newRecordingList));
    console.log("In Internal Recording, currentUser is: ", currentUser);
    const audioData = {
      //user: currentUser,
      user: currentUser.uid,
      filename,
      recordingdate: recordingdate,
      duration: duration,
      //duration: durationSeconds,
      transcript: transcript,
    };
    uploadAudio(audioData);

    // Reset the field
    setFilename("");
    dispatch(setRecordURI(null));
    alert("entered...");

    // We can go to library tab
    //navigation.navigate("Library");
  }

  function renderView() {
    if (status === "recording" || status === "idle") {
      // while recording or not recording yet
      return (
        <div>
          <p>{status}</p>
          <button onClick={startRecordingAudio}>Start Recording</button>
          <button onClick={stopRecordingAudio}>Stop Recording</button>
          {/*<video src={mediaBlobUrl} controls autoPlay loop />*/}
          <video src={mediaBlobUrl} controls />
          <br />
          <p>Any transcripts?</p>
          <p>{transcript}</p>
        </div>
      );
    }
    if (status === "stopped") {
      // finished recording
      return (
        <div>
          {/*<TextInput
            placeholder="audio name"
            onChangeText={(text) => setFilename(text)}
            style={{ borderWidth: 1, padding: 8, height: 45, width: 180 }}
          />*/}
          <p>{mediaBlobUrl}</p>
          <p>recordURI is: {recordURI}</p>
          <input
            value={filename}
            name="filename"
            onChange={(e) => setFilename(e.target.value)}
          />
          <button onClick={renameRecord}>Rename</button>
        </div>
      );
    }
  }

  return (
    <div
      style={{
        flexDirection: "row",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {renderView()}
    </div>
  );
};

export default withAuth(InternalRecording);
