import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage, SignupPage } from "./pages/AuthPage";
import { FeedPage } from "./pages/FeedPage";
import { PostPage } from "./pages/PostPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PasswordPage } from "./pages/PasswordPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <FeedPage /> },
          { path: "posts/:postId", element: <PostPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/:userId", element: <ProfilePage /> },
          { path: "settings/password", element: <PasswordPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
