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
import store from "./redux/"; //src/redux/index.js
import AudioPlayer from "./components/pages/AudioPlayer/AudioPlayer";
import AudioRecording from "./components/pages/AudioRecording/AudioRecording";

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
            <Route path="**" element={<Home />} />
          </Routes>
          {/*</UserProvider>*/}
        </Router>
      </div>
    </Provider>
  );
}

export default App;
