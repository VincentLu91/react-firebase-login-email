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
import { setCurrentUser } from "../../../redux/user/actions";

const Library = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [cloudRecordingList, setCloudRecordingList] = React.useState([]);

  const downloadAudio = async (fileName) => {
    const uri = await storage.child(fileName).getDownloadURL();
    return uri;
  };

  // this is to check for the userID upon page refresh in the event it gets wiped out.
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

  async function loadRecordings() {
    const recordingRef = collection(db, `recordings/${currentUser.uid}/files`);
    const recordingRefQuery = query(
      recordingRef,
      where("user", "==", currentUser.uid)
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
    loadRecordings();
  }, [cloudRecordingList.length]);

  return (
    <div>
      <h2>List of recordings and transcriptions</h2>
      <ul>
        {["a", "b", "c"].map(function (item) {
          return <li key={item}>{item}</li>;
        })}
      </ul>
    </div>
  );
};

export default Library;
