
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export interface Address {
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
}

export interface Purchase {
    id: string;
    items: any[];
    total: number;
    status: 'toPay' | 'toShip' | 'toReceive' | 'completed' | 'cancelled' | 'returnRefund';
    date: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system';
    date: string;
    isRead: boolean;
}

type UserContextType = {
    user: User | null;
    profile: any | null;
    addresses: Address[];
    purchases: Purchase[];
    notifications: Notification[];
    loading: boolean;
    isAuthenticating: boolean;
    authMessage: string;
    addAddress: (address: Omit<Address, 'id'>) => void;
    updateAddress: (id: string, address: Partial<Address>) => void;
    deleteAddress: (id: string) => void;
    setDefaultAddress: (id: string) => void;
    addPurchase: (purchase: Omit<Purchase, 'id' | 'date' | 'status'>) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'date' | 'isRead'>) => void;
    clearNotifications: () => void;
    updatePurchaseStatus: (id: string, status: Purchase['status']) => void;
    signOut: () => Promise<void>;
    setAuthTransition: (isAuthenticating: boolean, message?: string) => void;
};

const UserContext = createContext<UserContextType>({
    user: null,
    profile: null,
    addresses: [],
    purchases: [],
    notifications: [],
    loading: true,
    isAuthenticating: false,
    authMessage: "",
    addAddress: () => { },
    updateAddress: () => { },
    deleteAddress: () => { },
    setDefaultAddress: () => { },
    addPurchase: () => { },
    addNotification: () => { },
    clearNotifications: () => { },
    updatePurchaseStatus: () => { },
    signOut: async () => { },
    setAuthTransition: () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authMessage, setAuthMessage] = useState("");
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const resetState = () => {
        setAddresses([]);
        setPurchases([]);
        setNotifications([]);
        setProfile(null);
    };

    const restoreState = async (userId: string | undefined, userEmail: string | undefined) => {
        setAddresses([
            {
                id: '1',
                label: 'Home',
                firstName: 'Juan',
                lastName: 'Dela Cruz',
                address: '123 Malakas St, Brgy. Pinyahan',
                city: 'Quezon City',
                postalCode: '1100',
                isDefault: true
            }
        ]);
        setNotifications([
            {
                id: '1',
                title: 'Welcome to ANEC Global!',
                message: 'Complete your profile to get the most out of our shopping experience.',
                type: 'system',
                date: new Date().toISOString(),
                isRead: false
            }
        ]);

        // Fetch Profile for Role Check
        if (userId) {
            console.log("Fetching profile for UUID:", userId);
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn("Profile fetch error detail:", {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
            }

            if (profileData) {
                console.log("✅ Profile found in schema 'bpm-anec-global':", profileData);
                setProfile(profileData);
            } else {
                // If no profile exists, they are just a customer
                console.log("❌ No profile record found for this UUID in 'bpm-anec-global'.");
                setProfile({ role: 'customer' });
            }
        }
    };

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user ?? null;
            setUser(user);
            if (user) {
                await restoreState(user.id, user.email);
            } else {
                resetState();
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user ?? null;
            setUser(user);

            if (user) {
                await restoreState(user.id, user.email);
            } else {
                resetState();
            }

            // Clear authenticating state on auth change
            setIsAuthenticating(false);
            setAuthMessage("");
        });

        return () => subscription.unsubscribe();
    }, []);



    const addAddress = (address: Omit<Address, 'id'>) => {
        const newAddress = { ...address, id: Math.random().toString(36).substr(2, 9) };
        setAddresses(prev => [...prev, newAddress]);
    };

    const updateAddress = (id: string, updated: Partial<Address>) => {
        setAddresses(prev => prev.map(addr => addr.id === id ? { ...addr, ...updated } : addr));
    };

    const deleteAddress = (id: string) => {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
    };

    const setDefaultAddress = (id: string) => {
        setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: addr.id === id })));
    };

    const addPurchase = (purchase: Omit<Purchase, 'id' | 'date' | 'status'>) => {
        const newPurchase: Purchase = {
            ...purchase,
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            date: new Date().toISOString(),
            status: 'toPay'
        };
        setPurchases(prev => [newPurchase, ...prev]);

        // Add a notification too
        addNotification({
            title: 'Order Placed',
            message: `Your order ${newPurchase.id} has been placed successfully.`,
            type: 'order'
        });
    };

    const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'isRead'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            isRead: false
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const updatePurchaseStatus = (id: string, status: Purchase['status']) => {
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status } : p));

        if (status === 'cancelled') {
            addNotification({
                title: 'Order Cancelled',
                message: `Your order ${id} has been cancelled.`,
                type: 'order'
            });
        }
    };

    const setAuthTransition = (isAuthenticating: boolean, message?: string) => {
        setIsAuthenticating(isAuthenticating);
        setAuthMessage(message || "");
    };

    const signOut = async () => {
        setAuthTransition(true, "Logging you out...");
        await supabase.auth.signOut();
        setUser(null);
        resetState();
        // The onAuthStateChange listener will eventually set isAuthenticating to false, 
        // but it's good to have it here too in case of immediate redirect
        setAuthTransition(false);
    };

    return (
        <UserContext.Provider value={{
            user,
            profile,
            addresses,
            purchases,
            notifications,
            loading,
            isAuthenticating,
            authMessage,
            addAddress,
            updateAddress,
            deleteAddress,
            setDefaultAddress,
            addPurchase,
            addNotification,
            clearNotifications,
            updatePurchaseStatus,
            signOut,
            setAuthTransition
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
