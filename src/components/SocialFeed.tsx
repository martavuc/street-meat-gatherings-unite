import React, { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { socialAPI, authAPI, Post, User, PickupLocation } from "@/lib/api";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";

interface SocialFeedProps {
  currentUserId?: number;
  locationFilter?: string;
  onLocationChange?: (location: string) => void;
}

const SocialFeed: React.FC<SocialFeedProps> = ({
  currentUserId,
  locationFilter = "all",
  onLocationChange,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load current user if logged in
      if (currentUserId) {
        const user = await authAPI.getCurrentUser();
        setCurrentUser(user);
      }

      // Load pickup locations
      const locations = await authAPI.getPickupLocations();
      setPickupLocations(locations);

      // Load posts
      await loadPosts();
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, toast]);

  const loadPosts = useCallback(async () => {
    try {
      const postsData = await socialAPI.getPosts(locationFilter === "all" ? undefined : locationFilter);
      // Filter out user profile posts from the feed
      const feedPosts = postsData.filter(post => !post.content.startsWith("USER_PROFILE:"));
      setPosts(feedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    }
  }, [locationFilter, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  const handleCreatePost = async (content: string, postLocationFilter?: string) => {
    if (!currentUserId) return;

    try {
      setIsCreatingPost(true);
      await socialAPI.createPost(content, postLocationFilter);
      
      // Refresh posts to show the new one
      await loadPosts();
      
      toast({
        title: "Success",
        description: "Your post has been created!",
      });
    } catch (error) {
      console.error("Failed to create post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!currentUserId) return;

    try {
      await socialAPI.likePost(postId);
      // Refresh posts to update like counts
      await loadPosts();
    } catch (error) {
      console.error("Failed to toggle post like:", error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCommentOnPost = async (postId: number, content: string) => {
    if (!currentUserId) return;

    try {
      await socialAPI.createComment(postId, content);
      
      // Refresh posts to show the new comment
      await loadPosts();
      
      toast({
        title: "Success",
        description: "Your comment has been posted!",
      });
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPost = async (postId: number, content: string) => {
    if (!currentUserId) return;

    try {
      await socialAPI.updatePost(postId, { content }, currentUserId);
      
      // Refresh posts to show the updated content
      await loadPosts();
      
      toast({
        title: "Success",
        description: "Your post has been updated!",
      });
    } catch (error) {
      console.error("Failed to update post:", error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!currentUserId) return;

    try {
      await socialAPI.deletePost(postId, currentUserId);
      
      // Refresh posts to remove the deleted post
      await loadPosts();
      
      toast({
        title: "Success",
        description: "Your post has been deleted!",
      });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!isLoading) {
      loadPosts();
    }
  }, [locationFilter, loadPosts, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Create post form */}
      {currentUser && (
        <CreatePost
          currentUser={currentUser}
          pickupLocations={pickupLocations}
          onCreatePost={handleCreatePost}
          isLoading={isCreatingPost}
        />
      )}

      {/* Posts feed */}
      <ScrollArea className="max-h-[75vh]">
        <div className="space-y-4 pr-4">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No posts yet in this feed.
              </p>
              {currentUser && (
                <p className="text-sm text-muted-foreground">
                  Be the first to share something with the community!
                </p>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                isAdmin={currentUser?.is_admin}
                onLike={handleLikePost}
                onComment={handleCommentOnPost}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SocialFeed; 