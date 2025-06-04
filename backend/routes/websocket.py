from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
import asyncio
from ..schemas import WebSocketMessage

router = APIRouter()


class WebSocketManager:
    def __init__(self):
        # Store active connections by user_id and location_filter
        self.active_connections: Dict[WebSocket, Dict[str, any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, location_filter: Optional[str] = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[websocket] = {
            "user_id": user_id,
            "location_filter": location_filter
        }
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            del self.active_connections[websocket]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except:
            # Connection might be closed
            self.disconnect(websocket)
    
    async def broadcast_message(self, message: WebSocketMessage):
        """Broadcast message to relevant connections based on location filter"""
        message_json = json.dumps(message.model_dump())
        
        # Create a list of connections to avoid dictionary changing during iteration
        connections_to_notify = []
        
        for websocket, connection_info in self.active_connections.items():
            should_notify = False
            
            # Always notify if no location filter is specified in the message
            if not message.location_filter:
                should_notify = True
            # If connection has no location filter, receive all messages
            elif not connection_info["location_filter"]:
                should_notify = True
            # If location filters match
            elif connection_info["location_filter"] == message.location_filter:
                should_notify = True
            # Special case: if location filter is "all", notify everyone
            elif message.location_filter == "all":
                should_notify = True
            
            if should_notify:
                connections_to_notify.append(websocket)
        
        # Send messages to all relevant connections
        for websocket in connections_to_notify:
            try:
                await websocket.send_text(message_json)
            except:
                # Connection might be closed, remove it
                self.disconnect(websocket)
    
    async def broadcast_to_location(self, message: str, location_filter: str):
        """Broadcast message to users in a specific location"""
        connections_to_notify = [
            websocket for websocket, connection_info in self.active_connections.items()
            if connection_info["location_filter"] == location_filter or 
               connection_info["location_filter"] is None or
               location_filter == "all"
        ]
        
        for websocket in connections_to_notify:
            try:
                await websocket.send_text(message)
            except:
                self.disconnect(websocket)
    
    def get_connection_count(self) -> int:
        """Get the number of active connections"""
        return len(self.active_connections)
    
    def get_connections_by_location(self, location_filter: str) -> int:
        """Get the number of connections for a specific location"""
        return len([
            conn for conn in self.active_connections.values()
            if conn["location_filter"] == location_filter or conn["location_filter"] is None
        ])


# Global WebSocket manager instance
websocket_manager = WebSocketManager()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, location_filter: Optional[str] = None):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket, user_id, location_filter)
    
    try:
        # Send initial connection confirmation
        await websocket_manager.send_personal_message(
            json.dumps({
                "type": "connection_established",
                "data": {
                    "user_id": user_id,
                    "location_filter": location_filter,
                    "total_connections": websocket_manager.get_connection_count()
                }
            }),
            websocket
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for incoming messages (like ping/pong or client-side events)
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different types of client messages
                if message_data.get("type") == "ping":
                    await websocket_manager.send_personal_message(
                        json.dumps({"type": "pong", "data": {}}),
                        websocket
                    )
                elif message_data.get("type") == "location_change":
                    # Update user's location filter
                    new_location = message_data.get("location_filter")
                    websocket_manager.active_connections[websocket]["location_filter"] = new_location
                    
                    await websocket_manager.send_personal_message(
                        json.dumps({
                            "type": "location_changed",
                            "data": {"location_filter": new_location}
                        }),
                        websocket
                    )
                
            except json.JSONDecodeError:
                # Invalid JSON received, ignore
                continue
            except WebSocketDisconnect:
                break
            except Exception as e:
                # Log error but continue
                print(f"WebSocket error: {e}")
                continue
                
    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "total_connections": websocket_manager.get_connection_count(),
        "connections_by_location": {
            location: websocket_manager.get_connections_by_location(location)
            for location in ["all", "Mars", "Kappa Sigma", "EVGR"]  # Add your locations
        }
    } 