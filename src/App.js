import { useEffect, useState } from "react";
import "./App.css";
import Home from "./components/Home";
import Signin from "./components/Signin";
import { auth } from "./firebase";
import { UserContext } from "./UserContext";
import { BrowserRouter } from "react-router-dom";
import { Route } from "react-router-dom";

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
      <BrowserRouter>
        <UserContext.Provider value={{ user }}>
          {user ? <Home /> : <Signin />}
          {/*<PrivateRoute path="/" component={Home} />
          <Route path="/login" component={Signin} />
  <Router path="**" component={Signin}/>*/}
        </UserContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
