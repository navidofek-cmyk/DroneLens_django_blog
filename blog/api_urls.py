from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

urlpatterns = [
    # Auth — dj-rest-auth (registrace + ověření emailu + reset hesla)
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/registration/", include("dj_rest_auth.registration.urls")),
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
