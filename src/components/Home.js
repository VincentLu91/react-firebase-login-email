import React, { useState, useEffect, useCallback } from "react";
import db, { auth } from "../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import "./Home.css";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import AuthComponent from "./layout";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
//import { setSound } from "../redux/recording/actions";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(false);
  async function getSubscriptionsInfo(user) {
    const subscriptionsRef = collection(
      db,
      `customers/${user.uid}/subscriptions`
    );
    const q = query(subscriptionsRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((subscription) => {
      setSubscription({
        role: subscription.data().role,
        subscriptionId: subscription.id,
        current_period_start: subscription.data().current_period_start,
        current_period_end: subscription.data().current_period_end,
      });
    });
  }

  const checkAuth = useCallback(
    async (user) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          getSubscriptionsInfo(user);
        } else {
          // User is signed out
          navigate("/");
        }
      });
    },
    [navigate]
  );

  // create useEffect to track user's subscriptions...
  useEffect(() => {
    checkAuth(currentUser);
  }, [checkAuth, currentUser]);

  async function getProductsDisplay() {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);
    const products = {};
    querySnapshot.forEach(async (productDoc) => {
      products[productDoc.id] = productDoc.data();
      const priceSnapshotList = query(
        collection(db, `products/${productDoc.id}/prices`)
      );
      const priceSnapshot = await getDocs(priceSnapshotList);
      priceSnapshot.forEach((priceDoc) => {
        products[productDoc.id].prices = {
          priceId: priceDoc.id,
          priceData: priceDoc.data(),
        };
      });
    });
    setProducts(products);
  }
  useEffect(() => {
    getProductsDisplay();
  }, []);

  const clearSubscriptions = async () => {
    const docsToDelete = query(
      //collection(db, `customers/${userContext.user.uid}/subscriptions`)
      collection(db, `customers/${currentUser.user.uid}/subscriptions`),
      where("status", "==", "canceled")
    );
    const deleteQuerySnapshot = await getDocs(docsToDelete);
    console.log("deleteQuerySnapshot: ", deleteQuerySnapshot);
    for (const docSnapshot of deleteQuerySnapshot.docs) {
      console.log("deleteQuerySnapshot.docs is: ", deleteQuerySnapshot.docs);
      await deleteDoc(docSnapshot.ref);
    }
  };

  // have no subscription
  const checkOut = async (priceId) => {
    const docRef = await addDoc(
      collection(db, `customers/${currentUser.user.uid}/checkout_sessions`),
      {
        price: priceId,
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      }
    );
    onSnapshot(docRef, async (snap) => {
      const { error, sessionId } = snap.data();
      if (error) {
        alert(error.message);
      }
      if (sessionId) {
        const stripe = await loadStripe(
          "pk_test_51Jx1cdLBlaDAR7THzsOatgkQk8OYrYzoeZzljbQTVZvd8rcGrlrWxqmDxuLtA2waXPYnOHBIlxjWI4PMjjF8Otxa00naRp98mK"
        );
        stripe.redirectToCheckout({ sessionId });
      }
    });
  };

  //Stripe APIs
  const switchPlan = async (currentSubscriptionId, newPriceId) => {
    await checkAuth(currentUser);
    setLoading(true);
    try {
      const functions = getFunctions();
      const addMessage = httpsCallable(functions, "stripeSwitchPlans");
      console.log(currentUser);
      addMessage({
        stripeSubscriptionId: currentSubscriptionId,
        newPriceId: newPriceId,
        customerId: currentUser.uid,
      }).then((result) => {
        // Read result of the Cloud Function.
        /** @type {any} */
        const data = result.data;
        console.log(data);
      });

      // await axios.post(
      //   //"https://us-central1-audio-example-expo.cloudfunctions.net/stripeSwitchPlans", // this is to be replaced by ngrok, otherwise use localhost link below
      //   "http://localhost:8080/stripe/switch-plans",
      //   {
      //     stripeSubscriptionId: currentSubscriptionId,
      //     newPriceId: newPriceId,
      //   }
      // );
    } catch (error) {
      console.log(error);
      alert("Failed");
    }
    setSubscription(null);
    await checkAuth(currentUser);
    //clearSubscriptions();
    setLoading(false);
    //window.location.reload(true); // workaround for screen refresh
  };

  const cancelPlan = async (currentSubscriptionId) => {
    await checkAuth(currentUser);
    setLoading(true);
    await axios.post("http://localhost:8080/stripe/cancel-subscription", {
      stripeSubscriptionId: currentSubscriptionId,
    });
    setSubscription(null);
    await checkAuth(currentUser);
    setLoading(false);
    window.location.reload(true);
  };

  return (
    <AuthComponent>
      <div>
        <h1>Welcome home</h1>
        <p>
          <button
            className="logout"
            onClick={() => {
              signOut(auth);
              //dispatch(setSound(null));
              dispatch({ type: "SIGNED_OUT" });
            }}
          >
            Sign out
          </button>
          <button onClick={() => navigate("/blog1")}>Go to Blog1</button>
          <br />
          <button onClick={() => navigate("/plan1")}>Go to Plan1</button>
          <button onClick={() => navigate("/plan2")}>Go to Plan2</button>
          <br />
          <button onClick={() => navigate("/plan3")}>Go to Plan3</button>
          <button onClick={() => navigate("/plan4")}>Go to Plan4</button>
          <br />
          <button onClick={() => navigate("/audioplayer")}>AudioPlayer</button>
          <button onClick={() => navigate("/audiorecording")}>
            AudioRecording
          </button>
          <br />
          <button onClick={() => navigate("/internalrecording")}>
            InternalRecording (which works on audio recording too)
          </button>
          <button onClick={() => navigate("/library")}>Library</button>
        </p>
        {loading && (
          <div>
            <img src="/assets/img/loader.svg" alt="loader"></img>
          </div>
        )}
        <div className="plans-container">
          {Object.entries(products).map(([productId, productData]) => {
            const isCurrentPlan = productData?.name
              ?.toLowerCase()
              .includes(subscription?.role);
            return (
              <div className="plans" key={productId}>
                <div>
                  {productData.name} - {productData.description}
                </div>
                <button
                  className={
                    isCurrentPlan && "subscribed" ? "subscribed" : null
                  }
                  disabled={isCurrentPlan}
                  onClick={() =>
                    subscription?.role
                      ? isCurrentPlan
                        ? undefined
                        : switchPlan(
                            subscription.subscriptionId,
                            productData.prices.priceId
                          )
                      : checkOut(productData.prices.priceId)
                  }
                >
                  {subscription?.role
                    ? isCurrentPlan
                      ? "Subscribed"
                      : "Switch Plan"
                    : "Buy Plan"}
                </button>
                {isCurrentPlan && (
                  <button
                    onClick={() => cancelPlan(subscription.subscriptionId)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AuthComponent>
  );
};

export default Home;
