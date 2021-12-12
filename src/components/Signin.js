import React, { useRef, useContext, useEffect } from "react";
import { auth } from "../firebase";
import "./Signin.css";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { UserContext } from "../UserContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../redux/user/actions";

const Signin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const { state: user, update: updateUser } = useContext(UserContext);
  console.log(user);
  const passwordRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log(authUser); // uid
      if (authUser) {
        dispatch(setCurrentUser(authUser));
        navigate("/home");
      }
    });

    return unsubscribe;
  }, []);

  const signUp = (e) => {
    e.preventDefault();
    /*auth.*/ createUserWithEmailAndPassword(
      auth,
      emailRef.current.value,
      passwordRef.current.value
    )
      .then((user) => {
        console.log(user);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const signIn = (e) => {
    e.preventDefault();
    /*auth.*/ signInWithEmailAndPassword(
      auth,
      emailRef.current.value,
      passwordRef.current.value
    )
      .then((userData) => {
        console.log(userData);

        //updateUser({ ...user, user: userData.user });
        //navigate("/home");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="signin">
      <form action="">
        <h1>Sign in</h1>
        <input ref={emailRef} type="email" />
        <input ref={passwordRef} type="password" />
        <button onClick={signIn}>Sign in </button>
        <h6>
          Not yet register?{" "}
          <span onClick={signUp} className="signin__link">
            Sign up
          </span>
        </h6>
      </form>
    </div>
  );
};

export default Signin;
