import React, { useState, useEffect, useContext } from 'react'
import db, { auth } from '../firebase'
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore";
import './Home.css';
import { UserContext } from '../UserContext';
import {loadStripe} from '@stripe/stripe-js';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const {user} = useContext(UserContext);

    async function getSubscriptionsInfo() {
        const subscriptionsRef = collection(db, `customers/${user.uid}/subscriptions`);
        const q = query(subscriptionsRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(subscription => {
            console.log("subscription: ", subscription.data());
            setSubscription({
                role: subscription.data().role,
                current_period_start: subscription.data().current_period_start,
                current_period_end: subscription.data().current_period_end
            })
        })
    }

    // create useEffect to track user's subscriptions...
    useEffect(() => {
        getSubscriptionsInfo();
    }, []);

    async function getProductsDisplay() {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where("active", "==", true));
        const querySnapshot = await getDocs(q);
        console.log(querySnapshot);
        const products = {};
        querySnapshot.forEach(async productDoc => {
            products[productDoc.id] = productDoc.data();
            //const priceSnapshotList = query(collectionGroup(db, 'prices'));
            const priceSnapshotList = query(collection(db, `products/${productDoc.id}/prices`));
            const priceSnapshot = await getDocs(priceSnapshotList);
            priceSnapshot.forEach(priceDoc => {
                products[productDoc.id].prices = {
                    priceId: priceDoc.id,
                    priceData: priceDoc.data()
                }
            })
        });
        console.log("products: ", products);
        console.log('Object entries', Object.entries(products));
        setProducts(products);
    }
    useEffect(() => {
        getProductsDisplay();
    }, []);
    const checkOut = async (priceId) => {
        //alert(priceId);
        const docRef = await addDoc(collection(db, `customers/${user.uid}/checkout_sessions`), {
                price: priceId,
		        success_url: window.location.origin,
		        cancel_url: window.location.origin,
            });
        onSnapshot(docRef, async(snap) => {
            const {error, sessionId} = snap.data();
		    if (error) {
			    alert(error.message)
		    }
		    if (sessionId) {
			    const stripe = await loadStripe("pk_test_51Jx1cdLBlaDAR7THzsOatgkQk8OYrYzoeZzljbQTVZvd8rcGrlrWxqmDxuLtA2waXPYnOHBIlxjWI4PMjjF8Otxa00naRp98mK");
			    stripe.redirectToCheckout({ sessionId });
		    }
        })
    }
    return (
        <div>
            <h1>Welcome home</h1>
            <p><button onClick={() => /*auth.signOut()*/ signOut(auth)}>Sign out</button></p>
            {Object.entries(products).map(([productId, productData]) => {
                const isCurrentPlan = productData?.name?.toLowerCase().includes(subscription?.role)
                return (
                    <div className="plans" key={productId}>
                        <div>{productData.name} - {productData.description}</div>
                        {/*<button disabled={isCurrentPlan} onClick={() => checkOut("price_1K1c9ULBlaDAR7THFHK0A5pi")}>*/}
                        <button disabled={isCurrentPlan} onClick={() => checkOut(productData.prices.priceId)}>
                            Subscribe
                        </button>
                        {console.log("ProductData Price: ",productData.prices)}
                    </div>
                )
            })}
        </div>
    )
}

export default Home