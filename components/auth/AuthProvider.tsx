'use client';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initFirebase } from '@/lib/firebase';

type AuthContextType = {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (email: string, password: string, displayName?: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { auth } = useMemo(() => initFirebase(), []);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => {
			setUser(u);
			setLoading(false);
		});
		return () => unsub();
	}, [auth]);

	async function login(email: string, password: string) {
		await signInWithEmailAndPassword(auth, email, password);
	}
	async function signup(email: string, password: string, displayName?: string) {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		if (displayName) {
			await updateProfile(cred.user, { displayName });
		}
	}
	async function logout() {
		await signOut(auth);
	}

	const value: AuthContextType = { user, loading, login, signup, logout };
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

