import { useEffect, useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Signin from "./components/Signin";
import BlogPage from "./components/pages/blog1";
import Plan1 from "./components/pages/plan1";
import Plan2 from "./components/pages/plan2";
import Plan3 from "./components/pages/plan3";
import Plan4 from "./components/pages/plan4";
import { auth } from "./firebase";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store, { persistor } from "./redux/"; //src/redux/index.js
import { PersistGate } from "redux-persist/integration/react";
import AudioPlayer from "./components/pages/AudioPlayer/AudioPlayer";
import AudioRecording from "./components/pages/AudioRecording/AudioRecording";
import InternalRecording from "./components/pages/InternalRecording/InternalRecording";
import Transcribe from "./components/pages/Transcribe/Transcribe";
import SystemAudio from "./components/pages/SystemAudio/SystemAudio";
import Library from "./components/pages/Library.js/Library";

function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      const user = {
        uid: userAuth?.uid,
        email: userAuth?.email,
      };
      if (userAuth) {
        console.log(userAuth);
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="App">
          <Router>
            {/*<UserProvider>*/}
            {/*{user ? <Home /> : <Signin />}*/}
            <Routes>
              <Route path="/" element={<Signin />} />
              <Route path="/home" element={<Home />} />
              <Route path="/blog1" element={<BlogPage />} />
              <Route path="/plan1" element={<Plan1 />} />
              <Route path="/plan2" element={<Plan2 />} />
              <Route path="/plan3" element={<Plan3 />} />
              <Route path="/plan4" element={<Plan4 />} />
              <Route path="/audioplayer" element={<AudioPlayer />} />
              <Route path="/audiorecording" element={<AudioRecording />} />
              <Route
                path="/internalrecording"
                element={<InternalRecording />}
              />
              <Route path="/transcribe" element={<Transcribe />} />
              <Route path="/systemaudio" element={<SystemAudio />} />
              <Route path="/library" element={<Library />} />
              <Route path="**" element={<Home />} />
            </Routes>
            {/*</UserProvider>*/}
          </Router>
        </div>
      </PersistGate>
    </Provider>
  );
}

export default App;
