interface User {
  uid: string;
  displayName: string | null;
}

interface AuthContextValue {
  currentUser: User | null;
}

export function useAuth(): AuthContextValue {
  // This is a mock implementation. Replace with your actual auth logic.
  return {
    currentUser: null
  };
} 