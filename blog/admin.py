from django.contrib import admin
from .models import Post, Category, Tag, Comment, Photo


class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'published_at', 'location']
    list_filter = ['status', 'category', 'author', 'created_at']
    search_fields = ['title', 'content', 'location']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)
    inlines = [PhotoInline]
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'created_at', 'is_approved']
    list_filter = ['is_approved', 'created_at']
    actions = ['approve_comments']

    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
    approve_comments.short_description = "Schválit vybrané komentáře"


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ['post', 'caption', 'order']
