import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import db, { auth } from "../firebase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";

const withAuth = (WrappedComponent) => {
  const WithAuth = (props) => {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState(null);
    const currentUser = useSelector((state) => state.user.currentUser);
    console.log("withAuth Current User: ", currentUser);

    async function getSubscriptionsInfo(user) {
      //if (!userContext.user) return;
      const subscriptionsRef = collection(
        db,
        //`customers/${userContext.user.uid}/subscriptions`
        `customers/${user.uid}/subscriptions` // why does this not work? update: it works, I had to call this fn in checkAuth()
        //`customers/CvKhT7Q8Ubeo4ImF3qToeJZBEJ22/subscriptions` // why does this work? because it identifies the ID upon useEffect
      );
      const q = query(subscriptionsRef);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((subscription) => {
        console.log("subscription: ", subscription.id, subscription.data());
        setSubscription({
          role: subscription.data().role,
          subscriptionId: subscription.id,
          current_period_start: subscription.data().current_period_start,
          current_period_end: subscription.data().current_period_end,
        });
      });
    }

    async function checkAuth(user) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          const uid = user.uid;
          console.log("The user is authenticated with the uid: ", uid);
          getSubscriptionsInfo(user);
          // ...
        } else {
          // User is signed out
          // ...
          console.log(
            "The user is inauthenticated, redirecting back to signin page"
          );
          navigate("/");
        }
      });
    }

    // create useEffect to track user's subscriptions...
    useEffect(() => {
      checkAuth(currentUser);
    }, []);

    return <WrappedComponent {...props} />;
  };

  /*WithUser.propTypes = {
    online: PropTypes.bool.isRequired,
    getCurrentUser: PropTypes.func.isRequired,
    generateTelnyxJwt: PropTypes.func.isRequired,
    auth: PropTypes.instanceOf(Object).isRequired,
    organizationStat: PropTypes.instanceOf(Object).isRequired,
  };*/

  return WithAuth;
};

export default withAuth;
