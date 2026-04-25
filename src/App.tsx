import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import SliderListPage from "@/pages/SliderListPage";
import SliderFormPage from "@/pages/SliderFormPage";
import CategoriesListPage from "@/pages/CategoriesListPage";
import CategoryFormPage from "@/pages/CategoryFormPage";
import ArticlesListPage from "@/pages/ArticlesListPage";
import ArticleFormPage from "@/pages/ArticleFormPage";
import SocialListPage from "@/pages/SocialListPage";
import SocialFormPage from "@/pages/SocialFormPage";
import AboutUsPage from "@/pages/AboutUsPage";
import OrganizationalStructurePage from "@/pages/OrganizationalStructurePage";
import ProjectsListPage from "@/pages/ProjectsListPage";
import ProjectFormPage from "@/pages/ProjectFormPage";
import CommentsPage from "@/pages/CommentsPage";
import UsersListPage from "@/pages/UsersListPage";
import UserFormPage from "@/pages/UserFormPage";
import RolesListPage from "@/pages/RolesListPage";
import RoleFormPage from "@/pages/RoleFormPage";
import MembershipRequestsPage from "@/pages/MembershipRequestsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" dir="rtl" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/slider" element={<ProtectedRoute permission="slider.manage"><SliderListPage /></ProtectedRoute>} />
              <Route path="/slider/new" element={<ProtectedRoute permission="slider.manage"><SliderFormPage /></ProtectedRoute>} />
              <Route path="/slider/:id" element={<ProtectedRoute permission="slider.manage"><SliderFormPage /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute permission="categories.manage"><CategoriesListPage /></ProtectedRoute>} />
              <Route path="/categories/new" element={<ProtectedRoute permission="categories.manage"><CategoryFormPage /></ProtectedRoute>} />
              <Route path="/categories/:id" element={<ProtectedRoute permission="categories.manage"><CategoryFormPage /></ProtectedRoute>} />
              <Route path="/articles" element={<ProtectedRoute permission="articles.manage"><ArticlesListPage /></ProtectedRoute>} />
              <Route path="/articles/new" element={<ProtectedRoute permission="articles.manage"><ArticleFormPage /></ProtectedRoute>} />
              <Route path="/articles/:id" element={<ProtectedRoute permission="articles.manage"><ArticleFormPage /></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute permission="social.manage"><SocialListPage /></ProtectedRoute>} />
              <Route path="/social/new" element={<ProtectedRoute permission="social.manage"><SocialFormPage /></ProtectedRoute>} />
              <Route path="/social/:id" element={<ProtectedRoute permission="social.manage"><SocialFormPage /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute permission="about.manage"><AboutUsPage /></ProtectedRoute>} />
              <Route path="/organization" element={<ProtectedRoute permission="organization.manage"><OrganizationalStructurePage /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute permission="projects.manage"><ProjectsListPage /></ProtectedRoute>} />
              <Route path="/projects/new" element={<ProtectedRoute permission="projects.manage"><ProjectFormPage /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute permission="projects.manage"><ProjectFormPage /></ProtectedRoute>} />
              <Route path="/comments" element={<ProtectedRoute permission="comments.moderate"><CommentsPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute permission="users.manage"><UsersListPage /></ProtectedRoute>} />
              <Route path="/membership-requests" element={<ProtectedRoute permission="users.manage"><MembershipRequestsPage /></ProtectedRoute>} />
              <Route path="/users/new" element={<ProtectedRoute permission="users.manage"><UserFormPage /></ProtectedRoute>} />
              <Route path="/users/:id" element={<ProtectedRoute permission="users.manage"><UserFormPage /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute permission={["users.manage", "roles.manage"]}><RolesListPage /></ProtectedRoute>} />
              <Route path="/roles/new" element={<ProtectedRoute permission="roles.manage"><RoleFormPage /></ProtectedRoute>} />
              <Route path="/roles/:id" element={<ProtectedRoute permission="roles.manage"><RoleFormPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
