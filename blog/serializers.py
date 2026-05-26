from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Category, Tag, Comment, Photo


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name", "email"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
        ]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Hesla se neshodují."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]
        read_only_fields = ["slug"]

    def get_post_count(self, obj):
        return obj.posts.filter(status="published").count()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ["id", "image", "caption", "order"]


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "content", "created_at", "is_approved"]
        read_only_fields = ["author", "created_at", "is_approved"]


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view."""

    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    photo_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "cover_image",
            "excerpt",
            "category",
            "tags",
            "status",
            "published_at",
            "location",
            "altitude",
            "drone_model",
            "comment_count",
            "photo_count",
        ]

    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()

    def get_photo_count(self, obj):
        return obj.photos.count()


class PostDetailSerializer(PostListSerializer):
    """Full serializer for detail view — includes content, comments, gallery."""

    comments = CommentSerializer(many=True, read_only=True, source="approved_comments")
    photos = PhotoSerializer(many=True, read_only=True)

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "content",
            "comments",
            "photos",
            "created_at",
            "updated_at",
        ]


class PostWriteSerializer(serializers.ModelSerializer):
    """Used for create/update."""

    tags_input = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = Post
        fields = [
            "title",
            "cover_image",
            "content",
            "excerpt",
            "category",
            "status",
            "published_at",
            "location",
            "altitude",
            "drone_model",
            "tags_input",
        ]

    def _handle_tags(self, post, tags_input):
        post.tags.clear()
        if tags_input:
            for name in [t.strip() for t in tags_input.split(",") if t.strip()]:
                tag, _ = Tag.objects.get_or_create(name=name)
                post.tags.add(tag)

    def create(self, validated_data):
        from django.utils import timezone

        tags_input = validated_data.pop("tags_input", "")
        post = Post(**validated_data)
        post.author = self.context["request"].user
        if post.status == Post.STATUS_PUBLISHED and not post.published_at:
            post.published_at = timezone.now()
        post.save()
        self._handle_tags(post, tags_input)
        return post

    def update(self, instance, validated_data):
        from django.utils import timezone

        tags_input = validated_data.pop("tags_input", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if instance.status == Post.STATUS_PUBLISHED and not instance.published_at:
            instance.published_at = timezone.now()
        instance.save()
        if tags_input is not None:
            self._handle_tags(instance, tags_input)
        return instance
