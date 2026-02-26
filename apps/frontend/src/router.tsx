import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import DashboardPage from "@/features/dashboard/DashboardPage";
import InstancesPage from "@/features/instances/InstancesPage";
import WorkflowsPage from "@/features/workflows/WorkflowsPage";
import SettingsPage from "@/features/settings/SettingsPage";
import LoginPage from "@/features/auth/LoginPage";
import { InternalChatPage } from "@/features/internalChat";
import { SandboxPage } from "@/features/chat/pages/SandboxPage";


export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/chat",
    element: <InternalChatPage />,
  },
  {
    path: "/chat/sandbox",
    element: <SandboxPage />,
  },
  {
    path: "/",
    element: <MainLayout />, // Auth temporarily disabled for development
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "instances",
        element: <InstancesPage />,
      },
      {
        path: "workflows",
        element: <WorkflowsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
