from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import api_views

urlpatterns = [
    # Auth
    path("auth/register/", api_views.RegisterView.as_view(), name="api-register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="api-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="api-refresh"),
    path("auth/me/", api_views.MeView.as_view(), name="api-me"),
    # Posts
    path("posts/", api_views.PostListCreateView.as_view(), name="api-posts"),
    path("posts/my/", api_views.MyPostsView.as_view(), name="api-my-posts"),
    path(
        "posts/<slug:slug>/", api_views.PostDetailView.as_view(), name="api-post-detail"
    ),
    path(
        "posts/<slug:slug>/comments/",
        api_views.CommentListCreateView.as_view(),
        name="api-comments",
    ),
    path(
        "posts/<slug:slug>/photos/",
        api_views.PhotoUploadView.as_view(),
        name="api-photos",
    ),
    # Photos
    path(
        "photos/<int:pk>/", api_views.PhotoDeleteView.as_view(), name="api-photo-delete"
    ),
    # Categories & Tags
    path("categories/", api_views.CategoryListView.as_view(), name="api-categories"),
    path("tags/", api_views.TagListView.as_view(), name="api-tags"),
]
