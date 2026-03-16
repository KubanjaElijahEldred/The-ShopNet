"use client";

import Link from "next/link";
import { useState } from "react";
import { AddProductForm } from "@/components/forms/AddProductForm";
import { ProfileContactForm } from "@/components/forms/ProfileContactForm";
import { ProductCard } from "@/components/ProductCard";

type UserData = {
    id: string;
    name: string;
    email: string;
    location: string;
    mobileNumber: string;
    profileImage: string;
    shippingAddress: string;
    role?: string;
};

type ProductData = {
    id: string;
    ownerId: string;
    title: string;
    category: string;
    price: number;
    frontImage: string;
    description: string;
    size: string;
    rating: number;
    stock: number;
    sideImage: string;
    backImage: string;
    createdAt: string;
    updatedAt?: string;
};

export function ProfileClientView({ 
    user, 
    myProducts, 
    wishlistItems 
}: { 
    user: UserData, 
    myProducts: ProductData[], 
    wishlistItems: ProductData[] 
}) {
    const [activeTab, setActiveTab] = useState<"account" | "products" | "wishlist">("account");

    return (
        <div className="profile-layout" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            
            {/* Top Navigation Cards */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button 
                    onClick={() => setActiveTab("account")} 
                    className={`button ${activeTab === "account" ? "" : "button-secondary"}`}
                    style={{ flex: 1 }}
                >
                    Account Info
                </button>
                <button 
                    onClick={() => setActiveTab("wishlist")} 
                    className={`button ${activeTab === "wishlist" ? "" : "button-secondary"}`}
                    style={{ flex: 1 }}
                >
                    My Wishlist ({wishlistItems.length})
                </button>
                <button 
                    onClick={() => setActiveTab("products")} 
                    className={`button ${activeTab === "products" ? "" : "button-secondary"}`}
                    style={{ flex: 1 }}
                >
                    My Products ({myProducts.length})
                </button>
            </div>

            {/* Account Tab */}
            {activeTab === "account" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <section className="stack-card">
                        <span className="eyebrow">Account</span>
                        <h1>{user.name}</h1>
                        <p>{user.email} {user.role === 'admin' ? <span style={{ background: '#e58e26', borderRadius: '4px', padding: '2px 6px', color: '#fff', fontSize: '0.8rem', marginLeft: '10px'}}>Admin</span> : null}</p>
                        <p>Location: {user.location}</p>
                        <p>Mobile number: {user.mobileNumber || "Not added yet"}</p>
                        
                        {user.profileImage && (
                            <img src={user.profileImage} alt={user.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px' }} />
                        )}
                        
                        <p>Shipping address: {user.shippingAddress || "Not added yet"}</p>
                        <p className="muted">Your location helps ShopNet estimate delivery and checkout totals.</p>

                        <div className="inline-actions">
                            <Link href="/products" className="button button-secondary">Browse products</Link>
                            <Link href="/orders" className="button button-secondary">Order history</Link>
                            {user.role === "admin" && (
                                <Link href="/admin/dashboard" className="button" style={{ background: "#257942" }}>Admin Dashboard</Link>
                            )}
                            <form action="/api/auth/logout" method="POST">
                                <button className="button button-secondary" type="submit" style={{ color: "var(--danger)" }}>Logout</button>
                            </form>
                        </div>
                    </section>

                    <ProfileContactForm
                        mobileNumber={user.mobileNumber}
                        profileImage={user.profileImage}
                        shippingAddress={user.shippingAddress}
                    />
                </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <AddProductForm />
                    <section className="stack-card">
                        <span className="eyebrow">Your products</span>
                        <h2>Items you have listed</h2>
                        {myProducts.length === 0 ? (
                        <p className="muted">You have not added any products yet.</p>
                        ) : (
                        <div className="owner-products">
                            {myProducts.map((product) => (
                            <article key={product.id} className="owner-product">
                                <img src={product.frontImage} alt={product.title} />
                                <div>
                                <h3>{product.title}</h3>
                                <p>{product.category}</p>
                                <p>UGX {product.price.toLocaleString()}</p>
                                </div>
                            </article>
                            ))}
                        </div>
                        )}
                    </section>
                </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
                <section className="stack-card">
                    <span className="eyebrow">Wishlist</span>
                    <h2>Saved products</h2>
                    <p className="muted">Keep products you want to revisit later, just like larger marketplaces.</p>
                    
                    <div className="product-grid" style={{ marginTop: "20px" }}>
                        {wishlistItems.length === 0 ? (
                            <p className="muted">You have not saved any products yet.</p>
                        ) : (
                            wishlistItems.map((product) => (
                                <ProductCard key={product.id} product={{ ...product, rating: 5 }} />
                            ))
                        )}
                    </div>
                </section>
            )}

        </div>
    );
}
