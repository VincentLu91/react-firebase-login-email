import { useEffect, useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Signin from "./components/Signin";
import { auth } from "./firebase";
import { UserContext, UserProvider } from "./UserContext";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/"; //src/redux/index.js

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
            <Route path="**" element={<Home />} />
          </Routes>
          {/*</UserProvider>*/}
        </Router>
      </div>
    </Provider>
  );
}

export default App;
