import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PenTool } from "lucide-react";
import { User, PickupLocation } from "@/lib/api";

interface CreatePostProps {
  currentUser: User;
  pickupLocations: PickupLocation[];
  onCreatePost: (content: string, locationFilter?: string) => void;
  isLoading?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({
  currentUser,
  pickupLocations,
  onCreatePost,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");

  const handleSubmit = () => {
    if (content.trim()) {
      onCreatePost(content.trim(), locationFilter || undefined);
      setContent("");
      setLocationFilter("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <PenTool className="h-5 w-5" />
          <span>Create a Post</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.image_url} />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">
              {currentUser.pickup_location}
            </p>
          </div>
        </div>

        <Textarea
          placeholder="What's on your mind? Share updates about the street meat event, ask questions, or connect with fellow food lovers!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] resize-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Post to:</span>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All locations</SelectItem>
                {pickupLocations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {content.length}/500
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || content.length > 500 || isLoading}
              className="bg-streetmeat-primary hover:bg-streetmeat-accent"
            >
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>

        {content.length > 500 && (
          <p className="text-sm text-destructive">
            Post is too long. Please keep it under 500 characters.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatePost; 