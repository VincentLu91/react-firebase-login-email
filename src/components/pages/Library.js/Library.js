import * as React from "react";
import { useEffect } from "react";
import db, { storage, auth } from "../../../firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { setCurrentUser } from "../../../redux/user/actions";
import { useNavigate } from "react-router-dom";
import { printTranscription } from "../../../redux/language/actions";

const Library = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [cloudRecordingList, setCloudRecordingList] = React.useState([]);

  const downloadAudio = async (fileName) => {
    //const uri = await storage.child(fileName).getDownloadURL();
    //return uri;
    getDownloadURL(ref(storage, fileName));
  };

  // this is to check for the userID upon page refresh in the event it gets wiped out.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log(authUser); // uid
      if (authUser) {
        dispatch(setCurrentUser(authUser));
        loadRecordings(authUser);
        //navigate("/home");
      }
    });

    return unsubscribe;
  }, [cloudRecordingList.length]);

  async function loadRecordings(authUser) {
    const recordingRef = collection(db, `recordings/${authUser.uid}/files`);
    const recordingRefQuery = query(
      recordingRef,
      where("user", "==", authUser.uid)
    );
    const querySnapshot = await getDocs(recordingRefQuery);
    if (querySnapshot) {
      const data = [];
      const audioDownloads = [];
      querySnapshot.forEach(async (documentSnapshot) => {
        if (documentSnapshot.exists) {
          const originalFilename = documentSnapshot.data().originalFilename;
          data.push(documentSnapshot.data());
          audioDownloads.push(downloadAudio(originalFilename));
        }
      });

      Promise.all(audioDownloads).then((res) => {
        setCloudRecordingList(
          data.map((el, i) => {
            return { ...el, filepath: res[i] };
          })
        );
      });
    }
  }

  React.useEffect(() => {
    console.log("Cloud Recording List is: ", cloudRecordingList);
  }, [cloudRecordingList.length]);

  // function to delete a recording:
  async function deleteRecording(filename, authUser) {
    console.log("deleting recording: ", filename);
    const deleteRef = collection(db, `recordings/${authUser.uid}/files`);
    let deleteQuery = query(
      deleteRef,
      where("user", "==", authUser.uid),
      where("originalFilename", "==", filename)
    );
    const querySnapshot = await getDocs(deleteQuery);
    querySnapshot.forEach(async (doc) => {
      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data());
      //doc.ref.delete();
      // delete audio file
      //storage.child(filename).delete();
      //deleteDoc(ref(storage, filename));
      await deleteDoc(doc.ref);
    });
  }

  // will call later
  async function viewContent(transcription) {
    dispatch(printTranscription(transcription));
    navigate("/audioplayer");
  }

  return (
    <div>
      <h2>List of recordings and transcriptions</h2>
      <ul>
        {cloudRecordingList.map(function (item) {
          return (
            <div>
              <li key={item}>{item.fileName}</li>
              <button
                onClick={() => deleteRecording(item.fileName, currentUser)}
              >
                Delete
              </button>
            </div>
          );
        })}
      </ul>
      <h3>The number of recordings is: {cloudRecordingList.length}</h3>
    </div>
  );
};

export default Library;
