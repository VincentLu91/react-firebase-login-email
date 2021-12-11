import { useEffect, useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Signin from "./components/Signin";
import { auth } from "./firebase";
import { UserContext } from "./UserContext";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

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
    <div className="App">
      <Router>
        <UserContext.Provider value={{ user }}>
          {/*{user ? <Home /> : <Signin />}*/}
          <Routes>
            <Route path="/" element={<Signin />} />
            <Route path="/home" element={<Home />} />
            <Route path="**" element={<Home />} />
          </Routes>
        </UserContext.Provider>
      </Router>
    </div>
  );
}

export default App;
