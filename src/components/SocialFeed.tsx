import React, { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { socialAPI, authAPI, Post, User, PickupLocation } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
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

  // WebSocket connection for real-time updates
  const { isConnected, connectionError } = useWebSocket({
    userId: currentUserId,
    locationFilter: locationFilter === "all" ? undefined : locationFilter,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      toast({
        title: "Connected",
        description: "Real-time updates enabled",
      });
    },
    onDisconnect: () => {
      toast({
        title: "Disconnected",
        description: "Real-time updates disabled",
        variant: "destructive",
      });
    },
  });

  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case "post_created":
        setPosts((prev) => [message.data, ...prev]);
        break;
      case "post_deleted":
        setPosts((prev) => prev.filter((post) => post.id !== message.data.post_id));
        break;
      case "post_like_toggled":
        setPosts((prev) =>
          prev.map((post) =>
            post.id === message.data.post_id
              ? {
                  ...post,
                  likes_count: message.data.likes_count,
                  is_liked_by_user: currentUserId === message.user_id ? message.data.liked : post.is_liked_by_user,
                }
              : post
          )
        );
        break;
      case "comment_created":
        setPosts((prev) =>
          prev.map((post) =>
            post.id === message.data.post_id
              ? {
                  ...post,
                  comments_count: post.comments_count + 1,
                  comments: [...post.comments, message.data],
                }
              : post
          )
        );
        break;
      case "comment_deleted":
        setPosts((prev) =>
          prev.map((post) =>
            post.id === message.data.post_id
              ? {
                  ...post,
                  comments_count: Math.max(0, post.comments_count - 1),
                  comments: post.comments.filter((comment) => comment.id !== message.data.comment_id),
                }
              : post
          )
        );
        break;
      case "comment_like_toggled":
        setPosts((prev) =>
          prev.map((post) =>
            post.id === message.data.post_id
              ? {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment.id === message.data.comment_id
                      ? {
                          ...comment,
                          likes_count: message.data.likes_count,
                          is_liked_by_user: currentUserId === message.user_id ? message.data.liked : comment.is_liked_by_user,
                        }
                      : comment
                  ),
                }
              : post
          )
        );
        break;
    }
  }

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
      setPosts(postsData);
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
          <p className="text-muted-foreground">Loading social feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Live updates enabled" : "Offline mode"}
          </span>
        </div>
        
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
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No posts yet in this feed.
            </p>
            {currentUser && (
              <p className="text-muted-foreground">
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

      {connectionError && (
        <div className="text-center py-4">
          <p className="text-sm text-destructive">{connectionError}</p>
        </div>
      )}
    </div>
  );
};

export default SocialFeed; 