import { useReactMediaRecorder } from "react-media-recorder";
import * as React from "react";
import { useEffect } from "react";
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

const InternalRecording = () => {
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true }); // could also put video and screen props as true!

  const [filename, setFilename] = React.useState("");
  const [media, setMedia] = React.useState("");
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
    startRecording();
    // call transcription function later
    // dispatch(setIsRecording(true));
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
      //transcript: transcript,
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
      //transcript: transcript,
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
