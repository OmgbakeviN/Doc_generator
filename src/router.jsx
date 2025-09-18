// on configure notre routeur
import { createBrowserRouter, redirect } from "react-router-dom";
import Catalog from "./pages/Catalog";
import RootLayout from "./layouts/RootLayout";
import NotFound from "./pages/NotFound";
import UploadAndFix from "./pages/UploadAndFix";
import Preview from "./pages/Preview";

export const router = createBrowserRouter([
    { path: "/", loader: () => redirect("/app") },
    {
        path: "/app",
        element: <RootLayout />,
        children: [
            { index: true, element: <Catalog /> },
            { path: "fill/:templateId", element: <UploadAndFix /> },
            { path: "preview/:templateId", element: <Preview /> },
        ],
    },
    { path: "*", element: <NotFound /> },
]);