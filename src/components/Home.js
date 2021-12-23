import React, { useState, useEffect, useContext } from "react";
import db, { auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import "./Home.css";
import { UserContext } from "../UserContext";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import AuthComponent from "./layout";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

const Home = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);

  // const { state: userContext, update: updateUserContext } =
  //   useContext(UserContext);
  const [loading, setLoading] = useState(false);
  //console.log(userContext);
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
    //console.log("Current user is: ", currentUser);
    checkAuth(currentUser);
    //getSubscriptionsInfo();
  }, []);

  async function getProductsDisplay() {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);
    console.log(querySnapshot);
    const products = {};
    querySnapshot.forEach(async (productDoc) => {
      products[productDoc.id] = productDoc.data();
      //const priceSnapshotList = query(collectionGroup(db, 'prices'));
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
    console.log("products: ", products);
    console.log("Object entries", Object.entries(products));
    setProducts(products);
  }
  useEffect(() => {
    getProductsDisplay();
  }, []);

  const clearSubscriptions = async (user) => {
    const docsToDelete = query(
      //collection(db, `customers/${userContext.user.uid}/subscriptions`)
      collection(db, `customers/${user.uid}/subscriptions`)
    );
    const deleteQuerySnapshot = await getDocs(docsToDelete);
    deleteQuerySnapshot.forEach(async (docSnapshot) => {
      await deleteDoc(docSnapshot.ref);
    });
  };

  const checkOut = async (priceId, user) => {
    //alert(priceId);
    const docRef = await addDoc(
      //collection(db, `customers/${userContext.user.uid}/checkout_sessions`),
      collection(db, `customers/${user.uid}/checkout_sessions`),
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
      const { data } = await axios.post(
        //"https://us-central1-audio-example-expo.cloudfunctions.net/stripeSwitchPlans", // this is to be replaced by ngrok, otherwise use localhost link below
        "http://localhost:8080/stripe/switch-plans",
        {
          stripeSubscriptionId: currentSubscriptionId,
          newPriceId: newPriceId,
        }
      );
    } catch (error) {
      alert("Failed");
    }
    setSubscription(null);
    //await getSubscriptionsInfo();
    await checkAuth(currentUser);
    setLoading(false);
    window.location.reload(); // workaround for screen refresh
  };

  const cancelPlan = async (currentSubscriptionId) => {
    await checkAuth(currentUser);
    setLoading(true);
    await axios.post("http://localhost:8080/stripe/cancel-subscription", {
      stripeSubscriptionId: currentSubscriptionId,
    });
    setSubscription(null);
    //await getSubscriptionsInfo();
    await checkAuth(currentUser);
    setLoading(false);
  };

  console.log(
    subscription ? subscription.subscriptionId : "No subscription data"
  );
  console.log(products);
  return (
    <AuthComponent>
      <div>
        <h1>Welcome home</h1>
        <p>
          <button
            className="logout"
            onClick={() => /*auth.signOut()*/ signOut(auth)}
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
        </p>
        {loading && (
          <div>
            <img src="/assets/img/loader.svg"></img>
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
                {/*<button disabled={isCurrentPlan} onClick={() => checkOut("price_1K1c9ULBlaDAR7THFHK0A5pi")}>*/}
                <button
                  className={isCurrentPlan && "subscribed"}
                  disabled={isCurrentPlan}
                  onClick={() =>
                    !isCurrentPlan
                      ? switchPlan(
                          subscription.subscriptionId,
                          productData.prices.priceId
                        )
                      : checkOut(productData.prices.priceId, currentUser)
                  }
                >
                  {!isCurrentPlan ? "Switch Plan" : "Subscribed"}
                </button>
                {isCurrentPlan && (
                  <button
                    onClick={() => cancelPlan(subscription.subscriptionId)}
                  >
                    Cancel
                  </button>
                )}
                {console.log("ProductData Price: ", productData.prices)}
              </div>
            );
          })}
        </div>
      </div>
    </AuthComponent>
  );
};

export default Home;
