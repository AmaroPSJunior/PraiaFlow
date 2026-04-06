import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ClientView from './components/ClientView';
import AdminView from './components/AdminView';
import WaiterView from './components/WaiterView';
import StaffView from './components/StaffView';
import Login from './components/Login';
import Home from './components/Home';
import { ThemeProvider } from './lib/ThemeContext';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { UserProfile } from './types';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<'admin' | 'waiter' | 'staff' | 'client' | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Check for mock user first
    const mockUserStr = localStorage.getItem('mock_user');
    const mockProfileStr = localStorage.getItem('mock_profile');
    
    if (mockUserStr && mockProfileStr) {
      setUser(JSON.parse(mockUserStr));
      setProfile(JSON.parse(mockProfileStr));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Force admin role for master email
        if (u.email === 'arcamos.j@gmail.com') {
          const adminProfile: UserProfile = { 
            uid: u.uid, 
            email: u.email || '', 
            role: impersonatedRole || 'admin',
            displayName: u.displayName || 'Admin'
          };
          setProfile(adminProfile);
          // Also ensure admin is in Firestore
          await setDoc(doc(db, 'users', u.uid), adminProfile, { merge: true });
        } else {
          // Fetch profile to check role for others
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Check for pending dev role
            const pendingRole = sessionStorage.getItem('pendingDevRole') as any;
            const role = pendingRole || 'client';
            const email = u.isAnonymous ? `${role}_dev@restaurante.com` : (u.email || '');
            
            const newProfile: UserProfile = { 
              uid: u.uid, 
              email: email, 
              role: role,
              displayName: u.displayName || email.split('@')[0] || 'User'
            };
            
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
            sessionStorage.removeItem('pendingDevRole');
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [impersonatedRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <p className="text-sky-600 dark:text-sky-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Home / Choice Screen */}
        <Route path="/" element={<Home user={user} />} />

        {/* Client Routes */}
        <Route path="/mesa/:tableId" element={<ClientView user={user} profile={profile} />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={user && profile?.role === 'admin' ? <AdminView onImpersonate={setImpersonatedRole} impersonatedRole={impersonatedRole} /> : <Login isAdmin user={user} profile={profile} />} 
        />

        {/* Waiter Routes */}
        <Route 
          path="/waiter" 
          element={user && profile?.role === 'waiter' ? <WaiterView user={user} profile={profile} /> : <Login isWaiter user={user} profile={profile} />} 
        />

        {/* Staff Routes */}
        <Route 
          path="/staff" 
          element={user && profile?.role === 'staff' ? <StaffView user={user} profile={profile} /> : <Login user={user} profile={profile} />} 
        />
        <Route path="/login" element={<Login user={user} profile={profile} />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
