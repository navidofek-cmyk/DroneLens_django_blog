from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import Category, Comment, Photo, Post, Tag
from .serializers import (
    CategorySerializer,
    CommentSerializer,
    PhotoSerializer,
    PostDetailSerializer,
    PostListSerializer,
    PostWriteSerializer,
    RegisterSerializer,
    TagSerializer,
    UserSerializer,
)


# ─── Rate throttles ───────────────────────────────────────────────────────────


class LoginRateThrottle(AnonRateThrottle):
    """Max 10 pokusů o přihlášení za minutu z jedné IP."""

    rate = "10/min"


class RegisterRateThrottle(AnonRateThrottle):
    """Max 5 registrací za hodinu z jedné IP."""

    rate = "5/hour"


# ─── Auth ─────────────────────────────────────────────────────────────────────


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]


class MeView(APIView):
    """GET /api/me/ — vrátí přihlášeného uživatele."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── Posts ────────────────────────────────────────────────────────────────────


class PostListCreateView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "location", "author__username"]
    ordering_fields = ["published_at", "created_at", "title"]
    ordering = ["-published_at"]

    def get_queryset(self):
        qs = Post.objects.filter(status=Post.STATUS_PUBLISHED).select_related(
            "author", "category"
        )
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")
        if category:
            qs = qs.filter(category__slug=category)
        if tag:
            qs = qs.filter(tags__slug=tag)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostWriteSerializer
        return PostListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.filter(status=Post.STATUS_PUBLISHED).select_related(
        "author", "category"
    )
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PostWriteSerializer
        return PostDetailSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Nemáte oprávnění."}, status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Nemáte oprávnění."}, status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class MyPostsView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user).order_by("-created_at")


# ─── Comments ─────────────────────────────────────────────────────────────────


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        post = get_object_or_404(Post, slug=self.kwargs["slug"])
        return Comment.objects.filter(post=post, is_approved=True)

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        post = get_object_or_404(Post, slug=self.kwargs["slug"])
        serializer.save(post=post, author=self.request.user)


# ─── Photos ───────────────────────────────────────────────────────────────────


class PhotoUploadView(generics.CreateAPIView):
    serializer_class = PhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post = get_object_or_404(
            Post, slug=self.kwargs["slug"], author=self.request.user
        )
        serializer.save(post=post)


class PhotoDeleteView(generics.DestroyAPIView):
    queryset = Photo.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        photo = self.get_object()
        if photo.post.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Nemáte oprávnění."}, status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


# ─── Categories & Tags ────────────────────────────────────────────────────────


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
