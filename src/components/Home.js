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

const Home = () => {
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  async function getSubscriptionsInfo() {
    const subscriptionsRef = collection(
      db,
      `customers/${user.uid}/subscriptions`
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

  // create useEffect to track user's subscriptions...
  useEffect(() => {
    getSubscriptionsInfo();
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

  const clearSubscriptions = async () => {
    const docsToDelete = query(
      collection(db, `customers/${user.uid}/subscriptions`)
    );
    const deleteQuerySnapshot = await getDocs(docsToDelete);
    deleteQuerySnapshot.forEach(async (docSnapshot) => {
      await deleteDoc(docSnapshot.ref);
    });
  };

  const checkOut = async (priceId) => {
    //alert(priceId);
    const docRef = await addDoc(
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
    setLoading(true);
    const { data } = await axios.post(
      "http://localhost:8080/stripe/switch-plans",
      {
        stripeSubscriptionId: currentSubscriptionId,
        newPriceId: newPriceId,
      }
    );
    setSubscription(null);
    await getSubscriptionsInfo();
    setLoading(false);
  };

  const cancelPlan = async (currentSubscriptionId) => {
    setLoading(true);
    await axios.post("http://localhost:8080/stripe/cancel-subscription", {
      stripeSubscriptionId: currentSubscriptionId,
    });
    setSubscription(null);
    await getSubscriptionsInfo();
    setLoading(false);
  };

  console.log(
    subscription ? subscription.subscriptionId : "No subscription data"
  );
  console.log(products);
  return (
    <div>
      <h1>Welcome home</h1>
      <p>
        <button
          className="logout"
          onClick={() => /*auth.signOut()*/ signOut(auth)}
        >
          Sign out
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
                    : checkOut(productData.prices.priceId)
                }
              >
                {!isCurrentPlan ? "Switch Plan" : "Subscribed"}
              </button>
              {isCurrentPlan && (
                <button onClick={() => cancelPlan(subscription.subscriptionId)}>
                  Cancel
                </button>
              )}
              {console.log("ProductData Price: ", productData.prices)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
